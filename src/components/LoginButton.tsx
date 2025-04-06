import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LoginButton = () => {
  const { currentUser, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.displayName);
      setIsOpen(false);
      toast.success("Welcome to the Costume Gallery!");
    } catch (error) {
      toast.error("Failed to log in");
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
      <Button onClick={() => setIsOpen(true)}>Login to Vote & Submit</Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login to Participate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Your Name</Label>
              <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Enter your name" required />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Continue"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginButton;
