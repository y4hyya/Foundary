/**
 * Custom hooks for Sui blockchain interactions
 */

import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

/**
 * Hook to get the current connected wallet and Sui client
 */
export const useSuiProvider = () => {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return {
    account,
    client,
    signAndExecute,
    isConnected: !!account,
    address: account?.address,
  };
};

/**
 * Hook to execute transactions with error handling
 */
export const useExecuteTransaction = () => {
  const { signAndExecute, account } = useSuiProvider();

  const executeTransaction = async (
    transaction: Transaction,
    options?: {
      onSuccess?: (digest: string) => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    if (!account) {
      const errorMsg = 'Please connect your wallet first';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const result = await signAndExecute({
        transaction,
        chain: 'sui:testnet',
      });

      const digest = result.digest;
      
      if (options?.successMessage) {
        console.log(options.successMessage);
      }
      
      if (options?.onSuccess) {
        options.onSuccess(digest);
      }

      return result;
    } catch (error) {
      const errorMsg = options?.errorMessage || 'Transaction failed';
      const err = error as Error;
      
      console.error('Transaction error:', err);
      console.error(`${errorMsg}: ${err.message}`);
      
      if (options?.onError) {
        options.onError(err);
      }

      throw error;
    }
  };

  return { executeTransaction };
};

/**
 * Hook to format SUI amounts
 */
export const useFormatSui = () => {
  const MIST_PER_SUI = 1_000_000_000;

  const formatSui = (mist: string | number): string => {
    const amount = typeof mist === 'string' ? parseInt(mist) : mist;
    return (amount / MIST_PER_SUI).toFixed(4);
  };

  const formatSuiToMist = (sui: number): number => {
    return Math.floor(sui * MIST_PER_SUI);
  };

  return { formatSui, formatSuiToMist, MIST_PER_SUI };
};

