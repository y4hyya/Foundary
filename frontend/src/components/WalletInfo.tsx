import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';

/**
 * WalletInfo - Display current wallet connection information
 * 
 * Example component showing how to access wallet state
 */
export default function WalletInfo() {
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();

  if (!account) {
    return (
      <div className="wallet-info-card">
        <p>No wallet connected</p>
        <p className="text-muted">Please connect your Sui wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="wallet-info-card">
      <h3>Connected Wallet</h3>
      <div className="wallet-details">
        <div className="detail-row">
          <span className="label">Wallet:</span>
          <span className="value">{currentWallet?.name || 'Unknown'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Address:</span>
          <span className="value address">
            {account.address.slice(0, 8)}...{account.address.slice(-6)}
          </span>
        </div>
      </div>
    </div>
  );
}

