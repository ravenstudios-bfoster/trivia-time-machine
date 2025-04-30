import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";

const UserMenu = () => {
  const { currentUser, login, logout } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      setIsLoginDialogOpen(false);
      toast.success("Welcome back!");
    } catch (error) {
      const errorMessage = error instanceof FirebaseError ? error.message : "Failed to sign in";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (!currentUser) {
    return (
      <>
        <Button variant="outline" onClick={() => setIsLoginDialogOpen(true)}>
          Sign In
        </Button>

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
  }

  const initials =
    currentUser.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
