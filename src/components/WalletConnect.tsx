// Update component name to IdentityConnect
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const WalletConnect = () => {
  const { connectWallet, disconnectWallet, walletAddress, isConnecting, generateWalletFromToken } = useAuth();
  const [hasCopied, setHasCopied] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Identity connected successfully");
    } catch (error) {
      toast.error("Failed to connect identity. Please try again.");
      console.error("Identity connection error:", error);
    }
  };

  const handleDemoMode = async () => {
    try {
      // Generate a demo token with fixed values
      const demoToken = "demo_jwt_token_for_testing_purposes_only";
      const demoUserId = "demo_user_123";
      
      await generateWalletFromToken(demoToken, demoUserId);
      toast.success("Demo identity created successfully");
    } catch (error) {
      toast.error("Failed to create demo identity. Please try again.");
      console.error("Demo identity creation error:", error);
    }
  };

  const handleCopyAddress = () => {
    if (!walletAddress) return;
    
    navigator.clipboard.writeText(walletAddress);
    setHasCopied(true);
    toast.success("Identity ID copied to clipboard");
    
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" /> Zero-Knowledge Identity
      </h3>
      
      {walletAddress ? (
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md flex items-center justify-between">
            <span className="text-sm font-mono truncate">
              {walletAddress}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCopyAddress} 
              className="text-muted-foreground hover:text-primary"
            >
              {hasCopied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={disconnectWallet}
            >
              Disconnect Identity
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Create a secure zero-knowledge identity for blockchain authentication.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="w-full"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Creating..." : "Create Identity"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDemoMode}
              disabled={isConnecting}
            >
              Demo Mode
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;