import { useState } from 'react';
import CyberpunkLayout from '@/components/CyberpunkLayout';
import CyberCard from '@/components/CyberCard';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { CheckCircle2, XCircle, AlertCircle, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function SystemDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    const addResult = (result: DiagnosticResult) => {
      setResults((prev) => [...prev, result]);
    };

    try {
      // 1. Verificar credenciales
      addResult({ step: '1', status: 'warning', message: 'Verificando credenciales de Meta Ads...' });
      
      try {
        const credsResponse = await fetch('/api/trpc/metaAds.getCredentials', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (credsResponse.ok) {
          const credsData = await credsResponse.json();
          if (credsData.result?.data) {
            addResult({
              step: '1',
              status: 'success',
              message: '✅ Credenciales encontradas en BD',
              details: credsData.result.data,
            });
          } else {
            addResult({
              step: '1',
              status: 'error',
              message: '❌ No hay credenciales configuradas. Ve a /settings para configurarlas.',
            });
            setIsRunning(false);
            return;
          }
        } else {
          addResult({
            step: '1',
            status: 'error',
            message: '❌ Error al obtener credenciales',
          });
          setIsRunning(false);
          return;
        }
      } catch (error: any) {
        addResult({
          step: '1',
          status: 'error',
          message: `❌ Error: ${error.message}`,
        });
        setIsRunning(false);
        return;
      }

      // 2. Probar conexión con Meta Ads API
      addResult({ step: '2', status: 'warning', message: 'Probando conexión con Meta Ads API...' });
      
      try {
        const campaignsResponse = await fetch('/api/trpc/metaAds.getCampaigns', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          const campaigns = campaignsData.result?.data || [];
          addResult({
            step: '2',
            status: 'success',
            message: `✅ Conexión exitosa. ${campaigns.length} campañas encontradas.`,
            details: campaigns.slice(0, 3), // Mostrar solo las primeras 3
          });
        } else {
          const errorData = await campaignsResponse.json();
          addResult({
            step: '2',
            status: 'error',
            message: `❌ Error al obtener campañas: ${errorData.error?.message || 'Error desconocido'}`,
          });
          setIsRunning(false);
          return;
        }
      } catch (error: any) {
        addResult({
          step: '2',
          status: 'error',
          message: `❌ Error: ${error.message}`,
        });
        setIsRunning(false);
        return;
      }

      // 3. Verificar reglas de automatización
      addResult({ step: '3', status: 'warning', message: 'Verificando reglas de automatización...' });
      
      try {
        const rulesResponse = await fetch('/api/trpc/metaAds.getAutomationRules', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          const rules = rulesData.result?.data || [];
          const activeRules = rules.filter((r: any) => r.enabled);
          
          if (activeRules.length > 0) {
            addResult({
              step: '3',
              status: 'success',
              message: `✅ ${activeRules.length} reglas activas encontradas`,
              details: activeRules,
            });
          } else {
            addResult({
              step: '3',
              status: 'warning',
              message: '⚠️ No hay reglas activas. Crea reglas en /ai-copilot/config',
            });
          }
        } else {
          addResult({
            step: '3',
            status: 'error',
            message: '❌ Error al obtener reglas',
          });
        }
      } catch (error: any) {
        addResult({
          step: '3',
          status: 'error',
          message: `❌ Error: ${error.message}`,
        });
      }

      // 4. Verificar estado del scheduler
      addResult({ step: '4', status: 'warning', message: 'Verificando estado del Auto-Pilot...' });
      
      try {
        const statusResponse = await fetch('/api/trpc/automation.getStatus', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = statusData.result?.data?.status;
          
          if (status?.enabled) {
            addResult({
              step: '4',
              status: 'success',
              message: `✅ Auto-Pilot ACTIVO (${status.cronExpression})`,
              details: status,
            });
          } else {
            addResult({
              step: '4',
              status: 'warning',
              message: '⚠️ Auto-Pilot INACTIVO. Actívalo en /auto-pilot',
            });
          }
        } else {
          addResult({
            step: '4',
            status: 'error',
            message: '❌ Error al obtener estado del scheduler',
          });
        }
      } catch (error: any) {
        addResult({
          step: '4',
          status: 'error',
          message: `❌ Error: ${error.message}`,
        });
      }

      // 5. Resumen final
      addResult({
        step: '5',
        status: 'success',
        message: '🎉 Diagnóstico completado',
      });

      toast.success('Diagnóstico completado');
    } catch (error: any) {
      toast.error(`Error en diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
  };

  return (
    <CyberpunkLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-primary tracking-tight">
            DIAGNÓSTICO DEL SISTEMA
          </h1>
          <p className="text-muted-foreground font-mono mt-1">
            Verificación completa de configuración y funcionamiento
          </p>
        </div>
        <Button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              EJECUTANDO...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              EJECUTAR DIAGNÓSTICO
            </>
          )}
        </Button>
      </div>

      <CyberCard title="RESULTADOS DEL DIAGNÓSTICO">
        {results.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-mono">Presiona "EJECUTAR DIAGNÓSTICO" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex gap-3 items-start p-4 bg-background/50 border border-border rounded"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1">{result.message}</h4>
                  {result.details && (
                    <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CyberCard>

      <CyberCard title="CHECKLIST DE CONFIGURACIÓN" className="mt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm">1. Configurar credenciales de Meta Ads en /settings</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm">2. Crear reglas de automatización en /ai-copilot/config</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm">3. Activar Auto-Pilot en /auto-pilot</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm">4. Ejecutar este diagnóstico para verificar</span>
          </div>
        </div>
      </CyberCard>
    </CyberpunkLayout>
  );
}
