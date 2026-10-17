import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import addressesData from "../contracts/addresses.json";
import registryArtifact from "../contracts/ReputationRegistry.json";
import poolArtifact from "../contracts/LendingPool.json";
import { SEPOLIA_CHAIN_ID, LOCAL_CHAIN_ID, SUPPORTED_CHAINS } from "../utils/constants";
import { parseContractError } from "../utils/errorMapper";
import { getTierForScore, getExplorerUrl } from "../utils/formatters";

const Web3Context = createContext(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Protocol state
  const [userScore, setUserScore] = useState(100);
  const [poolStats, setPoolStats] = useState({
    liquidity: 0n,
    totalBorrowed: 0n,
    poolValue: 0n,
    utilizationBps: 0n,
    totalShares: 0n,
    loanCount: 0n,
  });
  const [userShares, setUserShares] = useState({
    shares: 0n,
    value: 0n,
  });
  const [userLoans, setUserLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Contract addresses & ABIs
  const registryAddress = addressesData.ReputationRegistry;
  const poolAddress = addressesData.LendingPool;
  const targetChainId = addressesData.chainId || SEPOLIA_CHAIN_ID;

  const isWrongNetwork = useMemo(() => {
    if (!chainId) return false;
    // Allow Sepolia or localhost
    return chainId !== SEPOLIA_CHAIN_ID && chainId !== LOCAL_CHAIN_ID;
  }, [chainId]);

  const userTier = useMemo(() => {
    return getTierForScore(userScore);
  }, [userScore]);

  // Read-only contracts provider
  const getReadProvider = useCallback(() => {
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    // Fallback public RPC
    return new ethers.JsonRpcProvider(SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].rpcUrls[0]);
  }, []);

  const getContracts = useCallback(
    (signerOrProvider) => {
      const activeProvider = signerOrProvider || getReadProvider();
      const registry = new ethers.Contract(registryAddress, registryArtifact.abi, activeProvider);
      const pool = new ethers.Contract(poolAddress, poolArtifact.abi, activeProvider);
      return { registry, pool };
    },
    [registryAddress, poolAddress, getReadProvider]
  );

  // Fetch all user and pool data
  const refreshData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const activeProvider = provider || getReadProvider();
      const { registry, pool } = getContracts(activeProvider);

      // 1. Fetch Pool Stats
      try {
        const stats = await pool.getPoolStats();
        setPoolStats({
          liquidity: stats[0],
          totalBorrowed: stats[1],
          poolValue: stats[2],
          utilizationBps: stats[3],
          totalShares: stats[4],
          loanCount: stats[5],
        });
      } catch (err) {
        console.warn("Failed fetching pool stats:", err);
      }

      // 2. Fetch User Specific Data if connected
      if (account) {
        try {
          const bal = await activeProvider.getBalance(account);
          setEthBalance(ethers.formatEther(bal));

          const score = await registry.getScore(account);
          setUserScore(Number(score));

          const shares = await pool.shares(account);
          const sharesVal = await pool.sharesValue(account);
          setUserShares({ shares, value: sharesVal });

          // Fetch user loans
          const loanIds = await pool.getBorrowerLoans(account);
          const loansData = await Promise.all(
            loanIds.map(async (id) => {
              const l = await pool.getLoan(id);
              return {
                id: Number(l.id),
                borrower: l.borrower,
                principal: l.principal,
                fee: l.fee,
                collateral: l.collateral,
                startTime: Number(l.startTime),
                dueTime: Number(l.dueTime),
                status: Number(l.status),
                repaidLate: l.repaidLate,
              };
            })
          );
          // Sort latest first
          setUserLoans(loansData.reverse());
        } catch (err) {
          console.warn("Failed fetching user details:", err);
        }
      }

      // 3. Fetch Overdue Loans (for liquidators)
      try {
        const totalLoans = await pool.loanCount();
        const count = Number(totalLoans);
        const overdueList = [];
        const now = Math.floor(Date.now() / 1000);

        for (let i = 1; i <= count; i++) {
          const loan = await pool.getLoan(i);
          // Status 0 = Active, overdue if now > dueTime
          if (Number(loan.status) === 0 && Number(loan.dueTime) < now) {
            overdueList.push({
              id: Number(loan.id),
              borrower: loan.borrower,
              principal: loan.principal,
              fee: loan.fee,
              collateral: loan.collateral,
              dueTime: Number(loan.dueTime),
              status: Number(loan.status),
            });
          }
        }
        setOverdueLoans(overdueList);
      } catch (err) {
        console.warn("Failed fetching overdue loans:", err);
      }

      // 4. Fetch Activities from recent events
      try {
        const currentBlock = await activeProvider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 5000); // Last ~5000 blocks

        const [borrowFilter, repayFilter, liquidateFilter, depositFilter, scoreFilter] = await Promise.all([
          pool.queryFilter(pool.filters.Borrowed(), fromBlock),
          pool.queryFilter(pool.filters.Repaid(), fromBlock),
          pool.queryFilter(pool.filters.Liquidated(), fromBlock),
          pool.queryFilter(pool.filters.Deposited(), fromBlock),
          registry.queryFilter(registry.filters.ScoreUpdated(), fromBlock),
        ]);

        const activities = [];

        borrowFilter.forEach((e) => {
          activities.push({
            type: "Borrowed",
            user: e.args[1],
            amount: e.args[2],
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
            description: `Borrowed ${ethers.formatEther(e.args[2])} ETH (Loan #${e.args[0]})`,
          });
        });

        repayFilter.forEach((e) => {
          activities.push({
            type: "Repaid",
            user: e.args[1],
            amount: e.args[2],
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
            description: `Repaid ${ethers.formatEther(e.args[2])} ETH (Loan #${e.args[0]})${e.args[4] ? " [Late]" : ""}`,
          });
        });

        liquidateFilter.forEach((e) => {
          activities.push({
            type: "Liquidated",
            user: e.args[1],
            amount: e.args[3],
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
            description: `Liquidated Loan #${e.args[0]} by ${e.args[2].substring(0, 6)}...`,
          });
        });

        depositFilter.forEach((e) => {
          activities.push({
            type: "Deposited",
            user: e.args[0],
            amount: e.args[1],
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
            description: `Lender deposited ${ethers.formatEther(e.args[1])} ETH`,
          });
        });

        scoreFilter.forEach((e) => {
          activities.push({
            type: "ScoreUpdated",
            user: e.args[0],
            oldScore: Number(e.args[1]),
            newScore: Number(e.args[2]),
            reason: e.args[3],
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
            description: `Score changed ${e.args[1]} → ${e.args[2]} (${e.args[3]})`,
          });
        });

        // Sort descending by block number
        activities.sort((a, b) => b.blockNumber - a.blockNumber);
        setRecentActivities(activities.slice(0, 15));
      } catch (err) {
        console.warn("Event query error (non-fatal):", err);
      }
    } catch (error) {
      console.error("Error refreshing protocol data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [account, provider, getReadProvider, getContracts]);

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask browser extension.");
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const userSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      const bal = await browserProvider.getBalance(accounts[0]);
      setEthBalance(ethers.formatEther(bal));
      toast.success("Wallet connected successfully!");
    } catch (err) {
      console.error("Wallet connect error:", err);
      toast.error(parseContractError(err));
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setAccount("");
    setSigner(null);
    setUserLoans([]);
    toast.success("Wallet disconnected.");
  };

  // Switch to Sepolia
  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].chainIdHex }],
      });
      toast.success("Switched network to Ethereum Sepolia!");
    } catch (switchError) {
      // 4902 code indicates chain has not been added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].chainIdHex,
                chainName: SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].name,
                rpcUrls: SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].rpcUrls,
                nativeCurrency: SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].nativeCurrency,
                blockExplorerUrls: [SUPPORTED_CHAINS[SEPOLIA_CHAIN_ID].blockExplorer],
              },
            ],
          });
          toast.success("Added and switched to Sepolia!");
        } catch (addError) {
          toast.error("Failed to add Sepolia network.");
        }
      } else {
        toast.error("Failed to switch network.");
      }
    }
  };

  // Listen to wallet events
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (provider) {
            const userSigner = await provider.getSigner();
            setSigner(userSigner);
          }
        } else {
          setAccount("");
          setSigner(null);
        }
      };

      const handleChainChanged = (chainHex) => {
        setChainId(parseInt(chainHex, 16));
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider]);

  // Initial auto-connect if already authorized
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await browserProvider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const network = await browserProvider.getNetwork();
            const userSigner = await browserProvider.getSigner();
            setProvider(browserProvider);
            setSigner(userSigner);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
          }
        } catch (e) {
          console.warn("Auto-connect check failed:", e);
        }
      }
    };
    init();
  }, []);

  // Poll refresh every 10 seconds or when account/chainId changes
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Helper transaction wrapper with toast and confirmation
  const executeTx = async (txFunc, pendingMsg, successMsg) => {
    if (!signer) {
      toast.error("Please connect your wallet first.");
      return null;
    }
    const toastId = toast.loading(pendingMsg || "Submitting transaction...");
    try {
      const tx = await txFunc();
      toast.loading("Awaiting block confirmation...", { id: toastId });
      const receipt = await tx.wait();
      
      const explorerLink = getExplorerUrl(receipt.hash, "tx", chainId || SEPOLIA_CHAIN_ID);
      toast.success(
        <div>
          <p className="font-medium">{successMsg || "Transaction confirmed!"}</p>
          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 underline hover:text-indigo-300 mt-1 inline-block"
            >
              View on Etherscan ↗
            </a>
          )}
        </div>,
        { id: toastId, duration: 6000 }
      );
      await refreshData();
      return receipt;
    } catch (err) {
      console.error("Transaction failed:", err);
      toast.error(parseContractError(err), { id: toastId });
      throw err;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        ethBalance,
        isConnecting,
        isConnected: !!account,
        isWrongNetwork,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        provider,
        signer,
        registryAddress,
        poolAddress,
        userScore,
        userTier,
        poolStats,
        userShares,
        userLoans,
        overdueLoans,
        recentActivities,
        isLoadingData,
        refreshData,
        executeTx,
        demoMode: addressesData.demoMode || true,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
