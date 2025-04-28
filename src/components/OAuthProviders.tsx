import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const OAuthProviders = () => {
  const [authenticating, setAuthenticating] = useState<string | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  
  const providers: OAuthProvider[] = [
    {
      id: "google",
      name: "Google",
      icon: "G",
      color: "bg-white text-black",
    }
  ];

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      const token = localStorage.getItem('oauth_token');
      if (token) {
        try {
          const tokenData = JSON.parse(token);
          if (tokenData.provider && tokenData.expiresAt > Date.now()) {
            setConnectedProviders([tokenData.provider]);
          } else {
            localStorage.removeItem('oauth_token');
          }
        } catch (e) {
          localStorage.removeItem('oauth_token');
        }
      }
    };
    
    checkExistingSession();
  }, []);

  // Notify the dashboard when connection status changes
  useEffect(() => {
    const isConnected = connectedProviders.length > 0;
    const event = new CustomEvent("oauth-status-change", { 
      detail: { connected: isConnected } 
    });
    window.dispatchEvent(event);
  }, [connectedProviders]);

  useEffect(() => {
    // Handle messages from popup window
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      // Handle successful OAuth
      if (event.data?.type === "OAUTH_SUCCESS" && event.data?.provider) {
        setAuthenticating(null);
        setConnectedProviders(prev => [...prev, event.data.provider]);
        toast.success(`Connected to ${event.data.provider} successfully`);
      }
    };
  
    // Add event listener
    window.addEventListener('message', handleMessage);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleGoogleLogin = () => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      toast.error("Google Client ID is missing");
      return;
    }
  
    // Generate a random nonce for security
    const nonce = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_nonce', nonce);
    
    // Save current URL for redirect back after authentication
    localStorage.setItem('oauth_redirect', window.location.href);
  
    // Configure OAuth parameters - using just openid scope
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: `${window.location.origin}/oauth-callback`,
      response_type: 'token id_token',
      scope: 'openid', // Using only openid scope as requested
      nonce: nonce,
      prompt: 'consent',
    });
  
    // Open Google's OAuth endpoint in a new tab
    window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, '_blank');
    
    // Inform user about the new tab
    toast.info("Login window opened in a new tab. Please complete authentication there.");
  };
  
  const handleConnect = async (providerId: string) => {
    if (connectedProviders.includes(providerId)) {
      // Disconnect logic
      setAuthenticating(providerId);
      
      setTimeout(() => {
        localStorage.removeItem('oauth_token');
        setConnectedProviders(prev => prev.filter(id => id !== providerId));
        setAuthenticating(null);
        toast.success(`Disconnected from ${providerId} successfully`);
      }, 500);
      
      return;
    }
    
    // Connect logic
    setAuthenticating(providerId);
    
    if (providerId === 'google') {
      handleGoogleLogin();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5" /> OAuth Provider
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        Connect with Google for secure authentication using OpenID.
      </p>
      
      <div className="flex justify-center">
        {providers.map((provider) => {
          const isConnected = connectedProviders.includes(provider.id);
          const isAuthenticating = authenticating === provider.id;
          
          return (
            <Button
              key={provider.id}
              variant={isConnected ? "default" : "outline"}
              className={`justify-start gap-3 w-full max-w-sm ${isConnected ? "bg-muted hover:bg-muted/80" : ""}`}
              onClick={() => handleConnect(provider.id)}
              disabled={isAuthenticating}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${provider.color}`}>
                {provider.icon}
              </span>
              <span className="flex-1 text-left">
                {provider.name}
              </span>
              <span className="text-xs opacity-70">
                {isAuthenticating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isConnected ? (
                  "Connected"
                ) : (
                  <ExternalLink className="h-3 w-3" />
                )}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default OAuthProviders;