import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, CheckCircle, Shield, ArrowRight, CreditCard, RefreshCw, Send, Loader2 } from "lucide-react";
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
          setIsProofValid(now < proof.expiresAt);
        } catch (e) {
          setIsProofValid(false);
        }
      } else {
        setIsProofValid(false);
      }
    };
    
    loadUserInfo();
    loadBalance();
    checkProof();
    
    // Check proof validity every minute
    const proofInterval = setInterval(checkProof, 60000);
    return () => clearInterval(proofInterval);
  }, []);

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
      const proof = await generateZKProof(walletAddress, "identity");
      const result = await verifyZKProof(walletAddress, "identity");
      
      if (result) {
        setIsProofValid(true);
        // Store proof with expiration (24 hours)
        const proofData = {
          ...proof,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
        localStorage.setItem('zk_proof', JSON.stringify(proofData));
        toast.success("New zero-knowledge proof generated successfully");
      } else {
        setIsProofValid(false);
        toast.error("Failed to verify zero-knowledge proof");
      }
    } catch (error) {
      console.error("Error generating proof:", error);
      toast.error("Failed to generate proof");
      setIsProofValid(false);
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