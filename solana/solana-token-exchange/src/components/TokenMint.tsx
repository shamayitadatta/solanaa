
import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { Loader } from "lucide-react";
import { mintToken } from "@/services/TokenService";
import { toast } from "sonner";
import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

const TokenMint = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMintToken = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!tokenAddress) {
      toast.error("Please enter a token address");
      return;
    }

    try {
      setLoading(true);
      
      // Validate the token address
      const mintPublicKey = new PublicKey(tokenAddress);
      
      // Get the associated token account address
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      const signature = await mintToken({
        connection,
        payer: publicKey,
        mintAuthority: publicKey,
        tokenAddress,
        destinationAddress: associatedTokenAccount.toString(),
        amount,
        signTransaction
      });
      
      toast.success("Tokens minted successfully!");
      setSuccess(true);
      
      // Reset success state after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error minting tokens:", error);
      toast.error("Failed to mint tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full">
      <h2 className="text-xl font-bold mb-4">Mint Tokens</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="mint-token-address">Token Address</Label>
          <Input
            id="mint-token-address"
            placeholder="Enter token address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="mint-amount">Amount to Mint</Label>
          <Input
            id="mint-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={loading}
          />
        </div>
        
        <Button 
          onClick={handleMintToken} 
          disabled={loading || !publicKey || success} 
          className="w-full"
          variant={success ? "secondary" : "default"}
        >
          {loading ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Minting...
            </>
          ) : success ? (
            "Tokens Minted Successfully!"
          ) : (
            "Mint Tokens"
          )}
        </Button>
      </div>
    </GlassCard>
  );
};

export default TokenMint;
