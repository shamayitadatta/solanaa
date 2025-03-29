
import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TokenInfo, getAllTokensForWallet } from "@/services/TokenService";

const TokenBalances = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTokens = async () => {
    if (!publicKey) {
      setTokens([]);
      return;
    }

    try {
      setLoading(true);
      const tokenList = await getAllTokensForWallet(connection, publicKey);
      setTokens(tokenList);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [publicKey, connection]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <GlassCard className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Token Balances</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchTokens}
          disabled={loading || !publicKey}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>
      
      {!publicKey ? (
        <p>Please connect your wallet to view tokens</p>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-14 rounded-md w-full"></div>
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <p>No tokens found in your wallet</p>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div 
              key={token.address} 
              className="p-3 bg-white/5 rounded-md flex justify-between items-center"
            >
              <div>
                <p className="font-mono text-xs">{truncateAddress(token.address)}</p>
                <p className="text-gray-400 text-xs">
                  {token.name || "Unknown Token"} {token.symbol ? `(${token.symbol})` : ""}
                </p>
              </div>
              <p className="font-bold">{token.balance?.toFixed(token.decimals)}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default TokenBalances;
