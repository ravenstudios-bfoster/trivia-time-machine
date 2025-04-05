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
