import { Metadata } from "next";
import { MiniKitProvider } from "@/providers/MiniKitProvider";
import TriviaGame from "@/components/TriviaGame";

export const metadata: Metadata = {
  title: "Trivia Blitz",
  description:
    "Play Trivia Blitz on Farcaster and Coinbase Wallet! Win $TRIVIA tokens soon.",
  keywords: "trivia, game, farcaster, coinbase, web3, interactive",
  authors: [{ name: "Trivia Blitz Team" }],
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      name: "Trivia Blitz", // Required top-level: App name (max 32 chars)
      imageUrl: "https://www.triviablitz.xyz/preview.png", // Fixed URL to match domain
      button: {
        title: "Play Trivia Blitz", // Max 32 chars
        action: {
          type: "launch_frame",
          name: "launch", // Add this for Action validation (short identifier, e.g., "play" or "open")
          url: "https://www.triviablitz.xyz", // Fixed URL to match domain
        },
      },
    }),
    "fc:frame": JSON.stringify({
      // Backward compatibility fallback
      version: "1",
      name: "Trivia Blitz",
      imageUrl: "https://www.triviablitz.xyz/preview.png", // Fixed URL to match domain
      button: {
        title: "Play Trivia Blitz",
        action: {
          type: "launch_frame",
          name: "launch",
          url: "https://www.triviablitz.xyz", // Fixed URL to match domain
        },
      },
    }),
  },
};

export default function Home() {
  return (
    <MiniKitProvider>
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-coinbase-blue p-4">
        <h1 className="text-3xl font-bold mb-4">Trivia Blitz</h1>
        <TriviaGame />
      </main>
    </MiniKitProvider>
  );
}
