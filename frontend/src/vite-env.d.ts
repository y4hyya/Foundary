/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
  readonly VITE_PACKAGE_ID: string;
  readonly VITE_PROJECT_TYPE: string;
  readonly VITE_CONTRIBUTION_TYPE: string;
  readonly VITE_FEEDBACK_TYPE: string;
  readonly VITE_WALRUS_PUBLISHER_URL: string;
  readonly VITE_WALRUS_AGGREGATOR_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

