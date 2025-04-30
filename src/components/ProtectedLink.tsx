import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";

interface ProtectedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ProtectedLink = ({ to, children, className, onClick }: ProtectedLinkProps) => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      setIsLoginDialogOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      setIsLoginDialogOpen(false);
      navigate(to);
      toast.success("Welcome back!");
    } catch (error) {
      if (error instanceof FirebaseError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to sign in");
      }
    }
  };

  return (
    <>
      <Link to={to} onClick={handleClick} className={className}>
        {children}
      </Link>

      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>Please sign in to access this feature.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter your email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter your password" required />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProtectedLink;
