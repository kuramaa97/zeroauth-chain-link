import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { verifyZKProof } from "@/utils/zkUtils";
import { toast } from "sonner";

const ZKProofDemo = () => {
  const { walletAddress } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  
  // Notify the dashboard when the proof verification status changes
  useEffect(() => {
    const event = new CustomEvent("zkproof-status-change", {
      detail: { verified: verificationResult === true }
    });
    window.dispatchEvent(event);
  }, [verificationResult]);
  
  const handleProofVerification = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const result = await verifyZKProof(walletAddress, "identity");
      setVerificationResult(result);
      
      if (result) {
        toast.success(`Zero-knowledge identity proof verified successfully`);
      } else {
        toast.error(`Failed to verify zero-knowledge identity proof`);
      }
    } catch (error) {
      console.error("ZK verification error:", error);
      toast.error("An error occurred during verification");
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const resetVerification = () => {
    setVerificationResult(null);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" /> Zero-Knowledge Verification
      </h3>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Verify your identity without exposing personal identification documents.
        </p>
        
        {renderVerificationUI()}
      </div>
    </div>
  );
  
  function renderVerificationUI() {
    if (verificationResult === true) {
      return (
        <div className="bg-green-950/30 border border-green-600/30 rounded-md p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium">Verification Successful</p>
            <p className="text-sm text-muted-foreground">
              Zero-knowledge proof validated without revealing your data
            </p>
          </div>
        </div>
      );
    } else if (verificationResult === false) {
      return (
        <div className="bg-red-950/30 border border-red-600/30 rounded-md p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium">Verification Failed</p>
            <p className="text-sm text-muted-foreground">
              Unable to verify the zero-knowledge proof
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex justify-center">
        <Button 
          onClick={handleProofVerification} 
          disabled={!walletAddress || isVerifying}
          className="min-w-[200px]"
        >
          {isVerifying ? "Verifying..." : "Generate & Verify Proof"}
        </Button>
      </div>
    );
  }
};

export default ZKProofDemo;