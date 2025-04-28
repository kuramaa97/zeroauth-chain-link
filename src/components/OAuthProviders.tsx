
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link2, ExternalLink } from "lucide-react";
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

  // Notify the dashboard when connection status changes
  useEffect(() => {
    const isConnected = connectedProviders.length > 0;
    const event = new CustomEvent("oauth-status-change", { 
      detail: { connected: isConnected } 
    });
    window.dispatchEvent(event);
  }, [connectedProviders]);
  
  const handleConnect = async (providerId: string) => {
    if (connectedProviders.includes(providerId)) {
      // Disconnect logic
      setAuthenticating(providerId);
      
      // Simulate network request
      setTimeout(() => {
        setConnectedProviders(prev => prev.filter(id => id !== providerId));
        setAuthenticating(null);
        toast.success(`Disconnected from ${providerId} successfully`);
      }, 1500);
      
      return;
    }
    
    // Connect logic
    setAuthenticating(providerId);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setConnectedProviders(prev => [...prev, providerId]);
      setAuthenticating(null);
      toast.success(`Connected to ${providerId} successfully`);
    }, 1500);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5" /> OAuth Provider
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        Connect with Google for seamless authentication.
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
                  "Processing..."
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
