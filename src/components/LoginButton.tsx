import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LoginButton = () => {
  const { currentUser, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      setIsOpen(false);
      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error("Invalid email or password");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Welcome, {currentUser.displayName}!</span>
        <Button variant="outline" onClick={() => logout()}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Sign In</Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>Enter your credentials to access the trivia game.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter your email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter your password" required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginButton;
