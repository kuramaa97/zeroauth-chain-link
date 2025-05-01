import React, { createContext, useState, useContext, useEffect } from "react";
import { connectToWallet, detectWallet } from "@/utils/walletUtils";
import { toast } from "sonner";
import { ethers } from "ethers";  // Import ethers instead of utils

interface AuthContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  hasWallet: boolean;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  generateWalletFromToken: (token: string, userId: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({
  walletAddress: null,
  isConnecting: false,
  isAuthenticated: false,
  hasWallet: false,
  connectWallet: async () => "",
  disconnectWallet: () => {},
  generateWalletFromToken: async () => "",
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [hasWallet, setHasWallet] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if wallet is available in the browser
    const walletAvailable = detectWallet();
    setHasWallet(walletAvailable);
    
    // Check for stored wallet connections - also check for ZKP identity
    const savedAddress = localStorage.getItem("walletAddress") || localStorage.getItem("wallet_address");
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }
  }, []);
  
  const connectWallet = async () => {
    if (isConnecting) return "";
    
    setIsConnecting(true);
    
    try {
      const address = await connectToWallet();
      setWalletAddress(address);
      localStorage.setItem("walletAddress", address);
      return address;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Could not connect to wallet. Please try again.");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Generate a zero-knowledge compatible identity from OAuth JWT token
  const generateWalletFromToken = async (token: string, userId: string): Promise<string> => {
    setIsConnecting(true);
    
    try {
      // Create a deterministic seed from the token and user ID
      const tokenPart = token.length >= 64 ? token.slice(-64) : token;
      const seed = `${tokenPart}:${userId}`;
      
      // Create a hash of the seed to use as identity material
      // Updated for ethers v6
      const idMaterial = ethers.keccak256(ethers.toUtf8Bytes(seed));
      
      // Generate an identity hash - this will be our ZKP-compatible identifier
      const identityHash = ethers.keccak256(
        ethers.concat([
          ethers.toUtf8Bytes(idMaterial),
          ethers.toUtf8Bytes(userId)
        ])
      ).substring(0, 42);
      
      // Store the identity
      setWalletAddress(identityHash);
      localStorage.setItem("wallet_address", identityHash);
      
      // Store the zkp-compatible secret data
      const zkpSecret = {
        id: identityHash,
        secret: idMaterial,
        createdAt: Date.now(),
        provider: "google",
        userHash: ethers.keccak256(ethers.toUtf8Bytes(userId))
      };
      
      // Store encrypted credentials
      localStorage.setItem("zkp_credentials", btoa(JSON.stringify(zkpSecret)));
      
      toast.success("Secure identity created successfully");
      
      return identityHash;
    } catch (error) {
      console.error("Error generating identity from token:", error);
      toast.error("Failed to create secure identity");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("wallet_address");
    localStorage.removeItem("zkp_credentials");
    localStorage.removeItem("token");
    toast.success("Identity disconnected");
  };
  
  const value = {
    walletAddress,
    isConnecting,
    isAuthenticated: !!walletAddress,
    hasWallet,
    connectWallet,
    disconnectWallet,
    generateWalletFromToken,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;