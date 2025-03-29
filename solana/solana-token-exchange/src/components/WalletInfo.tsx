
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useWalletContext } from "@/contexts/WalletContext";

const WalletInfo = () => {
  const { publicKey } = useWallet();
  const { balance, airdropSol, loading } = useWalletContext();
  const [copied, setCopied] = useState(false);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <GlassCard className="w-full">
      <h2 className="text-xl font-bold mb-4">Wallet Info</h2>
      
      {publicKey ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Address</p>
            <div className="flex items-center">
              <p className="font-mono">{truncateAddress(publicKey.toString())}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={copyAddress}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">SOL Balance</p>
            <div className="flex items-center">
              <p className="font-bold">
                {loading.balance ? (
                  <span className="shimmer inline-block w-20 h-6 rounded bg-gray-700"></span>
                ) : (
                  `${balance.toFixed(4)} SOL`
                )}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={airdropSol}
                disabled={loading.airdrop}
              >
                <RefreshCw size={16} className={loading.airdrop ? "animate-spin" : ""} />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Click refresh to request an airdrop (devnet only)</p>
          </div>
        </div>
      ) : (
        <p>Please connect your wallet to view details</p>
      )}
    </GlassCard>
  );
};

export default WalletInfo;
