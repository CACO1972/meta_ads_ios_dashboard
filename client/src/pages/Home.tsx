import CyberpunkLayout from "@/components/CyberpunkLayout";
import CyberCard from "@/components/CyberCard";
import StatMetric from "@/components/StatMetric";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, TrendingUp, Users, DollarSign, Eye, MousePointerClick, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const performanceData = [
  { name: 'Profile Visits', cpr: 28.23, spend: 1500 },
  { name: 'Messaging', cpr: 736.47, spend: 4500 },
  { name: 'Awareness', cpr: 150.10, spend: 800 },
  { name: 'Leads', cpr: 450.20, spend: 2200 },
];

const trendData = [
  { day: 'Mon', visits: 400, msgs: 24 },
  { day: 'Tue', visits: 300, msgs: 18 },
  { day: 'Wed', visits: 550, msgs: 35 },
  { day: 'Thu', visits: 450, msgs: 28 },
  { day: 'Fri', visits: 600, msgs: 42 },
  { day: 'Sat', visits: 700, msgs: 55 },
  { day: 'Sun', visits: 650, msgs: 48 },
];

export default function Home() {
  return (
    <CyberpunkLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-primary tracking-tight">
            COMMAND CENTER
          </h1>
          <p className="text-muted-foreground font-mono mt-1">
            AUDIT PERIOD: JAN 1 - DEC 3, 2025 | STATUS: <span className="text-destructive animate-pulse">CRITICAL ALERTS DETECTED</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-mono">
            EXPORT REPORT
          </Button>
          <Button variant="destructive" className="font-mono animate-pulse">
            PAUSE ADS (34)
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberCard>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs font-orbitron text-muted-foreground">TOTAL SPEND</span>
          </div>
          <StatMetric 
            label="" 
            value="$13.9M" 
            subtext="CLP (Chilean Peso)" 
            highlight 
          />
        </CyberCard>
        
        <CyberCard>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs font-orbitron text-muted-foreground">ACTIVE ADS</span>
          </div>
          <StatMetric 
            label="" 
            value="6 / 57" 
            change="10.5%" 
            trend="down"
            subtext="Delivery Fragmented" 
          />
        </CyberCard>

        <CyberCard variant="success">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs font-orbitron text-muted-foreground">BEST CPR</span>
          </div>
          <StatMetric 
            label="" 
            value="$28.23" 
            change="-96%" 
            trend="up"
            subtext="Profile Visits Objective" 
            highlight
          />
        </CyberCard>

        <CyberCard variant="alert">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="text-xs font-orbitron text-destructive">WORST CPR</span>
          </div>
          <StatMetric 
            label="" 
            value="$736.47" 
            change="+2500%" 
            trend="down"
            subtext="Messaging Objective" 
          />
        </CyberCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <CyberCard title="CPR ANALYSIS BY OBJECTIVE" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                />
                <Bar dataKey="cpr" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CyberCard>

          <CyberCard title="TRAFFIC TREND (LAST 7 DAYS)" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                />
                <Line type="monotone" dataKey="visits" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--background)', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="msgs" stroke="var(--secondary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--background)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CyberCard>
        </div>

        {/* Right Column: Action Items & Alerts */}
        <div className="space-y-6">
          <CyberCard title="CRITICAL FINDINGS" variant="alert" glitchEffect>
            <div className="space-y-4">
              <div className="flex gap-3 items-start p-3 bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-destructive text-sm mb-1">HIGH CPR ALERT</h4>
                  <p className="text-xs text-muted-foreground">Messaging campaigns are burning budget at $736 CPR. 26x more expensive than Profile Visits.</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start p-3 bg-background/50 border border-border">
                <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-primary text-sm mb-1">FRAGMENTATION</h4>
                  <p className="text-xs text-muted-foreground">Only 10.5% of ads are active. 51 ads are dormant or ineffective.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-background/50 border border-border">
                <Eye className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-secondary text-sm mb-1">iOS BLIND SPOT</h4>
                  <p className="text-xs text-muted-foreground">Missing SKAN data and iOS/Android breakdown. Attribution is compromised.</p>
                </div>
              </div>
            </div>
          </CyberCard>

          <CyberCard title="RECOMMENDED ACTIONS (P0)" variant="success">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm">Pause 34 ads with CPR {'>'} $800</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm">Scale "Una sonrisa linda..." (CPR $13)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm">Verify Pixel + CAPI on landing</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Button className="w-full font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                  EXECUTE ALL ACTIONS
                </Button>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </CyberpunkLayout>
  );
}
