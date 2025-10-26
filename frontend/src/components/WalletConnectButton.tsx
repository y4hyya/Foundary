import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import './WalletConnectButton.css';

/**
 * WalletConnectButton - Global wallet connection component
 * 
 * This component wraps the @mysten/dapp-kit ConnectButton to provide
 * wallet connection functionality throughout the application.
 */
export default function WalletConnectButton() {
  const account = useCurrentAccount();

  return (
    <div className="wallet-connect-wrapper">
      <ConnectButton />
      {account && (
        <div className="wallet-info">
          <span className="wallet-status">Connected</span>
        </div>
      )}
    </div>
  );
}

