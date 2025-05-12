import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Gamepad2, HelpCircle, Users, LogOut, ChevronRight, ShieldAlert, Database, Trophy, MessageSquare, Film, Shirt, Tags, Menu } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { label: "Questions", href: "/admin/questions", icon: <HelpCircle className="h-4 w-4 mr-2" /> },
    { label: "Games", href: "/admin/games", icon: <Gamepad2 className="h-4 w-4 mr-2" /> },
    { label: "Leaderboard", href: "/admin/leaderboard", icon: <Trophy className="h-4 w-4 mr-2" /> },
    ...(isSuperAdmin
      ? [
          { label: "Video Guestbook", href: "/admin/video-guestbook", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
          { label: "Props", href: "/admin/props", icon: <Film className="h-4 w-4 mr-2" /> },
          { label: "Costume Categories", href: "/admin/costume-categories", icon: <Tags className="h-4 w-4 mr-2" /> },
        ]
      : []),
    { label: "Costumes", href: "/admin/costumes", icon: <Shirt className="h-4 w-4 mr-2" /> },
    { label: "Users", href: "/admin/users", icon: <ShieldAlert className="h-4 w-4 mr-2" /> },
  ];

  const renderNavItems = () => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
            location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
              ? "bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white font-medium"
              : "text-[#666] hover:text-white hover:bg-[#222]"
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <header className="border-b border-[#333] bg-[#111] sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 bg-[#111] border-r border-[#333]">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-[#333]">
                    <Link to="/admin/dashboard" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
                      <img src="/images/logo.png" alt="Back to the Future Logo" className="h-8 w-auto" />
                      <p className="text-sm text-[#666]">Admin Panel</p>
                    </Link>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">{renderNavItems()}</div>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/admin/dashboard" className="flex items-center gap-3 group">
              <img src="/images/logo.png" alt="Back to the Future Logo" className="h-8 w-auto" />
              <p className="text-sm text-[#666]">Admin Panel</p>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#666] hidden sm:inline-block">
              {currentUser.email}
              {isSuperAdmin && <span className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-[#111] font-medium rounded-full">Super Admin</span>}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-[#333] text-[#666] hover:text-white hover:border-[#FF3D00]">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-[#333] p-4 hidden md:block bg-[#111] sticky top-[73px] h-[calc(100vh-73px)]">{renderNavItems()}</aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center text-sm text-[#666] mb-4 overflow-x-auto">
              <Link to="/admin/dashboard" className="hover:text-white transition-colors whitespace-nowrap">
                Admin
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center whitespace-nowrap">
                  <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-white">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.href} className="hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-[#666] mt-1">{subtitle}</p>}
          </div>

          <Separator className="mb-6 bg-[#333]" />

          {/* Page content */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
