import { useAuth } from "@/_core/hooks/useAuth";
import CyberpunkLayout from "@/components/CyberpunkLayout";
import CyberCard from "@/components/CyberCard";
import StatMetric from "@/components/StatMetric";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Users, DollarSign, Activity, Eye, Settings as SettingsIcon, Loader2, Sparkles, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [pausingAds, setPausingAds] = useState(false);

  // Fetch data from Meta Ads API
  const { data: credentials } = trpc.metaAds.getCredentials.useQuery();
  const { data: insights, isLoading: insightsLoading } = trpc.metaAds.getAdInsights.useQuery(undefined, {
    enabled: credentials?.configured === true,
  });
  const { data: campaigns, isLoading: campaignsLoading } = trpc.metaAds.getCampaigns.useQuery(undefined, {
    enabled: credentials?.configured === true,
  });
  const { data: ads, isLoading: adsLoading } = trpc.metaAds.getAds.useQuery(undefined, {
    enabled: credentials?.configured === true,
  });

  const pauseMultipleAdsMutation = trpc.metaAds.pauseMultipleAds.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ ${data.paused} anuncios pausados exitosamente`);
      if (data.failed > 0) {
        toast.error(`⚠️ ${data.failed} anuncios fallaron al pausar`);
      }
      setPausingAds(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setPausingAds(false);
    },
  });

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    if (!insights || insights.length === 0) {
      return {
        totalSpend: 0,
        activeAds: 0,
        totalAds: 0,
        bestCPR: null,
        worstCPR: null,
        performanceByObjective: [],
        highCPRAds: [],
      };
    }

    // Calculate total spend (convert from cents to CLP)
    const totalSpend = insights.reduce((sum: number, ad: any) => sum + parseFloat(ad.spend || '0'), 0);

    // Count active ads
    const activeAds = ads?.filter((ad: any) => ad.status === 'ACTIVE').length || 0;
    const totalAds = ads?.length || 0;

    // Calculate CPR for each ad (Cost Per Result)
    const adsWithCPR = insights.map((ad: any) => {
      const spend = parseFloat(ad.spend || '0');
      const actions = ad.actions || [];
      const results = actions.reduce((sum: number, action: any) => sum + parseInt(action.value || '0', 10), 0);
      const cpr = results > 0 ? spend / results : spend;
      
      return {
        adId: ad.ad_id,
        adName: ad.ad_name,
        spend,
        results,
        cpr,
        objective: ad.objective || 'Unknown',
      };
    });

    // Find best and worst CPR
    const validCPRs = adsWithCPR.filter((ad: any) => ad.results > 0);
    const bestCPR = validCPRs.length > 0 
      ? validCPRs.reduce((min: any, ad: any) => ad.cpr < min.cpr ? ad : min)
      : null;
    const worstCPR = validCPRs.length > 0
      ? validCPRs.reduce((max: any, ad: any) => ad.cpr > max.cpr ? ad : max)
      : null;

    // Group by objective
    const objectiveMap = new Map();
    adsWithCPR.forEach((ad: any) => {
      if (!objectiveMap.has(ad.objective)) {
        objectiveMap.set(ad.objective, { spend: 0, results: 0, count: 0 });
      }
      const obj = objectiveMap.get(ad.objective);
      obj.spend += ad.spend;
      obj.results += ad.results;
      obj.count += 1;
    });

    const performanceByObjective = Array.from(objectiveMap.entries()).map(([objective, data]: [string, any]) => ({
      name: objective,
      cpr: data.results > 0 ? data.spend / data.results : data.spend,
      spend: data.spend,
    }));

    // Identify high CPR ads (CPR > 500)
    const highCPRAds = adsWithCPR.filter((ad: any) => ad.cpr > 500 && ad.results > 0);

    return {
      totalSpend,
      activeAds,
      totalAds,
      bestCPR,
      worstCPR,
      performanceByObjective,
      highCPRAds,
    };
  }, [insights, ads]);

  const handlePauseHighCPRAds = async () => {
    if (metrics.highCPRAds.length === 0) {
      toast.info('No hay anuncios con CPR alto para pausar');
      return;
    }

    setPausingAds(true);
    const adIds = metrics.highCPRAds.map((ad: any) => ad.adId);
    pauseMultipleAdsMutation.mutate({ adIds });
  };

  // Loading state
  const isLoading = authLoading || insightsLoading || campaignsLoading || adsLoading;

  // Not configured state
  if (credentials?.configured === false) {
    return (
      <CyberpunkLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto animate-pulse" />
            <h2 className="text-2xl font-orbitron font-bold text-primary">
              CONFIGURACIÓN REQUERIDA
            </h2>
            <p className="text-muted-foreground font-mono max-w-md">
              Necesitas configurar tus credenciales de Meta Ads API para ver datos en tiempo real.
            </p>
          </div>
          <Button
            onClick={() => setLocation("/settings")}
            className="font-mono bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            CONFIGURAR CREDENCIALES
          </Button>
        </div>
      </CyberpunkLayout>
    );
  }

  return (
    <CyberpunkLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-primary tracking-tight">
            COMMAND CENTER
          </h1>
          <p className="text-muted-foreground font-mono mt-1">
            AUDIT PERIOD: JAN 1 - DEC 3, 2025 | STATUS: {metrics.highCPRAds.length > 0 ? (
              <span className="text-destructive animate-pulse">CRITICAL ALERTS DETECTED</span>
            ) : (
              <span className="text-primary">OPERATIONAL</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono"
            onClick={() => setLocation("/ai-copilot")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI CO-PILOT
          </Button>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10 font-mono"
            onClick={() => setLocation("/settings")}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            CONFIGURE API
          </Button>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-mono">
            EXPORT REPORT
          </Button>
          <Button 
            variant="destructive" 
            className="font-mono"
            onClick={handlePauseHighCPRAds}
            disabled={pausingAds || metrics.highCPRAds.length === 0}
          >
            {pausingAds ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                PAUSANDO...
              </>
            ) : (
              `PAUSE ADS (${metrics.highCPRAds.length})`
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CyberCard>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-xs font-orbitron text-muted-foreground">TOTAL SPEND</span>
              </div>
              <StatMetric 
                label="" 
                value={`$${(metrics.totalSpend / 1000000).toFixed(1)}M`}
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
                value={`${metrics.activeAds} / ${metrics.totalAds}`}
                change={`${((metrics.activeAds / metrics.totalAds) * 100).toFixed(1)}%`}
                trend={metrics.activeAds / metrics.totalAds > 0.2 ? "up" : "down"}
                subtext={metrics.activeAds / metrics.totalAds < 0.2 ? "Delivery Fragmented" : "Good Distribution"} 
              />
            </CyberCard>

            <CyberCard variant="success">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xs font-orbitron text-muted-foreground">BEST CPR</span>
              </div>
              {metrics.bestCPR ? (
                <StatMetric 
                  label="" 
                  value={`$${metrics.bestCPR.cpr.toFixed(2)}`}
                  trend="up"
                  subtext={metrics.bestCPR.objective} 
                  highlight
                />
              ) : (
                <StatMetric 
                  label="" 
                  value="N/A"
                  subtext="No data available" 
                />
              )}
            </CyberCard>

            <CyberCard variant="alert">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-xs font-orbitron text-destructive">WORST CPR</span>
              </div>
              {metrics.worstCPR ? (
                <StatMetric 
                  label="" 
                  value={`$${metrics.worstCPR.cpr.toFixed(2)}`}
                  trend="down"
                  subtext={metrics.worstCPR.objective} 
                />
              ) : (
                <StatMetric 
                  label="" 
                  value="N/A"
                  subtext="No data available" 
                />
              )}
            </CyberCard>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-6">
              <CyberCard title="CPR ANALYSIS BY OBJECTIVE" className="h-[400px]">
                {metrics.performanceByObjective.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.performanceByObjective} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => `$${val.toFixed(0)}`} />
                      <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        itemStyle={{ color: 'var(--primary)' }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'CPR']}
                      />
                      <Bar dataKey="cpr" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground font-mono">No hay datos disponibles</p>
                  </div>
                )}
              </CyberCard>
            </div>

            {/* Right Column: Action Items & Alerts */}
            <div className="space-y-6">
              <CyberCard title="CRITICAL FINDINGS" variant="alert" glitchEffect>
                <div className="space-y-4">
                  {metrics.highCPRAds.length > 0 ? (
                    <div className="flex gap-3 items-start p-3 bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-destructive text-sm mb-1">HIGH CPR ALERT</h4>
                        <p className="text-xs text-muted-foreground">
                          {metrics.highCPRAds.length} anuncios con CPR {'>'} $500. Click en "PAUSE ADS" para pausarlos.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-start p-3 bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-primary text-sm mb-1">ALL CLEAR</h4>
                        <p className="text-xs text-muted-foreground">
                          No hay anuncios con CPR crítico en este momento.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 items-start p-3 bg-background/50 border border-border">
                    <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-primary text-sm mb-1">FRAGMENTATION</h4>
                      <p className="text-xs text-muted-foreground">
                        Solo {((metrics.activeAds / metrics.totalAds) * 100).toFixed(1)}% de anuncios están activos. 
                        {metrics.activeAds / metrics.totalAds < 0.2 ? ' Considera consolidar campañas.' : ' Buena distribución.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-3 bg-background/50 border border-border">
                    <Eye className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-secondary text-sm mb-1">iOS TRACKING</h4>
                      <p className="text-xs text-muted-foreground">
                        Verifica configuración de SKAdNetwork y CAPI para mejor atribución iOS.
                      </p>
                    </div>
                  </div>
                </div>
              </CyberCard>

              <CyberCard title="RECOMMENDED ACTIONS (P0)" variant="success">
                <div className="space-y-3">
                  {metrics.highCPRAds.length > 0 && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Pausar {metrics.highCPRAds.length} anuncios con CPR {'>'} $500</span>
                    </div>
                  )}
                  {metrics.bestCPR && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Escalar "{metrics.bestCPR.adName?.substring(0, 30)}..." (CPR ${metrics.bestCPR.cpr.toFixed(0)})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm">Verificar Pixel + CAPI en landing</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button 
                      className="w-full font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setLocation("/settings")}
                    >
                      VER GUÍA ESTRATÉGICA
                    </Button>
                  </div>
                </div>
              </CyberCard>
            </div>
          </div>
        </>
      )}
    </CyberpunkLayout>
  );
}
