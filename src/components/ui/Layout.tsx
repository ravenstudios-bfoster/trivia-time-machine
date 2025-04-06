import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout = ({ children, className = "" }: LayoutProps) => {
  return (
    <div className={`flex flex-col min-h-screen ${className}`}>
      <Header />
      <main className="flex-1 pt-20">{children}</main>
    </div>
  );
};
