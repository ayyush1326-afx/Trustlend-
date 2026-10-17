// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IReputationRegistry
 * @notice Interface for TrustLend Reputation Registry.
 */
interface IReputationRegistry {
    function getScore(address user) external view returns (uint256 score);
    function getTier(address user) external view returns (uint8 tier);
    function getTierIndexForScore(uint256 score) external pure returns (uint8);
    function getTierConfig(uint8 tierIndex)
        external
        pure
        returns (
            string memory name,
            uint256 collateralBps,
            uint256 maxBorrowWei
        );
    function getUserTierDetails(address user)
        external
        view
        returns (
            uint8 tierIndex,
            string memory name,
            uint256 score,
            uint256 collateralBps,
            uint256 maxBorrowWei
        );
    function onTimeRepayment(address user) external;
    function defaulted(address user) external;
}
