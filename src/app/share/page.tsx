"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SharePageContent() {
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
        <p className="text-lg mb-4">Redirecting to Warpcast...</p>
        <a
          href={warpcastUrl}
          className="text-blue-200 hover:text-white underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here if you're not redirected automatically
        </a>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-coinbase-blue text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      }
    >
      <SharePageContent />
    </Suspense>
  );
}
