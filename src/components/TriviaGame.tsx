"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useConnect,
} from "wagmi";
import { sdk } from "@farcaster/frame-sdk";
import { ethers } from "ethers";
import triviaGameABI from "@/abis/TriviaGame.json";
import { useRouter } from "next/navigation";

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm`}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Mock trivia questions for now
const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "What is the capital of France?",
    correctAnswer: "Paris",
    options: ["London", "Berlin", "Paris", "Madrid"],
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    correctAnswer: "Mars",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
  },
  {
    id: 3,
    question: "What is 2 + 2?",
    correctAnswer: "4",
    options: ["3", "4", "5", "6"],
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    correctAnswer: "Leonardo da Vinci",
    options: [
      "Vincent van Gogh",
      "Pablo Picasso",
      "Leonardo da Vinci",
      "Michelangelo",
    ],
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    correctAnswer: "Pacific Ocean",
    options: [
      "Atlantic Ocean",
      "Indian Ocean",
      "Pacific Ocean",
      "Arctic Ocean",
    ],
  },
];

const TRIVIA_GAME_ADDRESS =
  "0xf979833F1C343a894A54861E971ebDD4e7dA7d2c" as `0x${string}`; // Placeholder
const TRIVIA_TOKEN_ADDRESS =
  "0x0de0C9880f32F20F09EFb126E0d36A94f70572B0" as `0x${string}`; // Placeholder

interface GameState {
  currentQuestion: (typeof MOCK_QUESTIONS)[0] | null;
  timeLeft: number;
  isAnswering: boolean;
  hasCommitted: boolean;
  hasRevealed: boolean;
  isCorrect: boolean | null;
  playerAnswer: string;
  playerSalt: string;
  roundStartTime: number;
  roundId: number;
}

interface LeaderboardEntry {
  address: string;
  score: number;
  streak: number;
  lastPlayed: string;
}

export default function TriviaGame() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const { connect, connectors, isPending } = useConnect();

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    timeLeft: 60,
    isAnswering: false,
    hasCommitted: false,
    hasRevealed: false,
    isCorrect: null,
    playerAnswer: "",
    playerSalt: "",
    roundStartTime: 0,
    roundId: 0,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [playerStats, setPlayerStats] = useState({ score: 0, streak: 0 });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  // Generate a random salt for commit-reveal
  const generateSalt = () => {
    return ethers.randomBytes(32).toString();
  };

  // Hash the answer with salt
  const hashAnswer = (answer: string, salt: string) => {
    return ethers.keccak256(ethers.toUtf8Bytes(answer + salt));
  };

  // Start a new round
  const startNewRound = useCallback(async () => {
    // if (!address) {
    //   showToast("Please connect your wallet to play!", "error");
    //   return;
    // }

    const randomQuestion =
      MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];
    const newRoundId = gameState.roundId + 1;
    const salt = generateSalt();

    setGameState((prev) => ({
      ...prev,
      currentQuestion: randomQuestion,
      timeLeft: 60,
      isAnswering: true,
      hasCommitted: false,
      hasRevealed: false,
      isCorrect: null,
      playerAnswer: "",
      playerSalt: salt,
      roundStartTime: Date.now(),
      roundId: newRoundId,
    }));

    showToast(`🎯 New question: ${randomQuestion.question}`, "info");

    // Try to call smart contract to start round (if available)
    try {
      await writeContract({
        address: TRIVIA_GAME_ADDRESS,
        abi: triviaGameABI as any,
        functionName: "startNewRound",
        args: [
          newRoundId,
          randomQuestion.question,
          randomQuestion.correctAnswer,
        ],
      });
    } catch (error) {
      console.log("Smart contract not available, using mock mode");
    }
  }, [address, gameState.roundId, writeContract]);

  // Commit answer
  const commitAnswer = useCallback(async () => {
    if (!gameState.currentQuestion || !gameState.playerAnswer.trim()) {
      showToast("Please enter an answer first!", "error");
      return;
    }

    const answerHash = hashAnswer(gameState.playerAnswer, gameState.playerSalt);

    try {
      // Try to call smart contract
      await writeContract({
        address: TRIVIA_GAME_ADDRESS,
        abi: triviaGameABI as any,
        functionName: "commitAnswer",
        args: [gameState.roundId, answerHash],
      });

      setGameState((prev) => ({ ...prev, hasCommitted: true }));
      showToast("✅ Answer committed! Wait for reveal phase...", "success");
    } catch (error) {
      console.log("Smart contract not available, using mock mode");
      setGameState((prev) => ({ ...prev, hasCommitted: true }));
      showToast("✅ Answer committed! (Mock mode)", "success");
    }
  }, [
    gameState.currentQuestion,
    gameState.playerAnswer,
    gameState.playerSalt,
    writeContract,
  ]);

  // Reveal answer
  const revealAnswer = useCallback(async () => {
    if (!gameState.currentQuestion || !gameState.hasCommitted) {
      showToast("Please commit an answer first!", "error");
      return;
    }

    const isCorrect =
      gameState.playerAnswer.toLowerCase() ===
      gameState.currentQuestion.correctAnswer.toLowerCase();

    try {
      // Try to call smart contract
      await writeContract({
        address: TRIVIA_GAME_ADDRESS,
        abi: triviaGameABI as any,
        functionName: "revealAnswer",
        args: [gameState.roundId, gameState.playerAnswer, gameState.playerSalt],
      });

      setGameState((prev) => ({
        ...prev,
        hasRevealed: true,
        isCorrect,
        isAnswering: false,
      }));

      if (isCorrect) {
        const newScore = playerStats.score + 1;
        const newStreak = playerStats.streak + 1;
        setPlayerStats({ score: newScore, streak: newStreak });
        showToast(
          `🎉 Correct! +1 point. Score: ${newScore}, Streak: ${newStreak}`,
          "success"
        );

        // Update leaderboard
        if (address) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                address,
                score: newScore,
                streak: newStreak,
              }),
            });
          } catch (error) {
            console.error("Failed to update leaderboard:", error);
          }
        }
      } else {
        setPlayerStats((prev) => ({ ...prev, streak: 0 }));
        showToast(
          `❌ Wrong! The answer was: ${gameState.currentQuestion.correctAnswer}`,
          "error"
        );

        // Update leaderboard even for wrong answers
        if (address) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                address,
                score: playerStats.score,
                streak: 0,
              }),
            });
          } catch (error) {
            console.error("Failed to update leaderboard:", error);
          }
        }
      }
    } catch (error) {
      console.log("Smart contract not available, using API fallback");

      // Fallback to API call for rewards
      try {
        const response = await fetch("/api/trivia-rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            roundId: gameState.roundId,
            isCorrect,
            answer: gameState.playerAnswer,
            salt: gameState.playerSalt,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ API reward successful:", data);

          if (isCorrect) {
            showToast(
              `🎉 Correct! +10 $TRIVIA tokens awarded! Tx: ${data.transactionHash?.slice(
                0,
                10
              )}...`,
              "success"
            );
          } else {
            showToast(
              `❌ Wrong! +1 $TRIVIA token for participation. Answer: ${gameState.currentQuestion.correctAnswer}`,
              "info"
            );
          }
        } else {
          console.error("API reward failed:", response.status);
          showToast("Reward API failed, but result recorded locally", "error");
        }
      } catch (apiError) {
        console.error("API call failed:", apiError);
        showToast(
          "Reward system unavailable, but result recorded locally",
          "error"
        );
      }

      setGameState((prev) => ({
        ...prev,
        hasRevealed: true,
        isCorrect,
        isAnswering: false,
      }));

      if (isCorrect) {
        const newScore = playerStats.score + 1;
        const newStreak = playerStats.streak + 1;
        setPlayerStats({ score: newScore, streak: newStreak });
        showToast(
          `🎉 Correct! +1 point. Score: ${newScore}, Streak: ${newStreak}`,
          "success"
        );

        // Update leaderboard
        if (address) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                address,
                score: newScore,
                streak: newStreak,
              }),
            });
          } catch (error) {
            console.error("Failed to update leaderboard:", error);
          }
        }
      } else {
        setPlayerStats((prev) => ({ ...prev, streak: 0 }));
        showToast(
          `❌ Wrong! The answer was: ${gameState.currentQuestion.correctAnswer}`,
          "error"
        );

        // Update leaderboard even for wrong answers
        if (address) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                address,
                score: playerStats.score,
                streak: 0,
              }),
            });
          } catch (error) {
            console.error("Failed to update leaderboard:", error);
          }
        }
      }
    }
  }, [
    gameState.currentQuestion,
    gameState.hasCommitted,
    gameState.playerAnswer,
    gameState.playerSalt,
    gameState.roundId,
    playerStats,
    address,
    writeContract,
  ]);

  // Timer effect
  useEffect(() => {
    if (gameState.isAnswering && gameState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            // Time's up - auto reveal if committed
            if (prev.hasCommitted && !prev.hasRevealed) {
              setTimeout(() => revealAnswer(), 100);
            }
            return { ...prev, timeLeft: 0, isAnswering: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [
    gameState.isAnswering,
    gameState.timeLeft,
    gameState.hasCommitted,
    gameState.hasRevealed,
    revealAnswer,
  ]);

  // Share result on Farcaster
  const shareResult = async () => {
    if (!gameState.hasRevealed) return;

    try {
      const resultText = gameState.isCorrect
        ? `🎉 Just answered correctly in Trivia Blitz! Score: ${playerStats.score}, Streak: ${playerStats.streak}`
        : `🤔 Tough question in Trivia Blitz! Score: ${playerStats.score}`;

      if ("actions" in sdk && "cast" in (sdk as any).actions) {
        await (sdk as any).actions.cast({
          text: resultText,
          embeds: [{ url: "https://triviablitz.xyz" }],
        });
        showToast("✅ Shared on Farcaster!", "success");
      } else {
        console.log("Farcaster cast not available");
        showToast("Share feature not available", "info");
      }
    } catch (error: any) {
      console.error("Share failed:", error);
      showToast("Share failed", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get",
            limit: 10,
            timeframe: "all",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Format the leaderboard data for display
            const formattedLeaderboard = data.leaderboard.map((entry: any) => ({
              address: entry.address,
              score: entry.score,
              streak: entry.streak,
              lastPlayed: formatTimeAgo(new Date(entry.lastPlayed)),
            }));
            setLeaderboard(formattedLeaderboard);
          }
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        // Fallback to mock data
        setLeaderboard([
          {
            address: "0x1234...5678",
            score: 15,
            streak: 5,
            lastPlayed: "2 min ago",
          },
          {
            address: "0x8765...4321",
            score: 12,
            streak: 3,
            lastPlayed: "5 min ago",
          },
          {
            address: "0x9999...8888",
            score: 10,
            streak: 2,
            lastPlayed: "8 min ago",
          },
        ]);
      }
    };

    loadLeaderboard();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      {/* Toast notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Connection Status */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {address ? (
            <>
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </>
          ) : (
            <>
              Connect wallet to play!
              <div className="mt-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={isPending}
                    className="bg-coinbase-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {isPending ? "Connecting..." : `Connect ${connector.name}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </p>
      </div>

      {/* Player Stats */}
      <div className="flex gap-4 text-center">
        <div className="bg-blue-100 px-4 py-2 rounded-lg">
          <p className="text-sm text-gray-600">Score</p>
          <p className="text-xl font-bold text-coinbase-blue">
            {playerStats.score}
          </p>
        </div>
        <div className="bg-green-100 px-4 py-2 rounded-lg">
          <p className="text-sm text-gray-600">Streak</p>
          <p className="text-xl font-bold text-green-600">
            {playerStats.streak}
          </p>
        </div>
      </div>

      {/* Timer */}
      {gameState.isAnswering && (
        <div
          className={`text-2xl font-bold ${
            gameState.timeLeft <= 10
              ? "text-red-500 animate-pulse"
              : "text-coinbase-blue"
          }`}
        >
          ⏰ {Math.floor(gameState.timeLeft / 60)}:
          {gameState.timeLeft % 60 < 10 ? "0" : ""}
          {gameState.timeLeft % 60}
        </div>
      )}

      {/* Current Question */}
      {gameState.currentQuestion && (
        <div ref={gameRef} className="w-full max-w-sm">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-bold text-coinbase-blue mb-2">
              Question #{gameState.roundId}
            </h3>
            <p className="text-gray-800 mb-4">
              {gameState.currentQuestion.question}
            </p>

            {/* Answer Input */}
            {gameState.isAnswering && !gameState.hasCommitted && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={gameState.playerAnswer}
                  onChange={(e) =>
                    setGameState((prev) => ({
                      ...prev,
                      playerAnswer: e.target.value,
                    }))
                  }
                  placeholder="Type your answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coinbase-blue"
                />
                <button
                  onClick={commitAnswer}
                  disabled={!gameState.playerAnswer.trim()}
                  className="w-full bg-coinbase-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Commit Answer
                </button>
              </div>
            )}

            {/* Reveal Phase */}
            {gameState.hasCommitted && !gameState.hasRevealed && (
              <div className="text-center">
                <p className="text-green-600 font-bold mb-2">
                  ✅ Answer Committed!
                </p>
                <button
                  onClick={revealAnswer}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600"
                >
                  Reveal Answer
                </button>
              </div>
            )}

            {/* Result */}
            {gameState.hasRevealed && (
              <div
                className={`text-center p-3 rounded-lg ${
                  gameState.isCorrect ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p
                  className={`font-bold ${
                    gameState.isCorrect ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {gameState.isCorrect ? "🎉 Correct!" : "❌ Wrong!"}
                </p>
                <p className="text-sm text-gray-600">
                  Answer: {gameState.currentQuestion.correctAnswer}
                </p>
                <button
                  onClick={shareResult}
                  className="mt-2 bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  Share on Farcaster
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Controls */}
      <div className="flex gap-2">
        <button
          onClick={startNewRound}
          disabled={gameState.isAnswering}
          className="bg-coinbase-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-400"
        >
          {gameState.isAnswering ? "Round in Progress" : "Start New Round"}
        </button>
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="bg-gray-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-600"
        >
          Leaderboard
        </button>
      </div>

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="w-full max-w-sm bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-bold text-coinbase-blue mb-3">
            🏆 Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-white p-2 rounded"
              >
                <div>
                  <p className="font-medium">{entry.address}</p>
                  <p className="text-sm text-gray-600">
                    Streak: {entry.streak}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-coinbase-blue">
                    {entry.score} pts
                  </p>
                  <p className="text-xs text-gray-500">{entry.lastPlayed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!gameState.currentQuestion && (
        <div className="text-center text-gray-600 max-w-sm">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ul className="text-sm space-y-1">
            <li>• Answer questions within 60 seconds</li>
            <li>• Commit your answer to prevent cheating</li>
            <li>• Reveal after timeout to check correctness</li>
            <li>• +1 point per correct answer</li>
            <li>• Track your streak!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
