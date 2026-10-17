import { useMemo } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useLoans() {
  const { userLoans, overdueLoans, refreshData } = useWeb3();

  const activeLoan = useMemo(() => {
    return userLoans.find((l) => l.status === 0) || null;
  }, [userLoans]);

  const hasActiveLoan = !!activeLoan;

  const pastLoans = useMemo(() => {
    return userLoans.filter((l) => l.status !== 0);
  }, [userLoans]);

  return {
    userLoans,
    activeLoan,
    hasActiveLoan,
    pastLoans,
    overdueLoans,
    refreshData,
  };
}
