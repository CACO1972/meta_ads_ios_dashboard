import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatMetricProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtext?: string;
  highlight?: boolean;
}

export default function StatMetric({ 
  label, 
  value, 
  change, 
  trend = "neutral", 
  subtext,
  highlight = false
}: StatMetricProps) {
  
  const trendColor = {
    up: "text-primary",
    down: "text-destructive",
    neutral: "text-muted-foreground"
  };

  const TrendIcon = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    neutral: Minus
  };

  const Icon = TrendIcon[trend];

  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-orbitron">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-2xl md:text-3xl font-bold font-mono tracking-tighter",
          highlight ? "text-primary drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" : "text-foreground"
        )}>
          {value}
        </span>
        {change && (
          <div className={cn("flex items-center text-xs font-bold", trendColor[trend])}>
            <Icon className="w-3 h-3 mr-0.5" />
            {change}
          </div>
        )}
      </div>
      {subtext && (
        <span className="text-[10px] text-muted-foreground mt-1 font-mono opacity-70">
          {subtext}
        </span>
      )}
    </div>
  );
}
