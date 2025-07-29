"use client";

import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base } from "wagmi/chains";
import { http } from "wagmi";
import { ReactNode, useState, useEffect } from "react";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

interface MiniKitProviderProps {
  children: ReactNode;
}

export function MiniKitProvider({ children }: MiniKitProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initTimeout = setTimeout(() => {
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }, 5000);
    try {
      setIsInitialized(true);
      clearTimeout(initTimeout);
    } catch (err: any) {
      setError(err.message);
      setIsInitialized(true);
      clearTimeout(initTimeout);
    }
    return () => clearTimeout(initTimeout);
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-coinbase-blue">
        <div className="text-xl font-bold mb-4">Loading Based Bingo...</div>
        <div className="text-sm text-gray-600">
          Initializing wallet connections...
        </div>
      </div>
    );
  }

  if (error) {
    console.error(
      "❌ Provider error, but continuing with limited functionality:",
      error
    );
  }

  return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
  );
}
