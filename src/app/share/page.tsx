"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SharePage() {
  const searchParams = useSearchParams();
  const shareText = encodeURIComponent(
    searchParams.get("text") || "Just won at Based Blitz! Play now:"
  );
  const shareUrl = encodeURIComponent(
    searchParams.get("url") || "https://basedblitz.xyz"
  );
  const warpcastUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${shareUrl}`;

  useEffect(() => {
    window.location.href = warpcastUrl;
  }, [warpcastUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-coinbase-blue text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sharing Based Blitz...</h1>
        <p className="text-lg">Redirecting to Warpcast...</p>
        <div className="mt-4">
          <a
            href={warpcastUrl}
            className="bg-white text-coinbase-blue px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            aria-label="Share on Warpcast"
          >
            Click here if not redirected
          </a>
        </div>
      </div>
    </div>
  );
}
