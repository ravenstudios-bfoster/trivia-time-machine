import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  transparentHeader?: boolean;
}

const Layout = ({ children, showHeader = true, showFooter = true, transparentHeader = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <header className={`py-4 ${!transparentHeader ? "border-b border-muted" : ""}`}>
          <div className="container flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-bttf-yellow to-bttf-orange rounded-full animate-flux-capacitor" />
                <div className="absolute inset-2 bg-background rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-6 bg-bttf-blue animate-pulse" />
                  <div className="w-6 h-1 bg-bttf-blue animate-pulse absolute" />
                  <div className="w-4 h-4 border-2 border-bttf-blue rounded-full absolute animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold chrome-text group-hover:scale-105 transition-transform">Trivia Time Machine</h1>
                <p className="text-xs text-muted-foreground">Tom's 50th Birthday Edition</p>
              </div>
            </Link>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {showFooter && (
        <footer className="py-4 border-t border-muted">
          <div className="container text-center text-sm text-muted-foreground">
            <p>© 2025 BTTF Trivia - Created for Tom's 50th Birthday</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
