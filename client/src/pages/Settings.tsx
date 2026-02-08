import { useAuth } from "@/_core/hooks/useAuth";
import CyberpunkLayout from "@/components/CyberpunkLayout";
import CyberCard from "@/components/CyberCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Key, Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load existing credentials
  const { data: credentialsData, isLoading: isLoadingCredentials } = trpc.metaAds.getCredentials.useQuery();

  useEffect(() => {
    if (credentialsData?.configured) {
      setIsConfigured(true);
      setAppId(credentialsData.appId || "");
      setAdAccountId(credentialsData.adAccountId || "");
      // Don't set appSecret and accessToken for security (they're not returned from backend)
    }
  }, [credentialsData]);

  const saveCredentials = trpc.metaAds.saveCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciales guardadas correctamente", {
        description: "Tu dashboard ahora puede conectarse a Meta Ads API"
      });
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast.error("Error al guardar credenciales", {
        description: error.message
      });
      setIsSubmitting(false);
    }
  });

  const testConnection = trpc.metaAds.testConnection.useMutation({
    onSuccess: (data) => {
      toast.success("Conexión exitosa", {
        description: `Conectado a cuenta: ${data.accountName}`
      });
    },
    onError: (error: any) => {
      toast.error("Error al probar conexión", {
        description: error.message
      });
    }
  });

  const handleSave = async () => {
    if (!appId || !appSecret || !accessToken || !adAccountId) {
      toast.error("Campos incompletos", {
        description: "Por favor completa todos los campos"
      });
      return;
    }

    setIsSubmitting(true);
    saveCredentials.mutate({
      appId,
      appSecret,
      accessToken,
      adAccountId
    });
  };

  const handleTest = async () => {
    if (!appId || !appSecret || !accessToken || !adAccountId) {
      toast.error("Campos incompletos", {
        description: "Por favor completa todos los campos antes de probar"
      });
      return;
    }

    testConnection.mutate({
      appId,
      appSecret,
      accessToken,
      adAccountId
    });
  };

  return (
    <CyberpunkLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-primary tracking-tight">
            SYSTEM CONFIGURATION
          </h1>
          <p className="text-muted-foreground font-mono mt-1">
            META ADS API CREDENTIALS | STATUS: {isLoadingCredentials ? (
              <span className="text-primary">LOADING...</span>
            ) : isConfigured ? (
              <span className="text-green-500">CONFIGURED ✓</span>
            ) : (
              <span className="text-destructive">NOT CONFIGURED</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {isLoadingCredentials ? (
              <CyberCard title="META ADS API CREDENTIALS">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground font-mono">Loading credentials...</span>
                </div>
              </CyberCard>
            ) : (
              <CyberCard title="META ADS API CREDENTIALS">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appId" className="text-xs font-orbitron text-muted-foreground uppercase tracking-wider">
                    APP ID
                  </Label>
                  <Input
                    id="appId"
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="827057756116616"
                    className="font-mono bg-background/50 border-border"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Identificador de tu aplicación de Meta for Developers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appSecret" className="text-xs font-orbitron text-muted-foreground uppercase tracking-wider">
                    APP SECRET
                  </Label>
                  <Input
                    id="appSecret"
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="font-mono bg-background/50 border-border"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Clave secreta de tu aplicación (Configuración → Básica)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessToken" className="text-xs font-orbitron text-muted-foreground uppercase tracking-wider">
                    ACCESS TOKEN (LONG-LIVED)
                  </Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAALt••••••••••••••••••••••••••••••••"
                    className="font-mono bg-background/50 border-border"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Token de larga duración con permisos ads_read, ads_management
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adAccountId" className="text-xs font-orbitron text-muted-foreground uppercase tracking-wider">
                    AD ACCOUNT ID
                  </Label>
                  <Input
                    id="adAccountId"
                    type="text"
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    placeholder="act_123456789"
                    className="font-mono bg-background/50 border-border"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    ID de tu cuenta publicitaria (formato: act_XXXXXXXXXX)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleTest}
                    variant="outline"
                    className="flex-1 border-primary text-primary hover:bg-primary/10 font-mono"
                    disabled={testConnection.isPending}
                  >
                    {testConnection.isPending ? "TESTING..." : "TEST CONNECTION"}
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "SAVING..." : "SAVE CREDENTIALS"}
                  </Button>
                </div>
              </div>
              </CyberCard>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <CyberCard title="SETUP GUIDE" variant="success">
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <Key className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-primary text-sm mb-1">STEP 1: APP CREDENTIALS</h4>
                    <p className="text-xs text-muted-foreground">Obtén APP_ID y APP_SECRET desde developers.facebook.com/apps → Configuración → Básica</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-primary text-sm mb-1">STEP 2: ACCESS TOKEN</h4>
                    <p className="text-xs text-muted-foreground">Genera token en Graph API Explorer con permisos ads_read y ads_management</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-primary text-sm mb-1">STEP 3: AD ACCOUNT</h4>
                    <p className="text-xs text-muted-foreground">Copia tu Ad Account ID desde business.facebook.com/adsmanager</p>
                  </div>
                </div>
              </div>
            </CyberCard>

            <CyberCard title="SECURITY NOTICE" variant="alert">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-destructive text-sm mb-1">ENCRYPTED STORAGE</h4>
                  <p className="text-xs text-muted-foreground">
                    Tus credenciales se almacenan de forma segura y encriptada. Nunca se comparten con terceros.
                  </p>
                </div>
              </div>
            </CyberCard>
          </div>
        </div>
      </div>
    </CyberpunkLayout>
  );
}
