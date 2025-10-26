/**
 * Sui Network Configuration
 * 
 * Configure the Sui network connection and wallet adapters for the dApp
 */

import { getFullnodeUrl } from '@mysten/sui/client';
import { createNetworkConfig } from '@mysten/dapp-kit';

// Define the networks
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
  },
  localnet: {
    url: 'http://localhost:9000',
  },
});

// Get current network from environment or default to testnet
export const getCurrentNetwork = () => {
  const network = import.meta.env.VITE_SUI_NETWORK || 'testnet';
  return network as 'testnet' | 'mainnet' | 'devnet' | 'localnet';
};

export { networkConfig, useNetworkVariable, useNetworkVariables };

