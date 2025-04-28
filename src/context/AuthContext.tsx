
import React, { createContext, useState, useContext, useEffect } from "react";
import { connectToWallet, detectWallet } from "@/utils/walletUtils";
import { toast } from "sonner";

interface AuthContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  hasWallet: boolean;
  connectWallet: () => Promise<string>; // Updated to match implementation
  disconnectWallet: () => void;
}

const AuthContext = createContext<AuthContextType>({
  walletAddress: null,
  isConnecting: false,
  isAuthenticated: false,
  hasWallet: false,
  connectWallet: async () => "", // Updated to return a string
  disconnectWallet: () => {},
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
    
    // Check for stored wallet connections
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }
  }, []);
  
  const connectWallet = async () => {
    if (isConnecting) return;
    
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
  
  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem("walletAddress");
    toast.success("Wallet disconnected");
  };
  
  const value = {
    walletAddress,
    isConnecting,
    isAuthenticated: !!walletAddress,
    hasWallet,
    connectWallet,
    disconnectWallet,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
