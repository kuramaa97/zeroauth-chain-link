import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import the auth context

const OAuthCallback = () => {
  const [status, setStatus] = useState("Processing authentication response...");
  const navigate = useNavigate();
  const { generateWalletFromToken } = useAuth(); // Get the function from auth context

  useEffect(() => {
    const processOAuthResponse = async () => {
      try {
        // Extract hash fragment (Google OAuth returns tokens in URL hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Get the ID token and validate it
        const idToken = hashParams.get("id_token");
        const accessToken = hashParams.get("access_token");
        
        if (!idToken) {
          setStatus("Error: No ID token received");
          toast.error("Authentication failed: No ID token received");
          return;
        }

        // Verify the nonce (to prevent CSRF attacks)
        const savedNonce = localStorage.getItem("oauth_nonce");
        if (!savedNonce) {
          setStatus("Error: Authentication session expired");
          toast.error("Authentication failed: Session expired");
          return;
        }
        
        // Decode the JWT to verify nonce and extract user info
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        if (payload.nonce !== savedNonce) {
          setStatus("Error: Invalid authentication response");
          toast.error("Authentication failed: Security verification failed");
          return;
        }

        // Store the token data
        const tokenData = {
          idToken,
          accessToken,
          provider: "google",
          expiresAt: Date.now() + (payload.exp - payload.iat) * 1000,
          sub: payload.sub,
          email: payload.email,
        };
        
        localStorage.setItem("oauth_token", JSON.stringify(tokenData));

        // Clean up nonce
        localStorage.removeItem("oauth_nonce");
        
        // Generate a wallet using the JWT token
        setStatus("Generating wallet from authentication data...");
        await generateWalletFromToken(idToken, payload.sub);
        
        // If this window was opened by another window (opener exists)
        if (window.opener && !window.opener.closed) {
          // Send message to opener window
          window.opener.postMessage({ 
            type: "OAUTH_SUCCESS", 
            provider: "google" 
          }, window.location.origin);
          
          setStatus("Authentication successful! Closing window...");
          
          // Close this tab after a brief delay
          setTimeout(() => window.close(), 1500);
        } else {
          // If no opener (user opened directly), redirect to stored URL
          const redirectUrl = localStorage.getItem("oauth_redirect") || "/dashboard";
          localStorage.removeItem("oauth_redirect");
          
          setStatus("Authentication successful! Redirecting...");
          setTimeout(() => navigate(redirectUrl), 1500);
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("Authentication failed. Please try again.");
        toast.error("Authentication error: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    };

    processOAuthResponse();
  }, [navigate, generateWalletFromToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-card border border-border rounded-lg p-8 w-full max-w-md flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-semibold text-center">{status}</h2>
      </div>
    </div>
  );
};

export default OAuthCallback;