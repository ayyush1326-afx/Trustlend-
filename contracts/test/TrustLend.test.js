const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TrustLend DeFi Protocol", function () {
  let deployer, lender1, lender2, borrower1, borrower2, liquidator;
  let registry, pool;

  const INITIAL_SCORE = 100n;
  const ONE_ETH = ethers.parseEther("1.0");
  const POINT_ONE_ETH = ethers.parseEther("0.1");
  const POINT_ZERO_FIVE_ETH = ethers.parseEther("0.05");

  beforeEach(async function () {
    [deployer, lender1, lender2, borrower1, borrower2, liquidator] = await ethers.getSigners();

    // Deploy ReputationRegistry with demoMode enabled
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    registry = await ReputationRegistry.deploy(true);
    await registry.waitForDeployment();

    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    pool = await LendingPool.deploy(await registry.getAddress());
    await pool.waitForDeployment();

    // Set LendingPool in registry
    await registry.setLendingPool(await pool.getAddress());
  });

  describe("ReputationRegistry - Initialization & Access Control", function () {
    it("should initialize default score to 100 for new wallets", async function () {
      expect(await registry.getScore(borrower1.address)).to.equal(INITIAL_SCORE);
      expect(await registry.getTier(borrower1.address)).to.equal(0); // Newcomer
    });

    it("should prevent setting lending pool a second time", async function () {
      await expect(registry.setLendingPool(pool.target)).to.be.revertedWithCustomError(
        registry,
        "LendingPoolAlreadySet"
      );
    });

    it("should revert if non-owner attempts to set lending pool", async function () {
      const RegistryFactory = await ethers.getContractFactory("ReputationRegistry");
      const testRegistry = await RegistryFactory.deploy(true);
      await expect(
        testRegistry.connect(borrower1).setLendingPool(pool.target)
      ).to.be.revertedWithCustomError(testRegistry, "NotOwner");
    });

    it("should revert if non-lending-pool calls onTimeRepayment or defaulted", async function () {
      await expect(
        registry.connect(borrower1).onTimeRepayment(borrower1.address)
      ).to.be.revertedWithCustomError(registry, "OnlyLendingPool");

      await expect(
        registry.connect(borrower1).defaulted(borrower1.address)
      ).to.be.revertedWithCustomError(registry, "OnlyLendingPool");
    });

    it("should allow seedScore only in demoMode and only by owner", async function () {
      // Owner can seed score
      await registry.seedScore(borrower1.address, 450);
      expect(await registry.getScore(borrower1.address)).to.equal(450n);
      expect(await registry.getTier(borrower1.address)).to.equal(2); // Silver

      // Non-owner cannot seed score
      await expect(
        registry.connect(borrower1).seedScore(borrower1.address, 800)
      ).to.be.revertedWithCustomError(registry, "NotOwner");

      // Score cannot exceed 1000
      await expect(
        registry.seedScore(borrower1.address, 1001)
      ).to.be.revertedWithCustomError(registry, "InvalidScore");

      // When demoMode is false, seedScore reverts with DemoModeDisabled
      const RegistryFactory = await ethers.getContractFactory("ReputationRegistry");
      const prodRegistry = await RegistryFactory.deploy(false);
      await expect(
        prodRegistry.seedScore(borrower1.address, 500)
      ).to.be.revertedWithCustomError(prodRegistry, "DemoModeDisabled");
    });

    it("should verify tier configuration table accurately", async function () {
      // Tier 0: Newcomer 150%, 0.05 ETH
      let [name, collBps, maxBorrow] = await registry.getTierConfig(0);
      expect(name).to.equal("Newcomer");
      expect(collBps).to.equal(15000n);
      expect(maxBorrow).to.equal(ethers.parseEther("0.05"));

      // Tier 1: Bronze 125%, 0.10 ETH
      [name, collBps, maxBorrow] = await registry.getTierConfig(1);
      expect(name).to.equal("Bronze");
      expect(collBps).to.equal(12500n);
      expect(maxBorrow).to.equal(ethers.parseEther("0.10"));

      // Tier 2: Silver 100%, 0.25 ETH
      [name, collBps, maxBorrow] = await registry.getTierConfig(2);
      expect(name).to.equal("Silver");
      expect(collBps).to.equal(10000n);
      expect(maxBorrow).to.equal(ethers.parseEther("0.25"));

      // Tier 3: Gold 75%, 0.50 ETH
      [name, collBps, maxBorrow] = await registry.getTierConfig(3);
      expect(name).to.equal("Gold");
      expect(collBps).to.equal(7500n);
      expect(maxBorrow).to.equal(ethers.parseEther("0.50"));

      // Tier 4: Platinum 50%, 1.00 ETH
      [name, collBps, maxBorrow] = await registry.getTierConfig(4);
      expect(name).to.equal("Platinum");
      expect(collBps).to.equal(5000n);
      expect(maxBorrow).to.equal(ethers.parseEther("1.00"));
    });
  });

  describe("LendingPool - Deposits & Withdrawals Math", function () {
    it("should allow initial deposit and mint shares 1:1", async function () {
      await expect(pool.connect(lender1).deposit({ value: ONE_ETH }))
        .to.emit(pool, "Deposited")
        .withArgs(lender1.address, ONE_ETH, ONE_ETH);

      expect(await pool.totalShares()).to.equal(ONE_ETH);
      expect(await pool.shares(lender1.address)).to.equal(ONE_ETH);
      expect(await pool.getLiquidity()).to.equal(ONE_ETH);
      expect(await pool.getPoolValue()).to.equal(ONE_ETH);
      expect(await pool.sharesValue(lender1.address)).to.equal(ONE_ETH);
    });

    it("should revert zero value deposits", async function () {
      await expect(pool.connect(lender1).deposit({ value: 0n })).to.be.revertedWithCustomError(
        pool,
        "ZeroAmount"
      );
    });

    it("should correctly handle subsequent deposits and share dilution", async function () {
      await pool.connect(lender1).deposit({ value: ONE_ETH });

      // Second lender deposits 2 ETH
      const twoEth = ethers.parseEther("2.0");
      await pool.connect(lender2).deposit({ value: twoEth });

      expect(await pool.totalShares()).to.equal(ethers.parseEther("3.0"));
      expect(await pool.shares(lender2.address)).to.equal(twoEth);
      expect(await pool.getPoolValue()).to.equal(ethers.parseEther("3.0"));
    });

    it("should allow full withdrawal when liquidity is available", async function () {
      await pool.connect(lender1).deposit({ value: ONE_ETH });

      const balBefore = await ethers.provider.getBalance(lender1.address);
      const tx = await pool.connect(lender1).withdraw(ONE_ETH);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balAfter = await ethers.provider.getBalance(lender1.address);
      expect(balAfter + gasCost - balBefore).to.equal(ONE_ETH);

      expect(await pool.totalShares()).to.equal(0n);
      expect(await pool.shares(lender1.address)).to.equal(0n);
    });

    it("should block withdrawal if payout exceeds available liquidity", async function () {
      // Lender deposits 1 ETH
      await pool.connect(lender1).deposit({ value: ONE_ETH });

      // Seed borrower score to Platinum (50% collateral, 1 ETH max)
      await registry.seedScore(borrower1.address, 850);

      // Borrower borrows 0.8 ETH with 0.4 ETH collateral
      const borrowAmt = ethers.parseEther("0.8");
      const collAmt = ethers.parseEther("0.4");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      // Pool balance is 1 - 0.8 + 0.4 = 0.6 ETH
      // Total locked collateral = 0.4 ETH
      // Available liquidity = 0.6 - 0.4 = 0.2 ETH
      // Pool value = liquidity (0.2) + borrowed (0.8) = 1.0 ETH
      // Lender holds 100% of shares (1.0 ETH worth)
      // Attempting to withdraw all shares requires 1.0 ETH, but only 0.2 ETH is available!
      await expect(
        pool.connect(lender1).withdraw(ONE_ETH)
      ).to.be.revertedWithCustomError(pool, "InsufficientLiquidity");
    });

    it("should revert if lender attempts to burn more shares than owned", async function () {
      await pool.connect(lender1).deposit({ value: ONE_ETH });
      await expect(
        pool.connect(lender1).withdraw(ethers.parseEther("1.1"))
      ).to.be.revertedWithCustomError(pool, "InsufficientShares");
    });
  });

  describe("Borrowing Mechanics & Tier Enforcement", function () {
    beforeEach(async function () {
      // Seed pool with 5 ETH liquidity
      await pool.connect(lender1).deposit({ value: ethers.parseEther("5.0") });
    });

    it("should enforce Newcomer tier parameters (150% collateral, max 0.05 ETH)", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH; // 0.05 ETH
      const requiredColl = ethers.parseEther("0.075"); // 150% = 0.075 ETH

      // Revert if borrow exceeds max borrow (0.051 ETH)
      await expect(
        pool.connect(borrower1).borrow(ethers.parseEther("0.051"), 3600, {
          value: ethers.parseEther("0.0765"),
        })
      ).to.be.revertedWithCustomError(pool, "ExceedsMaxBorrow");

      // Revert if collateral is incorrect
      await expect(
        pool.connect(borrower1).borrow(borrowAmt, 3600, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWithCustomError(pool, "InvalidCollateralAmount");

      // Successful borrow
      await expect(pool.connect(borrower1).borrow(borrowAmt, 3600, { value: requiredColl }))
        .to.emit(pool, "Borrowed");

      const loan = await pool.getLoan(1);
      expect(loan.principal).to.equal(borrowAmt);
      expect(loan.collateral).to.equal(requiredColl);
      expect(loan.fee).to.equal((borrowAmt * 5n) / 100n);
      expect(await pool.activeLoanOf(borrower1.address)).to.equal(1n);
    });

    it("should prevent taking a second active loan simultaneously", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const requiredColl = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: requiredColl });

      // Second loan attempt reverts
      await expect(
        pool.connect(borrower1).borrow(borrowAmt, 3600, { value: requiredColl })
      ).to.be.revertedWithCustomError(pool, "ActiveLoanExists");
    });

    it("should revert if duration is out of allowed bounds (<60s or >90d)", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const requiredColl = ethers.parseEther("0.075");

      // Less than 60s
      await expect(
        pool.connect(borrower1).borrow(borrowAmt, 59, { value: requiredColl })
      ).to.be.revertedWithCustomError(pool, "InvalidDuration");

      // Greater than 90 days
      await expect(
        pool.connect(borrower1).borrow(borrowAmt, 90 * 24 * 3600 + 1, { value: requiredColl })
      ).to.be.revertedWithCustomError(pool, "InvalidDuration");
    });

    it("should revert if pool liquidity is insufficient to fund loan", async function () {
      // Empty pool with a single lender deposit of 0.05 ETH
      const RegistryFactory = await ethers.getContractFactory("ReputationRegistry");
      const reg = await RegistryFactory.deploy(true);
      const LendingPool = await ethers.getContractFactory("LendingPool");
      const lowPool = await LendingPool.deploy(await reg.getAddress());
      await reg.setLendingPool(await lowPool.getAddress());

      await lowPool.connect(lender1).deposit({ value: ethers.parseEther("0.02") });

      // Borrower asks 0.05 ETH, but pool only has 0.02 ETH
      await expect(
        lowPool.connect(borrower1).borrow(POINT_ZERO_FIVE_ETH, 3600, {
          value: ethers.parseEther("0.075"),
        })
      ).to.be.revertedWithCustomError(lowPool, "InsufficientLiquidity");
    });

    it("should correctly borrow under-collateralized at Platinum tier (50% collateral)", async function () {
      // Seed borrower1 to Platinum (score 850)
      await registry.seedScore(borrower1.address, 850);
      const borrowAmt = ONE_ETH; // 1.0 ETH max
      const requiredColl = ethers.parseEther("0.5"); // 50% collateral

      await expect(pool.connect(borrower1).borrow(borrowAmt, 7200, { value: requiredColl }))
        .to.emit(pool, "Borrowed");

      const loan = await pool.getLoan(1);
      expect(loan.collateral).to.equal(requiredColl);
      expect(loan.principal).to.equal(borrowAmt);
    });
  });

  describe("Repayment & Credit Score Dynamics", function () {
    beforeEach(async function () {
      await pool.connect(lender1).deposit({ value: ethers.parseEther("5.0") });
    });

    it("on-time repayment increases credit score by +50 and accrues 5% fee to lenders", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      const fee = (borrowAmt * 5n) / 100n; // 0.0025 ETH
      const totalDue = borrowAmt + fee;

      const scoreBefore = await registry.getScore(borrower1.address);
      const poolValueBefore = await pool.getPoolValue();

      // Repay on time
      await expect(pool.connect(borrower1).repay(1, { value: totalDue }))
        .to.emit(pool, "Repaid")
        .withArgs(1n, borrower1.address, borrowAmt, fee, false);

      const scoreAfter = await registry.getScore(borrower1.address);
      expect(scoreAfter).to.equal(scoreBefore + 50n);

      // Verify active loan cleared
      expect(await pool.activeLoanOf(borrower1.address)).to.equal(0n);

      // Verify fee accrued into pool value
      const poolValueAfter = await pool.getPoolValue();
      expect(poolValueAfter).to.equal(poolValueBefore + fee);
    });

    it("repayment reverts if non-borrower calls or payment amount is incorrect", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      const totalDue = borrowAmt + (borrowAmt * 5n) / 100n;

      // Another user cannot repay
      await expect(
        pool.connect(borrower2).repay(1, { value: totalDue })
      ).to.be.revertedWithCustomError(pool, "NotBorrower");

      // Wrong repayment amount
      await expect(
        pool.connect(borrower1).repay(1, { value: totalDue - 1n })
      ).to.be.revertedWithCustomError(pool, "InvalidRepaymentAmount");
    });

    it("late repayment after dueTime allows debt settlement but gives NO reputation score gain", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      // Fast forward past due time
      await time.increase(3601);

      const scoreBefore = await registry.getScore(borrower1.address);
      const totalDue = borrowAmt + (borrowAmt * 5n) / 100n;

      // Repay late
      await expect(pool.connect(borrower1).repay(1, { value: totalDue }))
        .to.emit(pool, "Repaid")
        .withArgs(1n, borrower1.address, borrowAmt, (borrowAmt * 5n) / 100n, true);

      // Score did NOT increase
      const scoreAfter = await registry.getScore(borrower1.address);
      expect(scoreAfter).to.equal(scoreBefore);

      const loan = await pool.getLoan(1);
      expect(loan.repaidLate).to.be.true;
    });

    it("double repayment on already settled loan reverts", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });
      const totalDue = borrowAmt + (borrowAmt * 5n) / 100n;

      await pool.connect(borrower1).repay(1, { value: totalDue });

      // Second repay attempt
      await expect(
        pool.connect(borrower1).repay(1, { value: totalDue })
      ).to.be.revertedWithCustomError(pool, "LoanNotActive");
    });
  });

  describe("Liquidation & Default Mechanics", function () {
    beforeEach(async function () {
      await pool.connect(lender1).deposit({ value: ethers.parseEther("5.0") });
    });

    it("liquidation before dueTime reverts", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      await expect(
        pool.connect(liquidator).liquidate(1)
      ).to.be.revertedWithCustomError(pool, "LoanNotOverdue");
    });

    it("liquidator after dueTime seizes collateral, drops score by -300, and clears loan", async function () {
      // Seed borrower score to 400 (Silver tier)
      await registry.seedScore(borrower1.address, 400);

      const borrowAmt = ethers.parseEther("0.2"); // 0.2 ETH
      const collAmt = ethers.parseEther("0.2");   // 100% collateral = 0.2 ETH
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      // Time travel past dueTime
      await time.increase(3601);

      const lockedBefore = await pool.totalCollateralLocked();
      const borrowedBefore = await pool.totalBorrowed();

      // Liquidator calls liquidate
      await expect(pool.connect(liquidator).liquidate(1))
        .to.emit(pool, "Liquidated")
        .withArgs(1n, borrower1.address, liquidator.address, collAmt);

      // Score drops by 300 (400 -> 100)
      expect(await registry.getScore(borrower1.address)).to.equal(100n);

      // Collateral unlocked and absorbed into pool liquidity
      expect(await pool.totalCollateralLocked()).to.equal(lockedBefore - collAmt);
      expect(await pool.totalBorrowed()).to.equal(borrowedBefore - borrowAmt);

      // Active loan cleared
      expect(await pool.activeLoanOf(borrower1.address)).to.equal(0n);

      const loan = await pool.getLoan(1);
      expect(loan.status).to.equal(2); // Defaulted
    });

    it("score floors at 0 after multiple defaults and does not underflow", async function () {
      // Seed score to 150
      await registry.seedScore(borrower1.address, 150);

      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      await time.increase(3601);

      // Liquidate (150 - 300 should floor at 0)
      await pool.connect(liquidator).liquidate(1);

      expect(await registry.getScore(borrower1.address)).to.equal(0n);
      expect(await registry.getTier(borrower1.address)).to.equal(0);
    });

    it("liquidating an already settled or liquidated loan reverts", async function () {
      const borrowAmt = POINT_ZERO_FIVE_ETH;
      const collAmt = ethers.parseEther("0.075");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      await time.increase(3601);
      await pool.connect(liquidator).liquidate(1);

      // Second liquidation attempt
      await expect(
        pool.connect(liquidator).liquidate(1)
      ).to.be.revertedWithCustomError(pool, "LoanNotActive");
    });
  });

  describe("Tier Progression & Edge Cases", function () {
    it("progresses through tiers from Newcomer to Platinum and caps at 1000", async function () {
      await pool.connect(lender1).deposit({ value: ethers.parseEther("10.0") });

      // Start at 100 (Newcomer)
      expect(await registry.getTier(borrower1.address)).to.equal(0);

      // Seed to 199 -> still Newcomer
      await registry.seedScore(borrower1.address, 199);
      expect(await registry.getTier(borrower1.address)).to.equal(0);

      // Seed to 200 -> Bronze
      await registry.seedScore(borrower1.address, 200);
      expect(await registry.getTier(borrower1.address)).to.equal(1);

      // Seed to 400 -> Silver
      await registry.seedScore(borrower1.address, 400);
      expect(await registry.getTier(borrower1.address)).to.equal(2);

      // Seed to 600 -> Gold
      await registry.seedScore(borrower1.address, 600);
      expect(await registry.getTier(borrower1.address)).to.equal(3);

      // Seed to 800 -> Platinum
      await registry.seedScore(borrower1.address, 800);
      expect(await registry.getTier(borrower1.address)).to.equal(4);

      // Seed to 980, then repay on time to test 1000 cap
      await registry.seedScore(borrower1.address, 980);
      await pool.connect(borrower1).borrow(POINT_ZERO_FIVE_ETH, 3600, {
        value: ethers.parseEther("0.025"), // 50% collateral
      });

      const totalDue = POINT_ZERO_FIVE_ETH + (POINT_ZERO_FIVE_ETH * 5n) / 100n;
      await pool.connect(borrower1).repay(1, { value: totalDue });

      // Capped at 1000 (980 + 50 = 1030 -> capped to 1000)
      expect(await registry.getScore(borrower1.address)).to.equal(1000n);
    });

    it("reports pool statistics accurately", async function () {
      await pool.connect(lender1).deposit({ value: ethers.parseEther("4.0") });

      // Seed borrower to Gold (75% collateral, 0.5 ETH max)
      await registry.seedScore(borrower1.address, 650);

      const borrowAmt = ethers.parseEther("0.5");
      const collAmt = ethers.parseEther("0.375");
      await pool.connect(borrower1).borrow(borrowAmt, 3600, { value: collAmt });

      const stats = await pool.getPoolStats();
      // liquidity: 4 - 0.5 = 3.5 ETH
      expect(stats.liquidity).to.equal(ethers.parseEther("3.5"));
      // borrowed: 0.5 ETH
      expect(stats.borrowed).to.equal(ethers.parseEther("0.5"));
      // poolValue: 3.5 + 0.5 = 4.0 ETH
      expect(stats.poolValue).to.equal(ethers.parseEther("4.0"));
      // utilizationBps: 0.5 / 4.0 = 12.5% = 1250 bps
      expect(stats.utilizationBps).to.equal(1250n);
      expect(stats.totalLoanCount).to.equal(1n);
    });
  });
});
