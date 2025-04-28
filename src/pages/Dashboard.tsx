
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import WalletConnect from "@/components/WalletConnect";
import ZKProofDemo from "@/components/ZKProofDemo";
import OAuthProviders from "@/components/OAuthProviders";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const { walletAddress, isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Authentication Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your blockchain authentication settings
              </p>
            </div>
            
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back Home
              </Link>
            </Button>
          </div>
          
          {!isAuthenticated && (
            <Card className="bg-amber-950/20 border-amber-600/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Not authenticated</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to access authentication features
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1">
              <WalletConnect />
            </div>
            
            <div className="col-span-1">
              <ZKProofDemo />
            </div>
            
            <div className="col-span-1">
              <OAuthProviders />
            </div>
          </div>
          
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>
                Your current authentication and verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Wallet Status
                    </div>
                    <div className="font-semibold">
                      {walletAddress ? (
                        <span className="text-green-500">Connected</span>
                      ) : (
                        <span className="text-amber-500">Not Connected</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      ZK Proofs
                    </div>
                    <div className="font-semibold">
                      <span className="text-amber-500">Not Verified</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      OAuth Status
                    </div>
                    <div className="font-semibold">
                      <span className="text-amber-500">Not Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
