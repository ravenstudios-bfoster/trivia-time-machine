import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Gamepad2, HelpCircle, Users, LogOut, ChevronRight, ShieldAlert, Database } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href: string }[];
}

const AdminLayout = ({ children, title, subtitle, breadcrumbs = [] }: AdminLayoutProps) => {
  const { currentUser, isAdmin, isSuperAdmin, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/admin/login");
    }
  }, [currentUser, isLoading, navigate]);

  // Redirect to login if not admin
  useEffect(() => {
    if (!isLoading && currentUser && !isAdmin) {
      navigate("/admin/login");
    }
  }, [currentUser, isAdmin, isLoading, navigate]);

  // Redirect to dashboard if trying to access Users page without super admin privileges
  useEffect(() => {
    if (!isLoading && currentUser && isAdmin && !isSuperAdmin && location.pathname === "/admin/users") {
      navigate("/admin/dashboard");
    }
  }, [currentUser, isAdmin, isSuperAdmin, isLoading, location.pathname, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { label: "Games", href: "/admin/games", icon: <Gamepad2 className="h-4 w-4 mr-2" /> },
    { label: "Questions", href: "/admin/questions", icon: <HelpCircle className="h-4 w-4 mr-2" /> },
  ];

  // Add Users link for super admins only
  if (isSuperAdmin) {
    navItems.push({
      label: "Admin Users",
      href: "/admin/users",
      icon: <ShieldAlert className="h-4 w-4 mr-2" />,
    });

    // Add Seed Database link for super admins only
    navItems.push({
      label: "Seed Database",
      href: "/admin/seed",
      icon: <Database className="h-4 w-4 mr-2" />,
    });
  }

  if (isLoading || !currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-gradient-to-r from-background to-muted">
        <div className="container py-4 flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-bttf-yellow to-bttf-orange rounded-full animate-flux-capacitor" />
              <div className="absolute inset-2 bg-background rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-5 bg-bttf-blue animate-pulse" />
                <div className="w-5 h-1 bg-bttf-blue animate-pulse absolute" />
                <div className="w-3 h-3 border-2 border-bttf-blue rounded-full absolute animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-bttf-yellow to-bttf-orange">Trivia Admin</h1>
              <p className="text-sm text-muted-foreground">Back to the Future Edition</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {currentUser.email}
              {isSuperAdmin && <span className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-bttf-yellow to-bttf-orange text-background font-medium rounded-full">Super Admin</span>}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border p-4 hidden md:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  location.pathname === item.href || location.pathname.startsWith(`${item.href}/`) ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Link to="/admin/dashboard" className="hover:text-foreground">
                Admin
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  <ChevronRight className="h-4 w-4 mx-1" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-foreground">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.href} className="hover:text-foreground">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>

          <Separator className="mb-6" />

          {/* Page content */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
