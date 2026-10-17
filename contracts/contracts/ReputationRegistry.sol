// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReputationRegistry
 * @notice On-chain credit score registry for TrustLend.
 * @dev Tracks borrower reputation scores between 0 and 1000, determining collateral
 *      ratios and borrow caps across 5 distinct tiers.
 */
contract ReputationRegistry {
    // --- Custom Errors ---
    error NotOwner();
    error LendingPoolAlreadySet();
    error OnlyLendingPool();
    error DemoModeDisabled();
    error InvalidScore();
    error ZeroAddress();

    // --- Events ---
    event LendingPoolSet(address indexed lendingPool);
    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore, string reason);

    // --- State Variables ---
    address public immutable owner;
    bool public immutable demoMode;
    address public lendingPool;

    // Track user credit scores and interaction status
    mapping(address => uint256) private _scores;
    mapping(address => bool) private _hasInteracted;

    // Constants
    uint256 public constant INITIAL_SCORE = 100;
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant ON_TIME_BONUS = 50;
    uint256 public constant DEFAULT_PENALTY = 300;

    /**
     * @param _demoMode If true, allows the deployer to call seedScore() for live demo testing.
     */
    constructor(bool _demoMode) {
        owner = msg.sender;
        demoMode = _demoMode;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyLendingPool() {
        if (msg.sender != lendingPool) revert OnlyLendingPool();
        _;
    }

    /**
     * @notice Set the authorized LendingPool address. Can only be called once by the deployer.
     * @param _lendingPool Address of the deployed LendingPool contract.
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        if (_lendingPool == address(0)) revert ZeroAddress();
        if (lendingPool != address(0)) revert LendingPoolAlreadySet();
        lendingPool = _lendingPool;
        emit LendingPoolSet(_lendingPool);
    }

    /**
     * @notice Returns the credit score for a given user.
     * @dev Defaults to INITIAL_SCORE (100) if the user has never interacted.
     * @param user The address of the borrower.
     * @return score Credit score in range [0, 1000].
     */
    function getScore(address user) public view returns (uint256 score) {
        if (!_hasInteracted[user]) {
            return INITIAL_SCORE;
        }
        return _scores[user];
    }

    /**
     * @notice Returns the tier index (0 to 4) for a given user based on credit score.
     * @param user The address of the borrower.
     * @return tier Tier index: 0=Newcomer, 1=Bronze, 2=Silver, 3=Gold, 4=Platinum.
     */
    function getTier(address user) external view returns (uint8 tier) {
        uint256 score = getScore(user);
        return getTierIndexForScore(score);
    }

    /**
     * @notice Helper to get tier index from a score.
     * @param score Score in range [0, 1000].
     */
    function getTierIndexForScore(uint256 score) public pure returns (uint8) {
        if (score < 200) {
            return 0; // Newcomer: 0-199
        } else if (score < 400) {
            return 1; // Bronze: 200-399
        } else if (score < 600) {
            return 2; // Silver: 400-599
        } else if (score < 800) {
            return 3; // Gold: 600-799
        } else {
            return 4; // Platinum: 800-1000
        }
    }

    /**
     * @notice Returns tier configuration for a given tier index.
     * @param tierIndex Index 0 to 4.
     * @return name Tier label
     * @return collateralBps Collateral ratio in basis points (10000 = 100%)
     * @return maxBorrowWei Maximum borrow amount in wei
     */
    function getTierConfig(uint8 tierIndex)
        public
        pure
        returns (
            string memory name,
            uint256 collateralBps,
            uint256 maxBorrowWei
        )
    {
        if (tierIndex == 0) {
            return ("Newcomer", 15000, 0.05 ether);  // 150%, 0.05 ETH
        } else if (tierIndex == 1) {
            return ("Bronze", 12500, 0.10 ether);    // 125%, 0.10 ETH
        } else if (tierIndex == 2) {
            return ("Silver", 10000, 0.25 ether);    // 100%, 0.25 ETH
        } else if (tierIndex == 3) {
            return ("Gold", 7500, 0.50 ether);       // 75%,  0.50 ETH
        } else {
            return ("Platinum", 5000, 1.00 ether);   // 50%,  1.00 ETH
        }
    }

    /**
     * @notice Returns tier details directly for a user.
     */
    function getUserTierDetails(address user)
        external
        view
        returns (
            uint8 tierIndex,
            string memory name,
            uint256 score,
            uint256 collateralBps,
            uint256 maxBorrowWei
        )
    {
        score = getScore(user);
        tierIndex = getTierIndexForScore(score);
        (name, collateralBps, maxBorrowWei) = getTierConfig(tierIndex);
    }

    /**
     * @notice Reward borrower for on-time repayment: +50 score points up to 1000 cap.
     * @dev Only callable by the registered LendingPool.
     * @param user The address of the borrower.
     */
    function onTimeRepayment(address user) external onlyLendingPool {
        uint256 oldScore = getScore(user);
        uint256 newScore = oldScore + ON_TIME_BONUS;
        if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }
        _scores[user] = newScore;
        _hasInteracted[user] = true;
        emit ScoreUpdated(user, oldScore, newScore, "On-time repayment");
    }

    /**
     * @notice Penalize borrower for defaulting: -300 score points down to 0 floor.
     * @dev Only callable by the registered LendingPool.
     * @param user The address of the borrower.
     */
    function defaulted(address user) external onlyLendingPool {
        uint256 oldScore = getScore(user);
        uint256 newScore = oldScore >= DEFAULT_PENALTY ? oldScore - DEFAULT_PENALTY : 0;
        _scores[user] = newScore;
        _hasInteracted[user] = true;
        emit ScoreUpdated(user, oldScore, newScore, "Loan defaulted");
    }

    /**
     * @notice DEMO ONLY: Manually seed a wallet's score for hackathon demonstration.
     * @dev Guarded by immutable demoMode set at deployment.
     *      MUST BE REMOVED OR DISABLED IN PRODUCTION.
     * @param user Address to seed.
     * @param score Desired score in range [0, 1000].
     */
    function seedScore(address user, uint256 score) external onlyOwner {
        if (!demoMode) revert DemoModeDisabled();
        if (score > MAX_SCORE) revert InvalidScore();
        uint256 oldScore = getScore(user);
        _scores[user] = score;
        _hasInteracted[user] = true;
        emit ScoreUpdated(user, oldScore, score, "Demo seed score");
    }
}
