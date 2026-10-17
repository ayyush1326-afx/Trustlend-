import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import poolArtifact from "../contracts/LendingPool.json";

export function usePool() {
  const {
    poolAddress,
    poolStats,
    userShares,
    signer,
    executeTx,
    refreshData,
  } = useWeb3();

  const deposit = async (amountEth) => {
    if (!signer) throw new Error("Wallet not connected");
    const pool = new ethers.Contract(poolAddress, poolArtifact.abi, signer);
    const valueWei = ethers.parseEther(amountEth.toString());
    return await executeTx(
      () => pool.deposit({ value: valueWei }),
      `Depositing ${amountEth} ETH into pool...`,
      `Successfully deposited ${amountEth} ETH into lending pool!`
    );
  };

  const withdraw = async (sharesAmountWei) => {
    if (!signer) throw new Error("Wallet not connected");
    const pool = new ethers.Contract(poolAddress, poolArtifact.abi, signer);
    return await executeTx(
      () => pool.withdraw(sharesAmountWei),
      `Withdrawing liquidity shares...`,
      `Successfully withdrew ETH from lending pool!`
    );
  };

  const borrow = async (amountEth, durationSeconds, requiredCollateralWei) => {
    if (!signer) throw new Error("Wallet not connected");
    const pool = new ethers.Contract(poolAddress, poolArtifact.abi, signer);
    const amountWei = ethers.parseEther(amountEth.toString());
    return await executeTx(
      () => pool.borrow(amountWei, durationSeconds, { value: requiredCollateralWei }),
      `Borrowing ${amountEth} ETH...`,
      `Loan approved! Received ${amountEth} ETH directly in your wallet.`
    );
  };

  const repay = async (loanId, totalDueWei) => {
    if (!signer) throw new Error("Wallet not connected");
    const pool = new ethers.Contract(poolAddress, poolArtifact.abi, signer);
    return await executeTx(
      () => pool.repay(loanId, { value: totalDueWei }),
      `Repaying Loan #${loanId}...`,
      `Loan #${loanId} successfully repaid! Collateral returned to wallet.`
    );
  };

  const liquidate = async (loanId) => {
    if (!signer) throw new Error("Wallet not connected");
    const pool = new ethers.Contract(poolAddress, poolArtifact.abi, signer);
    return await executeTx(
      () => pool.liquidate(loanId),
      `Liquidating overdue Loan #${loanId}...`,
      `Loan #${loanId} liquidated! Collateral seized into pool liquidity.`
    );
  };

  return {
    poolAddress,
    poolStats,
    userShares,
    deposit,
    withdraw,
    borrow,
    repay,
    liquidate,
    refreshData,
  };
}
