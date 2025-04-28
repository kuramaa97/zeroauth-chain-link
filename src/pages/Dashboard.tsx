import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import UserDashboard from "@/components/UserDashboard";
import OAuthProviders from "@/components/OAuthProviders";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const { walletAddress, isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [googleLoggedIn, setGoogleLoggedIn] = useState(false);

  // Check for Google login independently
  useEffect(() => {
    const checkGoogleLogin = () => {
      try {
        const token = localStorage.getItem('oauth_token');
        if (token) {
          const tokenData = JSON.parse(token);
          if (tokenData.provider === "google" && tokenData.expiresAt > Date.now()) {
            setGoogleLoggedIn(true);
          }
        }
      } catch (e) {
        console.error("Error checking Google login:", e);
      }
    };

    checkGoogleLogin();
    
    // Listen for OAuth status changes
    const handleOAuthChange = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.connected === 'boolean') {
        setGoogleLoggedIn(event.detail.connected);
      }
    };

    window.addEventListener("oauth-status-change", handleOAuthChange as EventListener);
    return () => window.removeEventListener("oauth-status-change", handleOAuthChange as EventListener);
  }, []);

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

  // Debugging information - you can remove this after fixing the issue
  const debugAuth = {
    isAuthenticated: isAuthenticated,
    walletAddress: walletAddress,
    googleLoggedIn: googleLoggedIn,
    hasOAuthToken: !!localStorage.getItem('oauth_token'),
    hasUserInfo: !!localStorage.getItem('user_info')
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Account Dashboard</h1>
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
          </div>

          {/* Debug information - remove after fixing */}
          <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
            <pre>{JSON.stringify(debugAuth, null, 2)}</pre>
          </div>

          <div className="space-y-6">
            {/* Show UserDashboard if either authentication method is active */}
            {(!isAuthenticated && !googleLoggedIn) ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to ZeroAuth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Sign in with Google to access your secure wallet and blockchain features.
                    </p>
                  </CardContent>
                </Card>
                
                <OAuthProviders />
              </>
            ) : (
              <UserDashboard />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;