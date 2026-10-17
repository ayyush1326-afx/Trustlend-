import { useWeb3 } from "../context/Web3Context";

export function useWallet() {
  const {
    account,
    chainId,
    ethBalance,
    isConnecting,
    isConnected,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    signer,
  } = useWeb3();

  return {
    account,
    chainId,
    ethBalance,
    isConnecting,
    isConnected,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    signer,
  };
}
