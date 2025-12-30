import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, ShieldAlert, Target, Activity, Settings, Menu, X, Brain } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CyberpunkLayoutProps {
  children: ReactNode;
}

export default function CyberpunkLayout({ children }: CyberpunkLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "DASHBOARD", icon: BarChart3 },
    { href: "/ai-central", label: "AI CENTRAL", icon: Brain },
    { href: "/ios-audit", label: "iOS AUDIT", icon: ShieldAlert },
    { href: "/campaigns", label: "CAMPAIGNS", icon: Target },
    { href: "/performance", label: "PERFORMANCE", icon: Activity },
    { href: "/settings", label: "SYSTEM", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" 
           style={{ 
             backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Scanline Effect */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('/images/scanlines.png')] bg-repeat"></div>

      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar Navigation */}
        <aside className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center">
                  <span className="text-primary font-orbitron font-bold text-xl">M</span>
                </div>
                <span className="font-orbitron font-bold text-lg tracking-wider text-primary">META<span className="text-foreground">AUDIT</span></span>
              </div>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wide transition-all duration-200 border-l-2",
                      isActive 
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(0,255,255,0.2)]" 
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-muted-foreground"
                    )}>
                      <item.icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground font-mono">
                <div className="flex justify-between mb-1">
                  <span>SYSTEM STATUS:</span>
                  <span className="text-primary animate-pulse">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span>VERSION:</span>
                  <span>2.5.0</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="font-orbitron font-bold text-lg tracking-wider text-primary">META<span className="text-foreground">AUDIT</span></span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
