import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { networkConfig, getCurrentNetwork } from './config/sui';
import './index.css';
import '@mysten/dapp-kit/dist/index.css';
import App from './App.tsx';

// Create a QueryClient instance
const queryClient = new QueryClient();

// Get the current network
const currentNetwork = getCurrentNetwork();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={currentNetwork}>
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
);
