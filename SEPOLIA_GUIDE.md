# TrustLend: Step-by-Step Ethereum Sepolia Guide

This comprehensive guide takes you from zero to a live, working deployment of TrustLend on the **Ethereum Sepolia Testnet** with 3 distinct MetaMask accounts for judging and demonstration.

---

## 1. Setup MetaMask with 3 Demo Accounts

To demonstrate the full lifecycle of lending, borrowing, tier upgrades, and liquidation, configure **3 accounts** in MetaMask:

1. **Account 1: "Lender / Deployer"**
   - Role: Deploys smart contracts, deposits initial ETH liquidity into the pool, and acts as liquidator.
2. **Account 2: "Good Borrower"**
   - Role: Starts at score 100 (Newcomer tier), borrows ETH, repays on-time, builds credit up to score 150+.
3. **Account 3: "Defaulter Borrower"**
   - Role: Borrows ETH on a 1-minute duration, lets the loan expire without repayment, and gets liquidated by Account 1.

---

## 2. Obtain Sepolia Testnet ETH

Ensure all 3 accounts have Sepolia ETH. Recommended faucets:

- **Google Cloud Web3 Faucet** (Fastest, no login required):  
  [https://cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- **Alchemy Sepolia Faucet** (0.5 ETH / day):  
  [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
- **Infura Sepolia Faucet**:  
  [https://www.infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)
- **Sepolia PoW Faucet** (Mining faucet if standard faucets are empty):  
  [https://sepolia-faucet.pk910.de/](https://sepolia-faucet.pk910.de/)

**Recommended balance distribution:**
- Account 1 (Deployer / Lender): `~0.5 - 1.0 ETH`
- Account 2 (Good Borrower): `~0.15 ETH`
- Account 3 (Defaulter): `~0.15 ETH`

---

## 3. Configure Environment Variables

Navigate to `/contracts` and create your `.env` file from the provided example:

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:
```env
# Alchemy, Infura, or public RPC URL for Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Private key of Account 1 (Deployer)
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY

# Optional: Etherscan API key for source verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

> ⚠️ **Security Warning**: Never commit your `.env` or use mainnet private keys.

---

## 4. Compile & Run Tests

Verify all 27 unit tests pass locally before deploying:

```bash
cd contracts
npm install
npx hardhat test
```

Expected output:
```
  27 passing (1s)
```

---

## 5. Deploy Contracts to Sepolia

Run the automated deployment script targeting Sepolia:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

What this script does automatically:
1. Deploys `ReputationRegistry(demoMode = true)`.
2. Deploys `LendingPool(registryAddress)`.
3. Calls `registry.setLendingPool(poolAddress)` to authorize the pool.
4. Automatically writes both contract addresses and fresh ABIs into `frontend/src/contracts/addresses.json`, `ReputationRegistry.json`, and `LendingPool.json`.

---

## 6. Verify Contracts on Etherscan (Optional but Recommended)

Verify source code on Sepolia Etherscan for judges to inspect:

```bash
# Verify ReputationRegistry (pass constructor argument demoMode=true)
npx hardhat verify --network sepolia <DEPLOYED_REGISTRY_ADDRESS> true

# Verify LendingPool (pass constructor argument registryAddress)
npx hardhat verify --network sepolia <DEPLOYED_POOL_ADDRESS> <DEPLOYED_REGISTRY_ADDRESS>
```

---

## 7. Run the Frontend

1. Navigate to `/frontend`:
```bash
cd ../frontend
npm install
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Connect Account 1 (Deployer/Lender) in MetaMask.
4. Deposit `0.5 ETH` into the **Lend** tab to seed the pool liquidity.
5. Switch to Account 2 (Good Borrower) to borrow and test reputation accrual!
