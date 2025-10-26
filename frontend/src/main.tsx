import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { networkConfig, getCurrentNetwork } from './config/sui';
import { isConfigValid } from './config/constants';
import './index.css';
import '@mysten/dapp-kit/dist/index.css';
import App from './App.tsx';

// Create a QueryClient instance with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds by default
      staleTime: 30_000,
      // Retry failed queries up to 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch when network reconnects
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Get the current network
const currentNetwork = getCurrentNetwork();

// Validate configuration before rendering
if (import.meta.env.DEV && !isConfigValid()) {
  console.error('❌ Missing required environment variables. Check your .env file.');
}

console.log('🚀 Foundry dApp initializing...');
console.log(`📡 Network: ${currentNetwork}`);
console.log(`✅ Config valid: ${isConfigValid()}`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={currentNetwork}>
        <WalletProvider 
          autoConnect
          storageKey="foundry:wallet-connection"
        >
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
);
