
import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { Loader } from "lucide-react";
import { transferToken, getTokenBalance } from "@/services/TokenService";
import { toast } from "sonner";
import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

const TokenSend = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCheckBalance = async () => {
    if (!publicKey || !tokenAddress) return;
    
    try {
      setCheckingBalance(true);
      const balance = await getTokenBalance(connection, publicKey, tokenAddress);
      setBalance(balance);
      
      if (balance === 0) {
        toast.error("You don't have any tokens of this type");
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      toast.error("Failed to check token balance");
      setBalance(null);
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleSendToken = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!tokenAddress || !recipientAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      // Validate addresses
      const mintPublicKey = new PublicKey(tokenAddress);
      new PublicKey(recipientAddress); // This will throw if invalid
      
      // Get the source token account
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      const signature = await transferToken({
        connection,
        payer: publicKey,
        source: sourceTokenAccount.toString(),
        destination: recipientAddress,
        owner: publicKey,
        amount,
        tokenAddress,
        signTransaction
      });
      
      toast.success("Tokens sent successfully!");
      setSuccess(true);
      
      // Reset success state after a delay
      setTimeout(() => {
        setSuccess(false);
        handleCheckBalance(); // Refresh balance
      }, 3000);
    } catch (error) {
      console.error("Error sending tokens:", error);
      toast.error("Failed to send tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full">
      <h2 className="text-xl font-bold mb-4">Send Tokens</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="send-token-address">Token Address</Label>
          <div className="flex">
            <Input
              id="send-token-address"
              placeholder="Enter token address"
              value={tokenAddress}
              onChange={(e) => {
                setTokenAddress(e.target.value);
                setBalance(null);
              }}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              className="ml-2" 
              onClick={handleCheckBalance}
              disabled={!publicKey || !tokenAddress || checkingBalance}
            >
              {checkingBalance ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                "Check"
              )}
            </Button>
          </div>
          {balance !== null && (
            <p className="text-sm mt-1">
              Balance: {balance} tokens
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="recipient-address">Recipient Address</Label>
          <Input
            id="recipient-address"
            placeholder="Enter recipient wallet address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="send-amount">Amount to Send</Label>
          <Input
            id="send-amount"
            type="number"
            min={1}
            max={balance ?? undefined}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={loading}
          />
        </div>
        
        <Button 
          onClick={handleSendToken} 
          disabled={loading || !publicKey || success || (balance !== null && (balance === 0 || amount > balance))} 
          className="w-full"
          variant={success ? "secondary" : "default"}
        >
          {loading ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Sending...
            </>
          ) : success ? (
            "Tokens Sent Successfully!"
          ) : (
            "Send Tokens"
          )}
        </Button>
      </div>
    </GlassCard>
  );
};

export default TokenSend;
