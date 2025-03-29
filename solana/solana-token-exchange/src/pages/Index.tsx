
import React from "react";
import WalletButton from "@/components/WalletButton";
import WalletInfo from "@/components/WalletInfo";
import TokenCreate from "@/components/TokenCreate";
import TokenMint from "@/components/TokenMint";
import TokenSend from "@/components/TokenSend";
import TokenBalances from "@/components/TokenBalances";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletContext } from "@/contexts/WalletContext";

const Index = () => {
  const { publicKey } = useWallet();
  const { network } = useWalletContext();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-solana-dark to-black">
      {/* Header */}
      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-solana-purple">Solana</span> Token Exchange
          </h1>
        </div>
        <div className="flex items-center">
          <WalletButton />
        </div>
      </header>

      {/* Network banner */}
      <div className="bg-blue-500/20 py-1 text-center text-sm">
        <p className="text-white">
          Connected to <span className="font-bold">{network}</span> network
        </p>
      </div>

      {/* Main content */}
      <main className="container mx-auto py-8 flex-grow space-y-8">
        {/* Wallet Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletInfo />
          <TokenBalances />
        </section>

        {/* Token Operations */}
        {publicKey ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TokenCreate />
            <TokenMint />
            <TokenSend />
          </section>
        ) : (
          <section className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Connect a Solana wallet like Phantom or Solflare to create, mint, and transfer tokens.
            </p>
            <WalletButton className="mx-auto" />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="container mx-auto py-6 text-center text-gray-500 text-sm">
        <p>Solana Token Exchange - Running on {network}</p>
      </footer>
    </div>
  );
};

export default Index;
