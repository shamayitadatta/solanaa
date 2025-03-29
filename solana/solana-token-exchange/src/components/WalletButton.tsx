
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Loader, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const WalletButton = ({ className }: { className?: string }) => {
  const { publicKey, connecting } = useWallet();

  return (
    <div className={cn("relative", className)}>
      {connecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md z-10">
          <Loader className="animate-spin text-white h-5 w-5" />
        </div>
      )}
      <WalletMultiButton className="wallet-adapter-button-custom" />
    </div>
  );
};

export default WalletButton;
