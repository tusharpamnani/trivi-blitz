import { NextRequest, NextResponse } from "next/server";

// Mock database - in production, use a real database like Supabase, Firebase, or PostgreSQL
let mockLeaderboard = [
  {
    address: "0x1234...5678",
    score: 15,
    streak: 5,
    lastPlayed: "2024-01-15T10:30:00Z",
  },
  {
    address: "0x8765...4321",
    score: 12,
    streak: 3,
    lastPlayed: "2024-01-15T10:25:00Z",
  },
  {
    address: "0x9999...8888",
    score: 10,
    streak: 2,
    lastPlayed: "2024-01-15T10:20:00Z",
  },
];

interface LeaderboardEntry {
  address: string;
  score: number;
  streak: number;
  lastPlayed: string;
}

// Health check endpoint
export async function GET() {
  console.log("🏥 Leaderboard health check called");

  return NextResponse.json({
    status: "healthy",
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      leaderboardSize: mockLeaderboard.length,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  console.log("🚀 Leaderboard API called at:", new Date().toISOString());

  try {
    const requestBody = await request.json();
    const { action, address, score, streak } = requestBody;

    console.log("📋 Request details:", {
      action,
      address: address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "undefined",
      score,
      streak,
    });

    if (action === "update") {
      // Update player score
      if (!address || score === undefined) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid request: address and score required for update",
          },
          { status: 400 }
        );
      }

      const existingIndex = mockLeaderboard.findIndex(
        (entry) => entry.address === address
      );
      const now = new Date().toISOString();

      if (existingIndex >= 0) {
        // Update existing entry
        mockLeaderboard[existingIndex] = {
          ...mockLeaderboard[existingIndex],
          score: Math.max(mockLeaderboard[existingIndex].score, score),
          streak: streak || mockLeaderboard[existingIndex].streak,
          lastPlayed: now,
        };
      } else {
        // Add new entry
        mockLeaderboard.push({
          address,
          score,
          streak: streak || 0,
          lastPlayed: now,
        });
      }

      // Sort by score (descending)
      mockLeaderboard.sort((a, b) => b.score - a.score);

      console.log("✅ Leaderboard updated successfully");

      return NextResponse.json({
        success: true,
        message: "Score updated successfully",
        playerRank:
          mockLeaderboard.findIndex((entry) => entry.address === address) + 1,
        totalPlayers: mockLeaderboard.length,
        timestamp: new Date().toISOString(),
      });
    } else if (action === "get") {
      // Get leaderboard data
      const { limit = 10, timeframe = "all" } = requestBody;

      let filteredLeaderboard = [...mockLeaderboard];

      // Filter by timeframe if specified
      if (timeframe === "daily") {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        filteredLeaderboard = mockLeaderboard.filter(
          (entry) => new Date(entry.lastPlayed) > oneDayAgo
        );
      } else if (timeframe === "weekly") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filteredLeaderboard = mockLeaderboard.filter(
          (entry) => new Date(entry.lastPlayed) > oneWeekAgo
        );
      }

      // Limit results
      const limitedLeaderboard = filteredLeaderboard.slice(0, limit);

      console.log("✅ Leaderboard retrieved successfully");

      return NextResponse.json({
        success: true,
        leaderboard: limitedLeaderboard,
        totalPlayers: filteredLeaderboard.length,
        timeframe,
        timestamp: new Date().toISOString(),
      });
    } else if (action === "getPlayer") {
      // Get specific player data
      if (!address) {
        return NextResponse.json(
          { success: false, message: "Address required for getPlayer action" },
          { status: 400 }
        );
      }

      const player = mockLeaderboard.find((entry) => entry.address === address);

      if (!player) {
        return NextResponse.json({
          success: true,
          player: null,
          message: "Player not found",
        });
      }

      const playerRank =
        mockLeaderboard.findIndex((entry) => entry.address === address) + 1;

      console.log("✅ Player data retrieved successfully");

      return NextResponse.json({
        success: true,
        player: {
          ...player,
          rank: playerRank,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Use "update", "get", or "getPlayer"',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ Leaderboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
