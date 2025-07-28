// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TriviaGame
 * @dev Onchain trivia game with commit-reveal pattern
 */
contract TriviaGame is Ownable, ReentrancyGuard {
    // Token contract for rewards
    IERC20 public triviaToken;

    // Game state
    struct Round {
        uint256 startTime;
        uint256 endTime;
        string question;
        string correctAnswer;
        bool isActive;
        uint256 totalPlayers;
    }

    struct PlayerAnswer {
        bytes32 answerHash;
        bool hasRevealed;
        bool isCorrect;
        uint256 commitTime;
    }

    // State variables
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => PlayerAnswer)) public playerAnswers;
    mapping(address => uint256) public playerScores;
    mapping(address => uint256) public playerStreaks;
    mapping(address => uint256) public lastPlayedRound;

    // Events
    event NewRoundStarted(
        uint256 indexed roundId,
        string question,
        uint256 startTime
    );
    event AnswerCommitted(
        address indexed player,
        uint256 indexed roundId,
        bytes32 answerHash
    );
    event AnswerRevealed(
        address indexed player,
        uint256 indexed roundId,
        string answer,
        bool isCorrect
    );
    event RewardDistributed(address indexed player, uint256 amount);
    event ScoreUpdated(
        address indexed player,
        uint256 newScore,
        uint256 newStreak
    );

    // Constants
    uint256 public constant ROUND_DURATION = 60; // 60 seconds
    uint256 public constant CORRECT_REWARD = 10 * 10 ** 18; // 10 tokens
    uint256 public constant PARTICIPATION_REWARD = 1 * 10 ** 18; // 1 token
    uint256 public constant BONUS_REWARD = 5 * 10 ** 18; // 5 tokens for first 5 correct

    uint256 public currentRoundId;

    constructor(address _triviaToken) {
        triviaToken = IERC20(_triviaToken);
    }

    /**
     * @dev Start a new trivia round
     * @param questionId Unique identifier for the question
     * @param question The trivia question
     * @param correctAnswer The correct answer
     */
    function startNewRound(
        uint256 questionId,
        string memory question,
        string memory correctAnswer
    ) external onlyOwner {
        currentRoundId++;

        rounds[currentRoundId] = Round({
            startTime: block.timestamp,
            endTime: block.timestamp + ROUND_DURATION,
            question: question,
            correctAnswer: correctAnswer,
            isActive: true,
            totalPlayers: 0
        });

        emit NewRoundStarted(currentRoundId, question, block.timestamp);
    }

    /**
     * @dev Commit answer hash (commit-reveal pattern)
     * @param roundId The round ID
     * @param answerHash Hash of answer + salt
     */
    function commitAnswer(
        uint256 roundId,
        bytes32 answerHash
    ) external nonReentrant {
        require(rounds[roundId].isActive, "Round not active");
        require(block.timestamp < rounds[roundId].endTime, "Round ended");
        require(
            playerAnswers[roundId][msg.sender].answerHash == bytes32(0),
            "Already committed"
        );

        playerAnswers[roundId][msg.sender] = PlayerAnswer({
            answerHash: answerHash,
            hasRevealed: false,
            isCorrect: false,
            commitTime: block.timestamp
        });

        rounds[roundId].totalPlayers++;

        emit AnswerCommitted(msg.sender, roundId, answerHash);
    }

    /**
     * @dev Reveal answer and check correctness
     * @param roundId The round ID
     * @param answer The player's answer
     * @param salt The salt used for hashing
     */
    function revealAnswer(
        uint256 roundId,
        string memory answer,
        string memory salt
    ) external nonReentrant {
        require(rounds[roundId].isActive, "Round not active");
        require(
            block.timestamp >= rounds[roundId].endTime,
            "Round still active"
        );
        require(
            playerAnswers[roundId][msg.sender].answerHash != bytes32(0),
            "No answer committed"
        );
        require(
            !playerAnswers[roundId][msg.sender].hasRevealed,
            "Already revealed"
        );

        // Verify hash
        bytes32 expectedHash = keccak256(abi.encodePacked(answer, salt));
        require(
            playerAnswers[roundId][msg.sender].answerHash == expectedHash,
            "Hash mismatch"
        );

        // Check correctness
        bool isCorrect = keccak256(abi.encodePacked(answer)) ==
            keccak256(abi.encodePacked(rounds[roundId].correctAnswer));

        playerAnswers[roundId][msg.sender].hasRevealed = true;
        playerAnswers[roundId][msg.sender].isCorrect = isCorrect;

        // Update scores and streaks
        if (isCorrect) {
            playerScores[msg.sender]++;
            playerStreaks[msg.sender]++;
        } else {
            playerStreaks[msg.sender] = 0;
        }

        lastPlayedRound[msg.sender] = roundId;

        emit AnswerRevealed(msg.sender, roundId, answer, isCorrect);
        emit ScoreUpdated(
            msg.sender,
            playerScores[msg.sender],
            playerStreaks[msg.sender]
        );
    }

    /**
     * @dev Distribute rewards to players
     * @param roundId The round ID
     * @param players Array of player addresses to reward
     */
    function distributeRewards(
        uint256 roundId,
        address[] memory players
    ) external onlyOwner {
        require(rounds[roundId].isActive, "Round not active");
        require(
            block.timestamp >= rounds[roundId].endTime,
            "Round still active"
        );

        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            PlayerAnswer memory answer = playerAnswers[roundId][player];

            if (answer.hasRevealed) {
                uint256 reward = 0;

                if (answer.isCorrect) {
                    reward = CORRECT_REWARD;

                    // Bonus for first 5 correct answers
                    if (i < 5) {
                        reward += BONUS_REWARD;
                    }
                } else {
                    reward = PARTICIPATION_REWARD;
                }

                if (reward > 0) {
                    require(
                        triviaToken.transfer(player, reward),
                        "Token transfer failed"
                    );
                    emit RewardDistributed(player, reward);
                }
            }
        }
    }

    /**
     * @dev Get player's current streak
     * @param player Player address
     * @return Current streak
     */
    function getStreak(address player) external view returns (uint256) {
        return playerStreaks[player];
    }

    /**
     * @dev Get player's score
     * @param player Player address
     * @return Player's score
     */
    function getScore(address player) external view returns (uint256) {
        return playerScores[player];
    }

    /**
     * @dev Get round information
     * @param roundId Round ID
     * @return Round information
     */
    function getRoundInfo(
        uint256 roundId
    )
        external
        view
        returns (
            uint256 startTime,
            uint256 endTime,
            string memory question,
            string memory correctAnswer,
            bool isActive,
            uint256 totalPlayers
        )
    {
        Round memory round = rounds[roundId];
        return (
            round.startTime,
            round.endTime,
            round.question,
            round.correctAnswer,
            round.isActive,
            round.totalPlayers
        );
    }

    /**
     * @dev Check if player has committed to a round
     * @param player Player address
     * @param roundId Round ID
     * @return True if committed
     */
    function hasCommitted(
        address player,
        uint256 roundId
    ) external view returns (bool) {
        return playerAnswers[roundId][player].answerHash != bytes32(0);
    }

    /**
     * @dev Check if player has revealed in a round
     * @param player Player address
     * @param roundId Round ID
     * @return True if revealed
     */
    function hasRevealed(
        address player,
        uint256 roundId
    ) external view returns (bool) {
        return playerAnswers[roundId][player].hasRevealed;
    }

    /**
     * @dev Check if player's answer was correct
     * @param player Player address
     * @param roundId Round ID
     * @return True if correct
     */
    function isCorrect(
        address player,
        uint256 roundId
    ) external view returns (bool) {
        return playerAnswers[roundId][player].isCorrect;
    }

    /**
     * @dev Emergency function to end a round (owner only)
     * @param roundId Round ID to end
     */
    function emergencyEndRound(uint256 roundId) external onlyOwner {
        rounds[roundId].isActive = false;
    }

    /**
     * @dev Withdraw tokens from contract (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(triviaToken.transfer(owner(), amount), "Token transfer failed");
    }
}
