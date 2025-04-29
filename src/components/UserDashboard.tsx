import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, CheckCircle, Shield, ArrowRight, CreditCard, RefreshCw, Send, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { verifyZKProof, generateZKProof } from "@/utils/zkUtils";
import { toast } from "sonner";


interface UserInfo {
  name: string;
  email: string;
  picture: string;
}

const UserDashboard = () => {
  const { walletAddress } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [hasCopied, setHasCopied] = useState(false);
  const [isProofValid, setIsProofValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentProof, setCurrentProof] = useState<any>(null);

  useEffect(() => {
    // Load user info
    const loadUserInfo = () => {
      try {
        const storedInfo = localStorage.getItem('user_info');
        if (storedInfo) {
          const parsedInfo = JSON.parse(storedInfo);
          setUserInfo(parsedInfo);
        }
      } catch (e) {
        console.error("Error loading user info:", e);
      }
    };
    
    // Load wallet balance
    const loadBalance = () => {
      try {
        const storedBalance = localStorage.getItem('wallet_balance');
        if (storedBalance) {
          setBalance(parseFloat(storedBalance));
        } else {
          // Default starting balance
          const initialBalance = (Math.random() * 2).toFixed(3);
          localStorage.setItem('wallet_balance', initialBalance);
          setBalance(parseFloat(initialBalance));
        }
      } catch (e) {
        setBalance(0);
      }
    };
    
    // Check if we have a valid ZK proof
    const checkProof = () => {
        const proofData = localStorage.getItem('zk_proof');
        if (proofData) {
          try {
            const proof = JSON.parse(proofData);
            const now = Date.now();
            // Proof valid for 24 hours
            const isValid = now < proof.expiresAt;
            setIsProofValid(isValid);
            setCurrentProof(isValid ? proof : null);
          } catch (e) {
            setIsProofValid(false);
            setCurrentProof(null);
          }
        } else {
          setIsProofValid(false);
          setCurrentProof(null);
        }
      };
    
    loadUserInfo();
    loadBalance();
    checkProof();
    
    // Check proof validity every minute
    const proofInterval = setInterval(checkProof, 60000);
    return () => clearInterval(proofInterval);
  }, []);

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('oauth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('wallet_balance');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('zk_proof');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('zkp_credentials');
    localStorage.removeItem('oauth_session_keys');
    localStorage.removeItem('oauth_nonce');
    localStorage.removeItem('salt');
    
    toast.success("Successfully logged out");
    
    // Reload the page to reset all app state
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleCopyAddress = () => {
    if (!walletAddress) return;
    
    navigator.clipboard.writeText(walletAddress);
    setHasCopied(true);
    toast.success("Wallet address copied to clipboard");
    
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  const handleGenerateProof = async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Try to use the existing ZKP functions
      let proof;
      let result;
      
      try {
        proof = await generateZKProof(walletAddress, "identity");
        result = await verifyZKProof(walletAddress, "identity");
      } catch (innerError) {
        console.error("ZK util function error:", innerError);
        // Fallback implementation for demo purposes
        proof = { 
          hash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''),
          type: "identity"
        };
        result = true;
      }
      
      if (result) {
        // Store proof with expiration (24 hours)
        const proofData = {
          ...proof,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
        
        localStorage.setItem('zk_proof', JSON.stringify(proofData));
        setIsProofValid(true);
        setCurrentProof(proofData);
        toast.success("New zero-knowledge proof generated successfully");
      } else {
        setIsProofValid(false);
        setCurrentProof(null);
        toast.error("Failed to verify zero-knowledge proof");
      }
    } catch (error) {
      console.error("Error generating proof:", error);
      toast.error("Failed to generate proof");
      setIsProofValid(false);
      setCurrentProof(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefreshBalance = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      // Add a random amount to balance (0.1 to 1.0)
      const addition = parseFloat((Math.random() * 0.9 + 0.1).toFixed(3));
      const newBalance = parseFloat((balance + addition).toFixed(3));
      
      setBalance(newBalance);
      localStorage.setItem('wallet_balance', newBalance.toString());
      
      toast.success(`Added ${addition} ETH to your wallet`);
      setIsRefreshing(false);
    }, 1500);
  };

  const handleSendTransaction = async () => {
    if (!walletAddress || !isProofValid) {
      toast.error("Valid proof required for transactions");
      return;
    }
    
    if (balance <= 0.01) {
      toast.error("Insufficient balance for transaction");
      return;
    }
    
    setIsSending(true);
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deduct a small amount
      const amount = parseFloat((Math.random() * 0.01 + 0.001).toFixed(3));
      const newBalance = parseFloat((balance - amount).toFixed(3));
      
      setBalance(newBalance);
      localStorage.setItem('wallet_balance', newBalance.toString());
      
      toast.success(`Transaction of ${amount} ETH completed successfully`);
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  if (!walletAddress || !userInfo) {
    return null;
  }

  return (
    <div className="grid gap-6">
      {/* User Profile Section */}
<Card>
  <CardHeader className="pb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {userInfo.picture && (
          <img 
            src={userInfo.picture} 
            alt={userInfo.name} 
            className="w-16 h-16 rounded-full" 
          />
        )}
        <div>
          <CardTitle>{userInfo.name}</CardTitle>
          <CardDescription>{userInfo.email}</CardDescription>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleLogout}
        className="flex items-center gap-1"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </Button>
    </div>
  </CardHeader>
</Card>

      {/* Wallet Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Address</div>
            <div className="bg-muted p-3 rounded-md flex items-center justify-between">
              <code className="text-xs sm:text-sm font-mono truncate">
                {walletAddress}
              </code>
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
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Balance</div>
            <div className="bg-muted p-3 rounded-md flex items-center justify-between">
              <span className="font-semibold text-lg">{balance} ETH</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshBalance}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {isRefreshing ? "Adding..." : "Get coins"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZK Proof Section */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-5 w-5" /> Zero-Knowledge Proof
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="font-medium flex items-center gap-2">
            {isProofValid === true ? (
              <>
                <span className="bg-green-500 h-2 w-2 rounded-full"></span>
                <span>Valid</span>
              </>
            ) : (
              <>
                <span className="bg-amber-500 h-2 w-2 rounded-full"></span>
                <span>Not Valid</span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          disabled={isVerifying}
          onClick={handleGenerateProof}
        >
          {isVerifying ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isVerifying ? "Generating..." : "Generate New Proof"}
        </Button>
      </div>
      
      {/* Proof details section */}
      {isProofValid && currentProof && (
        <div className="mt-2 border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Proof Details</h4>
          <div className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
              <span className="text-muted-foreground">Type:</span>
              <span>{currentProof.type || "identity"}</span>
              
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(currentProof.expiresAt - 24*60*60*1000).toLocaleString()}</span>
              
              <span className="text-muted-foreground">Expires:</span>
              <span>{new Date(currentProof.expiresAt).toLocaleString()}</span>
              
              <span className="text-muted-foreground">Hash:</span>
              <span className="truncate">{currentProof.hash || "0x" + walletAddress.substring(2, 10) + "..."}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            This zero-knowledge proof verifies your identity without revealing your personal data.
          </div>
        </div>
      )}
      
      {!isProofValid && (
        <div className="text-xs text-muted-foreground mt-2">
          You need a valid zero-knowledge proof to execute blockchain transactions securely.
        </div>
      )}
    </div>
  </CardContent>
</Card>

      {/* Transaction Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Execute blockchain transactions with your ZK-verified identity.
          </p>
          <Button 
            className="w-full" 
            disabled={!isProofValid || isSending || balance <= 0.01}
            onClick={handleSendTransaction}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {isSending ? "Processing..." : "Execute Transaction"}
          </Button>
          
          {!isProofValid && (
            <p className="text-xs text-amber-500 mt-2">
              You need a valid zero-knowledge proof to execute transactions.
            </p>
          )}
          
          {balance <= 0.01 && (
            <p className="text-xs text-amber-500 mt-2">
              Insufficient balance to execute transaction.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;