
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { 
  ConnectionProvider, 
  WalletProvider, 
  useWallet, 
  useConnection 
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Cluster, clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

// Default styles that can be overridden
import "@solana/wallet-adapter-react-ui/styles.css";

type WalletContextType = {
  balance: number;
  network: Cluster;
  setNetwork: (network: Cluster) => void;
  connecting: boolean;
  disconnecting: boolean;
  airdropSol: () => Promise<void>;
  loading: {
    balance: boolean;
    airdrop: boolean;
  };
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [network, setNetwork] = useState<Cluster>("devnet");
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState({
    balance: false,
    airdrop: false,
  });

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextContent 
            balance={balance} 
            setBalance={setBalance} 
            network={network} 
            setNetwork={setNetwork}
            loading={loading}
            setLoading={setLoading}
          >
            {children}
          </WalletContextContent>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const WalletContextContent = ({ 
  children, 
  balance, 
  setBalance, 
  network, 
  setNetwork,
  loading,
  setLoading
}: { 
  children: React.ReactNode; 
  balance: number; 
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  network: Cluster;
  setNetwork: React.Dispatch<React.SetStateAction<Cluster>>;
  loading: {
    balance: boolean;
    airdrop: boolean;
  };
  setLoading: React.Dispatch<React.SetStateAction<{
    balance: boolean;
    airdrop: boolean;
  }>>;
}) => {
  const { publicKey, connecting, disconnecting } = useWallet();
  const { connection } = useConnection();

  const fetchBalance = async () => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, balance: true }));
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast.error("Failed to fetch wallet balance");
    } finally {
      setLoading(prev => ({ ...prev, balance: false }));
    }
  };

  const airdropSol = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, airdrop: true }));
      const signature = await connection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL * 1
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      toast.success("Airdrop of 1 SOL successful!");
      
      // Update balance
      await fetchBalance();
    } catch (error) {
      console.error("Error airdropping SOL:", error);
      toast.error("Failed to airdrop SOL");
    } finally {
      setLoading(prev => ({ ...prev, airdrop: false }));
    }
  };

  // Fetch balance when wallet changes or when network changes
  useEffect(() => {
    fetchBalance();
    
    // Also set up a balance refresh interval
    const intervalId = setInterval(fetchBalance, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [publicKey, connection, network]);

  const value = {
    balance,
    network,
    setNetwork,
    connecting,
    disconnecting,
    airdropSol,
    loading,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletContextProvider");
  }
  return context;
};
