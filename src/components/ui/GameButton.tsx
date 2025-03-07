
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const GameButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  fullWidth = false,
  icon
}: GameButtonProps) => {
  const baseClasses = "relative overflow-hidden transition-all font-['Orbitron'] tracking-wider uppercase";
  
  const variantClasses = {
    primary: "glow-button text-black hover:animate-glow-pulse",
    secondary: "bg-bttf-blue text-white shadow-[0_0_15px_rgba(0,163,255,0.7)] hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(0,163,255,0.9)]",
    accent: "bg-bttf-pink text-white shadow-[0_0_15px_rgba(255,0,255,0.7)] hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(255,0,255,0.9)]",
    muted: "bg-muted text-muted-foreground hover:bg-opacity-90"
  };
  
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-6 py-3",
    lg: "text-lg px-8 py-4"
  };
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-chrome-gradient animate-chrome-shine" />
      )}
    </Button>
  );
};

export default GameButton;
