import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as crypto from 'crypto-js';

interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Helper function to generate a secure session keypair
const generateSessionKeypair = () => {
  // Generate a cryptographically secure random session secret key (32 bytes)
  const sessionSecretKey = crypto.lib.WordArray.random(32).toString();
  
  // Derive a public key from the secret key using SHA-256
  const sessionPublicKey = crypto.SHA256(sessionSecretKey).toString();
  
  return {
    ss_sk: sessionSecretKey,    // Session Secret Key
    ss_pk: sessionPublicKey     // Session Public Key
  };
};

// Create a nonce that embeds the session secret key
const createSecureNonce = (secretKey: string) => {
  // Get current timestamp for freshness
  const timestamp = Date.now().toString();
  
  // Create a base for the nonce using the timestamp and a random value
  const randomPart = crypto.lib.WordArray.random(16).toString();
  
  // Create a hash of the secret key to embed in the nonce
  const secretKeyHash = crypto.SHA256(secretKey).toString().substring(0, 16);
  
  // Combine the elements to form the nonce
  // Format: timestamp_randomPart_secretKeyHash
  const nonce = `${timestamp}_${randomPart}_${secretKeyHash}`;
  
  return nonce;
};

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

    // Generate salt
    const salt = crypto.lib.WordArray.random(16).toString();
    localStorage.setItem('salt', salt);
  
    // Generate a secure session keypair
    const sessionKeys = generateSessionKeypair();
    
    // Create a nonce that embeds the session secret key
    const secureNonce = createSecureNonce(sessionKeys.ss_sk);
    
    // Store the session keys and nonce securely
    localStorage.setItem('oauth_session_keys', JSON.stringify({
      ss_pk: sessionKeys.ss_pk,
      // Store hashed version of secret key for verification
      ss_sk_hash: crypto.SHA256(sessionKeys.ss_sk).toString(),
      created_at: Date.now()
    }));
    
    localStorage.setItem('oauth_nonce', secureNonce);
    
    // Save current URL for redirect back after authentication
    localStorage.setItem('oauth_redirect', window.location.href);
  
    // Configure OAuth parameters - include profile and email for user info
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: `${window.location.origin}/oauth-callback`,
      response_type: 'token id_token',
      scope: 'openid email profile',
      nonce: secureNonce, // Use the secure nonce with embedded session key info
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
        localStorage.removeItem('user_info');
        localStorage.removeItem('oauth_session_keys'); // Remove session keys
        localStorage.removeItem('oauth_nonce'); // Remove nonce
        setConnectedProviders(prev => prev.filter(id => id !== providerId));
        setAuthenticating(null);
        toast.success(`Logged out from ${providerId} successfully`);
        
        // Refresh page to clear all states
        window.location.href = '/';
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
        <Link2 className="h-5 w-5" /> Authentication
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        {connectedProviders.length > 0 
          ? "You are currently authenticated with Google." 
          : "Sign in with Google to access your wallet and blockchain features."}
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
                  "Sign Out"
                ) : (
                  "Sign In"
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