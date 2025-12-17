import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CyberCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "alert" | "success";
  glitchEffect?: boolean;
}

export default function CyberCard({ 
  title, 
  children, 
  className, 
  variant = "default",
  glitchEffect = false
}: CyberCardProps) {
  
  const borderColor = {
    default: "border-border",
    alert: "border-destructive",
    success: "border-primary"
  };

  const titleColor = {
    default: "text-muted-foreground",
    alert: "text-destructive",
    success: "text-primary"
  };

  return (
    <div className={cn(
      "relative bg-card border border-border p-1 overflow-hidden group",
      borderColor[variant],
      className
    )}>
      {/* Corner Accents */}
      <div className={cn("absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2", 
        variant === 'alert' ? 'border-destructive' : 'border-primary'
      )}></div>
      <div className={cn("absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2", 
        variant === 'alert' ? 'border-destructive' : 'border-primary'
      )}></div>
      <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2", 
        variant === 'alert' ? 'border-destructive' : 'border-primary'
      )}></div>
      <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2", 
        variant === 'alert' ? 'border-destructive' : 'border-primary'
      )}></div>

      {/* Content Container */}
      <div className="bg-background/50 h-full p-4 md:p-6 backdrop-blur-sm relative z-10">
        {title && (
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
            <h3 className={cn(
              "font-orbitron text-sm tracking-widest uppercase font-bold",
              titleColor[variant],
              glitchEffect && "animate-pulse"
            )}>
              {title}
            </h3>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
            </div>
          </div>
        )}
        <div className="font-mono text-sm">
          {children}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none",
        variant === 'alert' ? 'bg-destructive' : 'bg-primary'
      )}></div>
    </div>
  );
}
