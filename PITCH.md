# TrustLend: Hackathon Pitch & Judge Q&A

---

## 6-Slide Pitch Deck Outline

### Slide 1: The Multi-Billion Dollar Capital Trap in DeFi
- **Headline**: Over-collateralization is choking DeFi's potential.
- **Key Points**:
  - Aave and Compound require \$150 to borrow \$100.
  - Users who need working capital are priced out.
  - \$40B+ in idle collateral locked with zero risk discrimination.
  - A 5-year veteran wallet gets the exact same punitive terms as a bot created 5 seconds ago.

### Slide 2: Introducing TrustLend — Credit Scores for DeFi
- **Headline**: Capital efficiency through earned on-chain reputation.
- **Key Points**:
  - First under-collateralized lending protocol powered by deterministic on-chain credit scores.
  - Borrowers unlock down to 50% collateral and up to 1.0 ETH borrowing limits.
  - On-time repayment builds credit (+50 pts); default destroys it (-300 pts).
  - 100% on-chain, verifiable, and permissionless on Ethereum Sepolia.

### Slide 3: The 5-Tier Reputation Engine
- **Headline**: Reputation earned slowly, lost quickly.
- **Key Points**:
  - **Newcomer (0-199)**: 150% collateral, 0.05 ETH cap (safe starting baseline).
  - **Bronze (200-399)**: 125% collateral, 0.10 ETH cap.
  - **Silver (400-599)**: 100% collateral, 0.25 ETH cap (1:1 parity).
  - **Gold (600-799)**: 75% collateral, 0.50 ETH cap (under-collateralized).
  - **Platinum (800-1000)**: 50% collateral, 1.00 ETH cap (deposit 0.5 ETH to borrow 1.0 ETH).

### Slide 4: Architecture & Deliberate Design Decisions
- **Headline**: Simple, robust, exploit-resistant mechanics.
- **Key Points**:
  - **Zero Price Oracles**: ETH is both collateral and loan asset. Eliminates oracle exploits, flash loans, and liquidation cascades.
  - **Flat 5% Loan Fee**: 100% of fees automatically accrue to pool share value, compounding lender returns.
  - **Strict Caps & Single Active Loan**: Prevents recursive leverage and bounds maximum default exposure.
  - **Full ReentrancyGuard & Checks-Effects-Interactions**: Hardened against reentrancy attacks.

### Slide 5: Live Testnet Prototype
- **Headline**: Working on Sepolia with high-polish fintech UI.
- **Key Points**:
  - Built with Hardhat, Solidity 0.8.20, React 18, ethers v6, Framer Motion, and Tailwind CSS.
  - Real-time event indexing, live countdown timers, and permissionless liquidation.
  - 27 unit tests with 100% pass rate covering time travel, share math, and edge cases.

### Slide 6: The Roadmap to Mainnet
- **Headline**: From hackathon prototype to Web3 credit standard.
- **Key Points**:
  - **Q1**: Integrate EAS (Ethereum Attestation Service) and Gitcoin Passport for Sybil-resistant human identity.
  - **Q2**: Zero-Knowledge (zk-SNARK) credit score proofs for financial privacy.
  - **Q3**: Dynamic utilization-based interest rate curve + first-loss insurance reserve fund.
  - **Q4**: Multi-asset lending (staked ETH, stablecoins) with Chainlink oracles.

---

## 10 Judge Questions & Bulletproof Answers

### Q1: How do you prevent Sybil attacks where someone creates fresh wallets to borrow and default?
> **Answer:**  
> In TrustLend, a fresh wallet starts in the **Newcomer tier at 150% collateral** with a strict 0.05 ETH cap. If a new wallet borrows 0.05 ETH, they must lock 0.075 ETH. If they default, the protocol seizes their 0.075 ETH collateral. The attacker loses 0.025 ETH on every attempt. A Sybil attacker cannot extract net positive value from fresh wallets. Under-collateralization is only unlocked after multiple consecutive successful loan cycles.

---

### Q2: What stops someone from "score farming" tiny loans to reach Platinum, and then defaulting on the 1.0 ETH maximum loan?
> **Answer:**  
> First, reaching Platinum requires **14 consecutive on-time repayments** (+50 points each to reach 800 from 100). At each repayment, the borrower pays a non-refundable **5% flat fee** to the lending pool.  
> Second, our borrow limits scale gradually with collateral requirements: the maximum loan at Platinum is hard-capped at **1.0 ETH**.  
> In our mainnet roadmap, we integrate **volume-weighted reputation scoring** and **wallet age heuristics** (via EAS attestations and historic on-chain gas expenditure), ensuring borrowers cannot farm reputation with trivial pennies.

---

### Q3: Who absorbs the financial loss when an under-collateralized loan (e.g. 50% collateral at Platinum) defaults?
> **Answer:**  
> When a Platinum loan of 1.0 ETH defaults, the pool seizes 0.5 ETH of collateral, leaving a 0.5 ETH deficit that reduces total pool value across all shares.  
> This risk is offset by two layers:
> 1. **Accumulated Fee Yield**: Every loan repaid generates a 5% fee that stays in the pool. A healthy pool with high velocity generates enough fee surplus to cover the statistical default rate.
> 2. **Roadmap Reserve Fund**: In our v2 design, 20% of every fee is routed to an unbacked "first-loss" reserve fund that absorbs defaults before any lender principal is affected.

---

### Q4: Why did you choose ETH as both the loan and collateral asset instead of stablecoins?
> **Answer:**  
> This was a **deliberate hackathon design decision**. Over 70% of DeFi exploits in hackathons originate from oracle manipulation, flash loans, or stale price feeds. By using ETH for both assets:
> - No price oracle is needed.
> - No exchange rate risk exists between collateral and loan.
> - The codebase is lean, auditable, and resilient.  
> Multi-asset lending with Chainlink price feeds is planned for v2 once the reputation mechanics are battle-tested.

---

### Q5: Why is on-chain credit better than traditional off-chain credit bureaus like Equifax or Experian?
> **Answer:**  
> Traditional credit bureaus are:
> 1. **Closed & Monopolistic**: Opaque algorithms, frequent massive data breaches, and zero interoperability across international borders.
> 2. **Exclusionary**: 1.4 billion unbanked adults have zero credit footprint.  
> TrustLend is:
> 1. **Deterministic & Transparent**: Math defined in open-source smart contracts.
> 2. **Global & Borderless**: Any Ethereum wallet in the world can build reputation from day one.
> 3. **Composable**: Other DeFi protocols can read the `ReputationRegistry` to offer tailored rates or services.

---

### Q6: Can other DeFi protocols reuse or query the TrustLend credit score?
> **Answer:**  
> Yes! The `ReputationRegistry.sol` contract exposes public view functions: `getScore(address)`, `getTier(address)`, and `getUserTierDetails(address)`.  
> Any external protocol (e.g., perpetual DEXs for lower margin requirements, NFT marketplaces for installment payments, or under-collateralized DAO loans) can query a user's TrustLend score permissionlessly.

---

### Q7: How does the pool handle lender bank runs if multiple lenders want to withdraw simultaneously?
> **Answer:**  
> The `withdraw()` function in `LendingPool.sol` strictly enforces:  
> `require(payout <= getLiquidity(), "Insufficient liquidity")`.  
> Lenders cannot drain funds that are currently out on active loan to borrowers. If pool utilization is high, lenders withdraw available liquidity, and further withdrawals queue until borrowers repay their short-term loans. The UI displays live **Pool Utilization** and explicitly warns users if requested withdrawals exceed available unencumbered liquidity.

---

### Q8: Why use a flat 5% fee per loan instead of standard compounding APR?
> **Answer:**  
> Compounding interest requires continuous timestamp calculations, ray math, and variable rate accrual, which adds gas overhead and potential rounding drift. A flat 5% fee offers:
> - **Zero Ambiguity for Borrowers**: If you borrow 0.1 ETH, you know you will repay exactly 0.105 ETH.
> - **Gas Efficiency**: Minimal EVM operations on borrow and repay.
> - **Predictable Lender Yield**: Fees immediately increase pool share redemption value.

---

### Q9: Is TrustLend ready for Ethereum Mainnet deployment today?
> **Answer:**  
> The current smart contracts have 100% test coverage and follow strict OpenZeppelin standards. However, before deploying to Mainnet, we would:
> 1. Remove the `demoMode` constructor flag and `seedScore()` function completely.
> 2. Commission an external security audit (e.g. OpenZeppelin, Spearbit, or Trail of Bits).
> 3. Implement Sybil-resistance via Ethereum Attestation Service (EAS) or Gitcoin Passport before opening under-collateralized tiers to the public.

---

### Q10: What identity or Zero-Knowledge solutions will you integrate next?
> **Answer:**  
> We plan a two-step integration:
> 1. **EAS (Ethereum Attestation Service)**: Attestations for GitHub commits, Twitter verification, and ENS names to grant initial score bonuses for proven Web3 developers and users.
> 2. **zk-SNARKs (e.g., Circom or Noir)**: Borrowers generate a ZK proof stating *"My wallet possesses a credit score $\ge 800$ in ReputationRegistry"* without disclosing their wallet address on the borrowing transaction, providing institutional-grade financial privacy.
