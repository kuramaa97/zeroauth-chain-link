
import { useState } from "react";
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
    },
    {
      id: "github",
      name: "GitHub",
      icon: "GH",
      color: "bg-gray-800 text-white",
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: "X",
      color: "bg-black text-white",
    },
    {
      id: "discord",
      name: "Discord",
      icon: "D",
      color: "bg-indigo-600 text-white",
    }
  ];
  
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
        <Link2 className="h-5 w-5" /> OAuth Providers
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        Connect your existing OAuth providers for seamless authentication.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => {
          const isConnected = connectedProviders.includes(provider.id);
          const isAuthenticating = authenticating === provider.id;
          
          return (
            <Button
              key={provider.id}
              variant={isConnected ? "default" : "outline"}
              className={`justify-start gap-3 ${isConnected ? "bg-muted hover:bg-muted/80" : ""}`}
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
