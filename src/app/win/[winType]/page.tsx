import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ winType: string }>;
}): Promise<Metadata> {
  const { winType } = await params; // e.g., 'line', 'double', 'full-house'

  // Format win type for display
  const displayWinType = winType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Use dynamic image generation
  const previewImage = `https://basedblitz.xyz/api/generate-win-image?type=${winType}&count=1`;

  return {
    title: `I Won ${displayWinType} in Based Blitz!`,
    description: "Join the fun and win $BLITZ tokens on Base.",
    keywords: "blitz, win, farcaster, coinbase, web3, $BLITZ",
    authors: [{ name: "Based Blitz Team" }],
    openGraph: {
      title: `I Won ${displayWinType} in Based Blitz!`,
      description: "Join the fun and win $BLITZ tokens on Base.",
      images: [previewImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `I Won ${displayWinType} in Based Blitz!`,
      description: "Join the fun and win $BLITZ tokens on Base.",
      images: [previewImage],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "1",
        imageUrl: previewImage,
        name: "Based Blitz Win",
        button: {
          title: "Play Based Blitz",
          action: {
            type: "launch_frame",
            name: "play",
            url: "https://basedblitz.xyz",
          },
        },
      }),
      "fc:miniapp": JSON.stringify({
        // For Mini App compatibility
        version: "1",
        name: "Based Blitz Win",
        imageUrl: previewImage,
        button: {
          title: "Play Based Blitz",
          action: {
            type: "launch_frame",
            name: "play",
            url: "https://basedblitz.xyz",
          },
        },
      }),
    },
  };
}

export default async function WinPage({
  params,
}: {
  params: Promise<{ winType: string }>;
}) {
  const { winType } = await params;

  // Format win type for display
  const displayWinType = winType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen flex items-center justify-center bg-coinbase-blue text-white">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">🎉 BLITZ! 🎉</h1>
        <h2 className="text-2xl font-bold mb-6">{displayWinType} Win!</h2>
        <p className="text-lg mb-8">
          Congratulations! You won {displayWinType} in Based Blitz!
        </p>
        <div className="space-y-4">
          <a
            href="https://basedblitz.xyz"
            className="block bg-white text-coinbase-blue px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Play Based Blitz
          </a>
          <p className="text-sm opacity-75">
            Share this URL on Farcaster to show off your win!
          </p>
        </div>
      </div>
    </div>
  );
}
