import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Twitter } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleTwitterLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Twitter auth error:', error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Twitter auth error:', error);
      toast({
        title: "Authentication Error", 
        description: "Failed to authenticate with Twitter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to TLBS Dashboard</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleTwitterLogin}
            disabled={loading}
            className="w-full h-12 text-base font-medium"
            variant="outline"
          >
            <Twitter className="mr-2 h-5 w-5" />
            {loading ? "Connecting..." : "Continue with Twitter"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;