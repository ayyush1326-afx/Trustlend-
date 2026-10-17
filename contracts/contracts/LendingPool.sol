// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IReputationRegistry.sol";

/**
 * @title LendingPool
 * @notice Under-collateralized DeFi Lending Pool powered by TrustLend Reputation Registry.
 * @dev Lenders deposit ETH to earn yields from 5% flat loan fees.
 *      Borrowers deposit tier-adjusted collateral to borrow ETH.
 *      On-time repayment releases collateral and increases reputation score.
 *      Defaulted loans seize collateral into pool liquidity and penalize reputation.
 *      Zero admin backdoors; nonReentrant on all ETH transfers; strictly adheres to
 *      Checks-Effects-Interactions.
 */
contract LendingPool is ReentrancyGuard {
    // --- Data Types ---
    enum LoanStatus {
        Active,
        Repaid,
        Defaulted
    }

    struct Loan {
        uint256 id;
        address borrower;
        uint256 principal;
        uint256 fee;
        uint256 collateral;
        uint256 startTime;
        uint256 dueTime;
        LoanStatus status;
        bool repaidLate;
    }

    // --- Custom Errors ---
    error ZeroAmount();
    error ZeroSharesMinted();
    error InsufficientLiquidity(uint256 requested, uint256 available);
    error InsufficientShares(uint256 requested, uint256 available);
    error ActiveLoanExists(uint256 loanId);
    error ExceedsMaxBorrow(uint256 requested, uint256 maxBorrow);
    error InvalidDuration(uint256 duration);
    error InvalidCollateralAmount(uint256 expected, uint256 actual);
    error LoanNotActive();
    error NotBorrower();
    error InvalidRepaymentAmount(uint256 expected, uint256 actual);
    error LoanNotOverdue();
    error ETHTransferFailed();
    error ZeroAddress();
    error LoanNotFound();

    // --- Events ---
    event Deposited(address indexed lender, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed lender, uint256 sharesBurned, uint256 payout);
    event Borrowed(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 fee,
        uint256 collateral,
        uint256 dueTime
    );
    event Repaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 fee,
        bool repaidLate
    );
    event Liquidated(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed liquidator,
        uint256 collateralSeized
    );

    // --- State Variables ---
    IReputationRegistry public immutable registry;

    uint256 public totalShares;
    uint256 public totalCollateralLocked;
    uint256 public totalBorrowed; // Total outstanding principal
    uint256 public loanCount;

    // Lending shares mapping
    mapping(address => uint256) public shares;

    // Loans storage
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) private _borrowerLoans;
    mapping(address => uint256) public activeLoanOf; // 0 if no active loan

    // Constants
    uint256 public constant MIN_DURATION = 60 seconds;
    uint256 public constant MAX_DURATION = 90 days;
    uint256 public constant FLAT_FEE_PERCENT = 5; // 5% flat fee
    uint256 public constant BPS_DIVISOR = 10000;

    /**
     * @param _registry Address of the ReputationRegistry contract.
     */
    constructor(address _registry) {
        if (_registry == address(0)) revert ZeroAddress();
        registry = IReputationRegistry(_registry);
    }

    // --- Modifiers ---
    modifier loanExists(uint256 loanId) {
        if (loanId == 0 || loanId > loanCount) revert LoanNotFound();
        _;
    }

    // --- Core Accounting Views ---

    /**
     * @notice Available unencumbered ETH liquidity in the pool.
     */
    function getLiquidity() public view returns (uint256) {
        if (address(this).balance <= totalCollateralLocked) {
            return 0;
        }
        return address(this).balance - totalCollateralLocked;
    }

    /**
     * @notice Total pool value: available liquidity plus outstanding loan principals.
     */
    function getPoolValue() public view returns (uint256) {
        return getLiquidity() + totalBorrowed;
    }

    /**
     * @notice Current value of shares held by a user.
     * @param user Lender address.
     */
    function sharesValue(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[user] * getPoolValue()) / totalShares;
    }

    // --- Lender Operations ---

    /**
     * @notice Deposit ETH into pool to receive proportional shares and earn fee yield.
     */
    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        // Note: msg.value is already added to address(this).balance upon function entry.
        // Pool value prior to this deposit:
        uint256 balanceBefore = address(this).balance - msg.value;
        uint256 liquidityBefore = balanceBefore > totalCollateralLocked
            ? balanceBefore - totalCollateralLocked
            : 0;
        uint256 poolValueBefore = liquidityBefore + totalBorrowed;

        uint256 sharesToMint;
        if (totalShares == 0 || poolValueBefore == 0) {
            sharesToMint = msg.value;
        } else {
            sharesToMint = (msg.value * totalShares) / poolValueBefore;
        }

        if (sharesToMint == 0) revert ZeroSharesMinted();

        shares[msg.sender] += sharesToMint;
        totalShares += sharesToMint;

        emit Deposited(msg.sender, msg.value, sharesToMint);
    }

    /**
     * @notice Withdraw ETH by burning pool shares.
     * @param sharesAmount Number of shares to burn.
     */
    function withdraw(uint256 sharesAmount) external nonReentrant {
        if (sharesAmount == 0) revert ZeroAmount();
        if (shares[msg.sender] < sharesAmount) {
            revert InsufficientShares(sharesAmount, shares[msg.sender]);
        }

        uint256 currentLiquidity = getLiquidity();
        uint256 currentPoolValue = currentLiquidity + totalBorrowed;
        uint256 payout = (sharesAmount * currentPoolValue) / totalShares;

        if (payout > currentLiquidity) {
            revert InsufficientLiquidity(payout, currentLiquidity);
        }

        // Checks-Effects-Interactions: burn shares first
        shares[msg.sender] -= sharesAmount;
        totalShares -= sharesAmount;

        emit Withdrawn(msg.sender, sharesAmount, payout);

        // Send ETH payout to lender
        (bool success, ) = msg.sender.call{value: payout}("");
        if (!success) revert ETHTransferFailed();
    }

    // --- Borrower Operations ---

    /**
     * @notice Borrow ETH against required tier collateral.
     * @param amount Requested principal loan amount in wei.
     * @param durationSeconds Loan duration in seconds (between 60 seconds and 90 days).
     */
    function borrow(uint256 amount, uint256 durationSeconds) external payable nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (durationSeconds < MIN_DURATION || durationSeconds > MAX_DURATION) {
            revert InvalidDuration(durationSeconds);
        }

        uint256 currentActiveLoan = activeLoanOf[msg.sender];
        if (currentActiveLoan != 0) {
            revert ActiveLoanExists(currentActiveLoan);
        }

        // Query tier details from Reputation Registry
        (, , , uint256 collateralBps, uint256 maxBorrowWei) = registry.getUserTierDetails(msg.sender);

        if (amount > maxBorrowWei) {
            revert ExceedsMaxBorrow(amount, maxBorrowWei);
        }

        uint256 requiredCollateral = (amount * collateralBps) / BPS_DIVISOR;
        if (msg.value != requiredCollateral) {
            revert InvalidCollateralAmount(requiredCollateral, msg.value);
        }

        // Available liquidity before this loan (msg.value already in balance, collateral not yet locked)
        uint256 balanceBefore = address(this).balance - msg.value;
        uint256 availableLiquidity = balanceBefore > totalCollateralLocked
            ? balanceBefore - totalCollateralLocked
            : 0;

        if (amount > availableLiquidity) {
            revert InsufficientLiquidity(amount, availableLiquidity);
        }

        uint256 fee = (amount * FLAT_FEE_PERCENT) / 100;
        uint256 dueTime = block.timestamp + durationSeconds;

        loanCount++;
        uint256 loanId = loanCount;

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            principal: amount,
            fee: fee,
            collateral: msg.value,
            startTime: block.timestamp,
            dueTime: dueTime,
            status: LoanStatus.Active,
            repaidLate: false
        });

        _borrowerLoans[msg.sender].push(loanId);
        activeLoanOf[msg.sender] = loanId;
        totalCollateralLocked += msg.value;
        totalBorrowed += amount;

        emit Borrowed(loanId, msg.sender, amount, fee, msg.value, dueTime);

        // Send principal to borrower
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert ETHTransferFailed();
    }

    /**
     * @notice Repay an active loan in full (principal + fee).
     * @param loanId ID of the loan to repay.
     */
    function repay(uint256 loanId) external payable nonReentrant loanExists(loanId) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (loan.borrower != msg.sender) revert NotBorrower();

        uint256 totalDue = loan.principal + loan.fee;
        if (msg.value != totalDue) {
            revert InvalidRepaymentAmount(totalDue, msg.value);
        }

        // State changes before external calls
        totalBorrowed -= loan.principal;
        uint256 collateralToReturn = loan.collateral;
        totalCollateralLocked -= collateralToReturn;
        activeLoanOf[msg.sender] = 0;
        loan.status = LoanStatus.Repaid;

        bool isLate = block.timestamp > loan.dueTime;
        if (isLate) {
            loan.repaidLate = true;
        } else {
            // Reward on-time repayment in registry (+50 pts)
            registry.onTimeRepayment(msg.sender);
        }

        emit Repaid(loanId, msg.sender, loan.principal, loan.fee, isLate);

        // Return collateral to borrower
        (bool success, ) = msg.sender.call{value: collateralToReturn}("");
        if (!success) revert ETHTransferFailed();
    }

    /**
     * @notice Liquidate an overdue active loan. Callable by anyone after dueTime.
     * @dev Seizes collateral into pool liquidity, reduces totalBorrowed, and applies reputation penalty.
     * @param loanId ID of the loan to liquidate.
     */
    function liquidate(uint256 loanId) external nonReentrant loanExists(loanId) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (block.timestamp <= loan.dueTime) revert LoanNotOverdue();

        address borrower = loan.borrower;
        uint256 seizedCollateral = loan.collateral;

        // Mark defaulted and update accounting
        loan.status = LoanStatus.Defaulted;
        totalBorrowed -= loan.principal;
        totalCollateralLocked -= seizedCollateral;
        activeLoanOf[borrower] = 0;

        // Penalize reputation in registry (-300 pts)
        registry.defaulted(borrower);

        emit Liquidated(loanId, borrower, msg.sender, seizedCollateral);
    }

    // --- View Helpers ---

    /**
     * @notice Required collateral for a given user and borrow amount.
     */
    function getRequiredCollateral(address user, uint256 amount) external view returns (uint256) {
        (, , , uint256 collateralBps, ) = registry.getUserTierDetails(user);
        return (amount * collateralBps) / BPS_DIVISOR;
    }

    /**
     * @notice Maximum borrow cap for a user based on their tier.
     */
    function getMaxBorrow(address user) external view returns (uint256) {
        (, , , , uint256 maxBorrowWei) = registry.getUserTierDetails(user);
        return maxBorrowWei;
    }

    /**
     * @notice All loan IDs initiated by a borrower.
     */
    function getBorrowerLoans(address user) external view returns (uint256[] memory) {
        return _borrowerLoans[user];
    }

    /**
     * @notice Retrieve single loan details by ID.
     */
    function getLoan(uint256 id) external view loanExists(id) returns (Loan memory) {
        return loans[id];
    }

    /**
     * @notice Comprehensive statistics for dashboard metrics and utilization.
     */
    function getPoolStats()
        external
        view
        returns (
            uint256 liquidity,
            uint256 borrowed,
            uint256 poolValue,
            uint256 utilizationBps,
            uint256 sharesTotal,
            uint256 totalLoanCount
        )
    {
        liquidity = getLiquidity();
        borrowed = totalBorrowed;
        poolValue = liquidity + borrowed;
        utilizationBps = poolValue > 0 ? (borrowed * BPS_DIVISOR) / poolValue : 0;
        sharesTotal = totalShares;
        totalLoanCount = loanCount;
    }
}
