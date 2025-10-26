/**
 * Application Constants
 * 
 * Contract addresses, object types, and other configuration constants
 * sourced from environment variables
 */

// Sui Network
export const SUI_NETWORK = import.meta.env.VITE_SUI_NETWORK || 'testnet';

// Smart Contract Package ID
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';

// Object Types
export const OBJECT_TYPES = {
  PROJECT: import.meta.env.VITE_PROJECT_TYPE || '',
  CONTRIBUTION: import.meta.env.VITE_CONTRIBUTION_TYPE || '',
  FEEDBACK: import.meta.env.VITE_FEEDBACK_TYPE || '',
} as const;

// Walrus Configuration
export const WALRUS_CONFIG = {
  PUBLISHER_URL: import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  AGGREGATOR_URL: import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
} as const;

// Module Functions
export const MODULE_FUNCTIONS = {
  CREATE_PROJECT: `${PACKAGE_ID}::foundry::create_project`,
  FUND_PROJECT: `${PACKAGE_ID}::foundry::fund_project`,
  CLAIM_FUNDS: `${PACKAGE_ID}::foundry::claim_funds`,
  RECLAIM_FUNDS: `${PACKAGE_ID}::foundry::reclaim_funds`,
  POST_JOB: `${PACKAGE_ID}::foundry::post_job`,
  CREATE_POLL: `${PACKAGE_ID}::foundry::create_poll`,
  VOTE_ON_POLL: `${PACKAGE_ID}::foundry::vote_on_poll`,
  SUBMIT_FEEDBACK: `${PACKAGE_ID}::foundry::submit_feedback`,
} as const;

// Validate configuration on load
if (import.meta.env.DEV) {
  if (!PACKAGE_ID) {
    console.warn('⚠️ VITE_PACKAGE_ID is not set in environment variables');
  }
  if (!OBJECT_TYPES.PROJECT) {
    console.warn('⚠️ VITE_PROJECT_TYPE is not set in environment variables');
  }
  if (!OBJECT_TYPES.CONTRIBUTION) {
    console.warn('⚠️ VITE_CONTRIBUTION_TYPE is not set in environment variables');
  }
  if (!OBJECT_TYPES.FEEDBACK) {
    console.warn('⚠️ VITE_FEEDBACK_TYPE is not set in environment variables');
  }
}

// Export a validation function
export const isConfigValid = (): boolean => {
  return !!(
    PACKAGE_ID &&
    OBJECT_TYPES.PROJECT &&
    OBJECT_TYPES.CONTRIBUTION &&
    OBJECT_TYPES.FEEDBACK
  );
};

// Gas budget defaults (in MIST)
export const GAS_BUDGET = {
  CREATE_PROJECT: 50_000_000, // 0.05 SUI
  FUND_PROJECT: 100_000_000, // 0.1 SUI
  CLAIM_FUNDS: 100_000_000, // 0.1 SUI
  RECLAIM_FUNDS: 100_000_000, // 0.1 SUI
  POST_JOB: 50_000_000, // 0.05 SUI
  CREATE_POLL: 100_000_000, // 0.1 SUI
  VOTE_ON_POLL: 50_000_000, // 0.05 SUI
  SUBMIT_FEEDBACK: 50_000_000, // 0.05 SUI
} as const;

// MIST to SUI conversion
export const MIST_PER_SUI = 1_000_000_000;

// Utility function to convert SUI to MIST
export const suiToMist = (sui: number): number => {
  return Math.floor(sui * MIST_PER_SUI);
};

// Utility function to convert MIST to SUI
export const mistToSui = (mist: number): number => {
  return mist / MIST_PER_SUI;
};

