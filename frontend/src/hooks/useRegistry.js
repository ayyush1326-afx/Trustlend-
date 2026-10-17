import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import registryArtifact from "../contracts/ReputationRegistry.json";

export function useRegistry() {
  const {
    registryAddress,
    userScore,
    userTier,
    signer,
    executeTx,
    demoMode,
    refreshData,
  } = useWeb3();

  const seedScore = async (targetUser, newScore) => {
    if (!signer) throw new Error("Wallet not connected");
    const registry = new ethers.Contract(registryAddress, registryArtifact.abi, signer);
    return await executeTx(
      () => registry.seedScore(targetUser, newScore),
      `Seeding score to ${newScore} for ${targetUser.substring(0, 6)}...`,
      `Score successfully updated to ${newScore}!`
    );
  };

  return {
    registryAddress,
    userScore,
    userTier,
    seedScore,
    demoMode,
    refreshData,
  };
}
