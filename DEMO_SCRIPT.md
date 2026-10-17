# TrustLend: 4-Minute Hackathon Demo Script

> **Setting:** Live presentation to hackathon judges at Devcon.  
> **Duration:** Exactly 4 minutes.  
> **Goal:** Prove end-to-end working contracts, under-collateralized borrowing, live credit score updates, and permissionless liquidation on Ethereum Sepolia.

---

## Pre-Demo Checklist (60 seconds before presenting)
1. Browser window open at `http://localhost:3000` on Ethereum Sepolia.
2. MetaMask pre-loaded with 3 accounts:
   - **Account 1 (Deployer / Lender)**: `~0.5+ ETH`
   - **Account 2 (Good Borrower)**: `~0.15 ETH`
   - **Account 3 (Defaulter Borrower)**: `~0.15 ETH`
3. "Demo 1-Min Loan Mode" toggle active in the Demo Panel.

---

## Demo Timeline (0:00 - 4:00)

### [0:00 – 0:45] Minute 1: The Problem & Liquidity Supply
- **What to say:**
  > *"Judges, today DeFi lending requires over-collateralization: you have to lock \$150 to borrow \$100. That locks up hundreds of billions of dollars and excludes everyone who actually needs capital. This is TrustLend — credit scores for DeFi. We reward borrowers who repay on-time with lower collateral requirements down to 50%."*
- **What to do (Account 1 - Lender):**
  1. Show the live **Dashboard** stats bar: Liquidity, Borrowed, Utilization.
  2. Navigate to the **Lend** tab.
  3. Enter `0.2 ETH` and click **"Deposit 0.2 ETH"**.
  4. Confirm the transaction in MetaMask.
  5. Point to the success toast with Etherscan link and the updated **Position Value** and **Shares Balance**.

---

### [0:45 – 1:45] Minute 2: The Newcomer Loan & On-Time Repayment
- **What to say:**
  > *"Now let's switch to a brand new borrower wallet. Notice their TrustScore starts at 100 in Tier 0: Newcomer. Because they have no track record, the protocol safely requires 150% collateral and caps their loan at 0.05 ETH."*
- **What to do (Account 2 - Good Borrower):**
  1. Switch MetaMask to **Account 2**.
  2. Point to the **ScoreGauge**: Score is `100`, Tier is `Newcomer`, required collateral is `150%`.
  3. Click **"Borrow"** tab. Amount `0.05 ETH`, Duration `1 min (Demo)`.
  4. Click **"Review & Borrow ETH"** -> **"Confirm & Receive ETH"**. Confirm in MetaMask.
  5. Show the loan card in **"My Loans"**:
     - Principal: `0.05 ETH`
     - Collateral: `0.075 ETH`
     - Live countdown ring ticking down from 60 seconds.
  6. Click **"Repay Loan & Release Collateral"** before the 60 seconds expire. Confirm in MetaMask.
  7. **Highlight the magic moment:**
     - Score immediately increments by `+50` to `150`!
     - Collateral is returned directly to the borrower's wallet.
     - The 5% fee is compounded into the pool for lenders.

---

### [1:45 – 2:45] Minute 3: Under-Collateralized Borrowing (Platinum Tier)
- **What to say:**
  > *"Reputation is earned slowly: each good loan adds +50 points. For this demo, let's fast-forward this borrower's track record using our demo controller, which is guarded by an immutable demoMode flag set at contract deployment."*
- **What to do (Account 2):**
  1. In the **Demo Controller Panel**, click the preset button **"800 (Platinum 50%)"**.
  2. Confirm the transaction in MetaMask.
  3. Point to the **ScoreGauge**:
     - Score is now `800` (Platinum Tier).
     - Required collateral has dropped from 150% down to **50%**!
     - Max borrow cap has expanded from 0.05 ETH up to **1.00 ETH**!
  4. Point to the **CollateralStaircaseChart**: User is now at the very bottom of the staircase.
  5. Go to **Borrow** tab:
     - Show: to borrow `0.10 ETH`, the borrower now only needs to deposit `0.05 ETH` collateral.
     - *"This is genuine under-collateralized lending on Ethereum without a credit bureau or centralized KYC."*

---

### [2:45 – 3:45] Minute 4: Default & Permissionless Liquidation
- **What to say:**
  > *"Reputation is earned slowly, but lost quickly. What happens if someone defaults? Let's switch to Account 3."*
- **What to do (Account 3 - Defaulter):**
  1. Switch MetaMask to **Account 3**.
  2. Borrow `0.05 ETH` on the `1 min (Demo)` duration.
  3. Wait 30-40 seconds for the loan countdown to expire. The status badge will turn red and flash **"OVERDUE"**.
  4. Switch MetaMask back to **Account 1 (Liquidator)**.
  5. Navigate to **My Loans** -> **"Liquidate Overdue Loans"**.
  6. Click **"Liquidate Loan"** on Account 3's overdue loan. Confirm in MetaMask.
  7. **Highlight the outcome:**
     - Collateral is immediately seized into pool liquidity.
     - Switch view back to Account 3: Account 3's credit score has crashed by **-300 points** (down to 0)!
     - Account 3 is now restricted to Tier 0 Newcomer terms with a damaged record.

---

### [3:45 – 4:00] Closing Wrap-up
- **What to say:**
  > *"To summarize: TrustLend operates with zero oracle dependencies because ETH is both the loan and collateral asset. It runs with complete Checks-Effects-Interactions and zero admin backdoors on user liquidity. We are bringing true credit to Web3. Thank you!"*
