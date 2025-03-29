import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram, 
  sendAndConfirmTransaction, 
  ParsedAccountData 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout, 
  MintLayout, 
  createInitializeMintInstruction, 
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction
} from "@solana/spl-token";
import bs58 from "bs58";

export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply?: number;
  image?: string;
  balance?: number;
};

export type TokenCreationParams = {
  connection: Connection;
  payer: PublicKey;
  mintAuthority: PublicKey;
  name: string;
  symbol: string;
  decimals: number;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
};

export type TokenMintParams = {
  connection: Connection;
  payer: PublicKey;
  mintAuthority: PublicKey;
  tokenAddress: string;
  destinationAddress: string;
  amount: number;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
};

export type TokenTransferParams = {
  connection: Connection;
  payer: PublicKey;
  source: string;
  destination: string;
  owner: PublicKey;
  amount: number;
  tokenAddress: string;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
};

export const createToken = async ({
  connection,
  payer,
  mintAuthority,
  name,
  symbol,
  decimals,
  signTransaction
}: TokenCreationParams): Promise<{
  tokenAddress: string;
  signature: string;
}> => {
  try {
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey;

    const mintRentBalance = await connection.getMinimumBalanceForRentExemption(
      MintLayout.span
    );

    const transaction = new Transaction();

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mintAddress,
        space: MintLayout.span,
        lamports: mintRentBalance,
        programId: TOKEN_PROGRAM_ID,
      })
    );

    transaction.add(
      createInitializeMintInstruction(
        mintAddress,
        decimals,
        mintAuthority,
        mintAuthority,
        TOKEN_PROGRAM_ID
      )
    );

    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      payer,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        associatedTokenAccount,
        payer,
        mintAddress,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    transaction.partialSign(mintKeypair);
    
    const signedTransaction = await signTransaction(transaction);
    
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );
    
    await connection.confirmTransaction(signature);

    return {
      tokenAddress: mintAddress.toString(),
      signature,
    };
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
};

export const mintToken = async ({
  connection,
  payer,
  mintAuthority,
  tokenAddress,
  destinationAddress,
  amount,
  signTransaction
}: TokenMintParams): Promise<string> => {
  try {
    const transaction = new Transaction();
    
    const mintPublicKey = new PublicKey(tokenAddress);
    const destinationPublicKey = new PublicKey(destinationAddress);
    
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    
    let decimals = 9;
    if (mintInfo.value && 'parsed' in mintInfo.value.data) {
      decimals = (mintInfo.value.data as ParsedAccountData).parsed.info.decimals;
    }
    
    const amountToMint = amount * Math.pow(10, decimals);
    
    transaction.add(
      createMintToInstruction(
        mintPublicKey,
        destinationPublicKey,
        mintAuthority,
        BigInt(amountToMint),
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    const signedTransaction = await signTransaction(transaction);
    
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );
    
    await connection.confirmTransaction(signature);
    
    return signature;
  } catch (error) {
    console.error("Error minting token:", error);
    throw error;
  }
};

export const transferToken = async ({
  connection,
  payer,
  source,
  destination,
  owner,
  amount,
  tokenAddress,
  signTransaction
}: TokenTransferParams): Promise<string> => {
  try {
    const transaction = new Transaction();
    
    const sourcePublicKey = new PublicKey(source);
    const destinationPublicKey = new PublicKey(destination);
    const mintPublicKey = new PublicKey(tokenAddress);
    
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      destinationPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    const destinationAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
    
    if (!destinationAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          destinationTokenAccount,
          destinationPublicKey,
          mintPublicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    
    let decimals = 9;
    if (mintInfo.value && 'parsed' in mintInfo.value.data) {
      decimals = (mintInfo.value.data as ParsedAccountData).parsed.info.decimals;
    }
    
    const amountToTransfer = amount * Math.pow(10, decimals);
    
    transaction.add(
      createTransferInstruction(
        sourcePublicKey,
        destinationTokenAccount,
        owner,
        BigInt(amountToTransfer),
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    const signedTransaction = await signTransaction(transaction);
    
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );
    
    await connection.confirmTransaction(signature);
    
    return signature;
  } catch (error) {
    console.error("Error transferring token:", error);
    throw error;
  }
};

export const getTokenBalance = async (
  connection: Connection,
  wallet: PublicKey,
  tokenAddress: string
): Promise<number> => {
  try {
    const mintPublicKey = new PublicKey(tokenAddress);
    
    const tokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      wallet,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    try {
      const accountInfo = await connection.getAccountInfo(tokenAccount);
      
      if (!accountInfo) {
        return 0;
      }
      
      const accountData = AccountLayout.decode(accountInfo.data);
      
      const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
      
      let decimals = 9;
      if (mintInfo.value && 'parsed' in mintInfo.value.data) {
        decimals = (mintInfo.value.data as ParsedAccountData).parsed.info.decimals;
      }
      
      const balance = Number(accountData.amount) / Math.pow(10, decimals);
      
      return balance;
    } catch (error) {
      console.error("Error fetching token account:", error);
      return 0;
    }
  } catch (error) {
    console.error("Error getting token balance:", error);
    return 0;
  }
};

export const getAllTokensForWallet = async (
  connection: Connection,
  wallet: PublicKey
): Promise<TokenInfo[]> => {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    const tokens: TokenInfo[] = [];
    
    for (const { account } of tokenAccounts.value) {
      const parsedAccountInfo: any = account.data.parsed.info;
      const mint = parsedAccountInfo.mint;
      const balance = parsedAccountInfo.tokenAmount.uiAmount;
      
      if (balance > 0) {
        try {
          const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
          
          let decimals = 9;
          if (mintInfo.value && 'parsed' in mintInfo.value.data) {
            decimals = (mintInfo.value.data as ParsedAccountData).parsed.info.decimals;
          }
          
          tokens.push({
            address: mint,
            symbol: "",
            name: "",
            decimals,
            balance
          });
        } catch (error) {
          console.error("Error fetching mint info:", error);
          tokens.push({
            address: mint,
            symbol: "Unknown",
            name: "Unknown",
            decimals: 9,
            balance
          });
        }
      }
    }
    
    return tokens;
  } catch (error) {
    console.error("Error getting all tokens for wallet:", error);
    return [];
  }
};
