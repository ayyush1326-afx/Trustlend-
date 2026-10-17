/**
 * Parses and maps ethers / EVM / user errors to clear, friendly UI messages.
 */
export function parseContractError(error) {
  if (!error) return "An unexpected error occurred.";

  const errorMessage = error?.message || error?.data?.message || "";
  const errorReason = error?.reason || "";

  // User rejection
  if (
    error?.code === "ACTION_REJECTED" ||
    error?.code === 4001 ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("User denied transaction")
  ) {
    return "Transaction was cancelled in MetaMask.";
  }

  // Insufficient funds for gas or value
  if (
    error?.code === "INSUFFICIENT_FUNDS" ||
    errorMessage.includes("insufficient funds")
  ) {
    return "Insufficient ETH in your wallet to cover this transaction and gas fees.";
  }

  // Custom Solidity Contract Errors
  if (errorMessage.includes("ActiveLoanExists") || errorReason.includes("ActiveLoanExists")) {
    return "You already have an active loan. Please repay your current loan before taking a new one.";
  }

  if (errorMessage.includes("ExceedsMaxBorrow") || errorReason.includes("ExceedsMaxBorrow")) {
    return "Requested amount exceeds your tier borrow limit. Raise your credit score to unlock higher caps.";
  }

  if (errorMessage.includes("InvalidCollateralAmount") || errorReason.includes("InvalidCollateralAmount")) {
    return "Collateral amount provided does not match the exact requirement for your tier.";
  }

  if (errorMessage.includes("InsufficientLiquidity") || errorReason.includes("InsufficientLiquidity")) {
    return "The pool does not currently have enough unencumbered liquidity to fund this operation.";
  }

  if (errorMessage.includes("InvalidDuration") || errorReason.includes("InvalidDuration")) {
    return "Loan duration must be between 60 seconds and 90 days.";
  }

  if (errorMessage.includes("LoanNotActive") || errorReason.includes("LoanNotActive")) {
    return "This loan is no longer active (already settled or liquidated).";
  }

  if (errorMessage.includes("NotBorrower") || errorReason.includes("NotBorrower")) {
    return "Only the borrower who initiated this loan can repay it.";
  }

  if (errorMessage.includes("InvalidRepaymentAmount") || errorReason.includes("InvalidRepaymentAmount")) {
    return "Incorrect repayment amount. You must pay exact principal + 5% fee.";
  }

  if (errorMessage.includes("LoanNotOverdue") || errorReason.includes("LoanNotOverdue")) {
    return "Loan cannot be liquidated before its due date has elapsed.";
  }

  if (errorMessage.includes("InsufficientShares") || errorReason.includes("InsufficientShares")) {
    return "You do not own enough pool shares to complete this withdrawal.";
  }

  if (errorMessage.includes("ZeroAmount") || errorReason.includes("ZeroAmount")) {
    return "Amount must be greater than zero.";
  }

  if (errorMessage.includes("DemoModeDisabled") || errorReason.includes("DemoModeDisabled")) {
    return "Demo seeding is disabled on this contract deployment.";
  }

  if (errorMessage.includes("NotOwner") || errorReason.includes("NotOwner")) {
    return "This operation requires owner authorization.";
  }

  // Generic fallback with cleaner message
  if (errorReason) {
    return `Transaction reverted: ${errorReason}`;
  }

  if (error?.shortMessage) {
    return error.shortMessage;
  }

  return "Transaction failed on-chain. Please verify your inputs and try again.";
}
