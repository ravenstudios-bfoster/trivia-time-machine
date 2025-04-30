import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import logo from "/images/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, currentUser, isAdmin, isSuperAdmin, userRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    console.log("Auth State:", {
      currentUser: currentUser?.email,
      isAdmin,
      isSuperAdmin,
      userRole,
    });

    if (currentUser && (isAdmin || isSuperAdmin)) {
      console.log("Redirecting to dashboard...");
      navigate("/admin/dashboard");
    }
  }, [currentUser, isAdmin, isSuperAdmin, navigate, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      console.log("Login successful");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <img src={logo} alt="Logo" className="h-12 mx-auto" />
          </CardTitle>
          <CardDescription className="text-center">Admin Login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Only admin users can access this page.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
