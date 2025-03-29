
import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { Check, Copy, Loader } from "lucide-react";
import { createToken } from "@/services/TokenService";
import { toast } from "sonner";

const TokenCreate = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [loading, setLoading] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateToken = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!name || !symbol) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      const result = await createToken({
        connection,
        payer: publicKey,
        mintAuthority: publicKey,
        name,
        symbol,
        decimals,
        signTransaction
      });
      
      setTokenAddress(result.tokenAddress);
      toast.success("Token created successfully!");
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setName("");
    setSymbol("");
    setDecimals(9);
    setTokenAddress("");
  };

  return (
    <GlassCard className="w-full">
      <h2 className="text-xl font-bold mb-4">Create Token</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="token-name">Token Name</Label>
          <Input
            id="token-name"
            placeholder="My Token"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="token-symbol">Token Symbol</Label>
          <Input
            id="token-symbol"
            placeholder="TKN"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="token-decimals">Decimals</Label>
          <Input
            id="token-decimals"
            type="number"
            min={0}
            max={9}
            value={decimals}
            onChange={(e) => setDecimals(Number(e.target.value))}
            disabled={loading}
          />
        </div>
        
        {tokenAddress ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="token-address">Token Address</Label>
              <div className="flex">
                <Input
                  id="token-address"
                  value={tokenAddress}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="ml-2" 
                  onClick={handleCopyAddress}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleReset}
            >
              Create Another Token
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleCreateToken} 
            disabled={loading || !publicKey} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Token"
            )}
          </Button>
        )}
      </div>
    </GlassCard>
  );
};

export default TokenCreate;
