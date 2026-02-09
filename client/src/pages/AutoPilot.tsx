import { useState, useEffect } from 'react';
import CyberpunkLayout from '@/components/CyberpunkLayout';
import CyberCard from '@/components/CyberCard';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Play, Square, RefreshCw, Settings, Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoPilot() {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Queries
  const statusQuery = trpc.automation.getStatus.useQuery(undefined, {
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  const presetsQuery = trpc.automation.getPresets.useQuery();

  // Mutations
  const startMutation = trpc.automation.startScheduler.useMutation({
    onSuccess: () => {
      toast.success('✅ Auto-Pilot Activado', {
        description: 'El sistema comenzará a evaluar campañas automáticamente',
      });
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error('❌ Error', {
        description: error.message,
      });
    },
    onSettled: () => setIsStarting(false),
  });

  const stopMutation = trpc.automation.stopScheduler.useMutation({
    onSuccess: () => {
      toast.info('⏸️ Auto-Pilot Desactivado', {
        description: 'El sistema dejó de evaluar campañas automáticamente',
      });
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error('❌ Error', {
        description: error.message,
      });
    },
    onSettled: () => setIsStopping(false),
  });

  const executeMutation = trpc.automation.executeManually.useMutation({
    onSuccess: () => {
      toast.success('🚀 Ejecución Manual Iniciada', {
        description: 'El sistema está evaluando todas las campañas en segundo plano',
      });
    },
    onError: (error) => {
      toast.error('❌ Error', {
        description: error.message,
      });
    },
    onSettled: () => setIsExecuting(false),
  });

  const updateCronMutation = trpc.automation.updateCron.useMutation({
    onSuccess: () => {
      toast.success('✅ Frecuencia Actualizada', {
        description: 'La frecuencia de ejecución se actualizó correctamente',
      });
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error('❌ Error', {
        description: error.message,
      });
    },
  });

  const handleStart = () => {
    setIsStarting(true);
    startMutation.mutate({});
  };

  const handleStop = () => {
    setIsStopping(true);
    stopMutation.mutate();
  };

  const handleExecuteManually = () => {
    setIsExecuting(true);
    executeMutation.mutate();
  };

  const handleChangeCron = (cronExpression: string) => {
    updateCronMutation.mutate({ cronExpression });
  };

  const status = statusQuery.data?.status;
  const presets = presetsQuery.data?.presets;
  const isEnabled = status?.enabled || false;

  return (
    <CyberpunkLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-primary tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8" />
            AUTO-PILOT
          </h1>
          <p className="text-muted-foreground font-mono mt-1">
            SISTEMA DE AUTOMATIZACIÓN INTELIGENTE | ESTADO:{' '}
            <span className={isEnabled ? 'text-green-400 animate-pulse' : 'text-destructive'}>
              {isEnabled ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {!isEnabled ? (
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="bg-green-600 hover:bg-green-700 text-white font-mono"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'INICIANDO...' : 'ACTIVAR AUTO-PILOT'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={isStopping}
              variant="destructive"
              className="font-mono"
            >
              <Square className="w-4 h-4 mr-2" />
              {isStopping ? 'DETENIENDO...' : 'DESACTIVAR'}
            </Button>
          )}
          <Button
            onClick={handleExecuteManually}
            disabled={isExecuting}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10 font-mono"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isExecuting ? 'animate-spin' : ''}`} />
            {isExecuting ? 'EJECUTANDO...' : 'EJECUTAR AHORA'}
          </Button>
        </div>
      </div>

      {/* Estado del Scheduler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CyberCard>
          <div className="flex items-center gap-3 mb-2">
            {isEnabled ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            <span className="text-xs font-orbitron text-muted-foreground">ESTADO</span>
          </div>
          <div className="text-2xl font-bold font-orbitron">
            {isEnabled ? (
              <span className="text-green-400">OPERACIONAL</span>
            ) : (
              <span className="text-destructive">INACTIVO</span>
            )}
          </div>
        </CyberCard>

        <CyberCard>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-xs font-orbitron text-muted-foreground">ÚLTIMA EJECUCIÓN</span>
          </div>
          <div className="text-lg font-bold font-mono">
            {status?.lastRun ? (
              new Date(status.lastRun).toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            ) : (
              <span className="text-muted-foreground">NUNCA</span>
            )}
          </div>
        </CyberCard>

        <CyberCard>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-secondary" />
            <span className="text-xs font-orbitron text-muted-foreground">PRÓXIMA EJECUCIÓN</span>
          </div>
          <div className="text-lg font-bold font-mono">
            {status?.nextRun ? (
              new Date(status.nextRun).toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </div>
        </CyberCard>
      </div>

      {/* Configuración de Frecuencia */}
      <CyberCard title="CONFIGURACIÓN DE FRECUENCIA" className="mb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-mono">
            Selecciona cada cuánto tiempo el Auto-Pilot debe evaluar tus campañas y ejecutar
            acciones automáticas.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presets && Object.entries(presets).map(([key, cronExpression]) => {
              const labels: Record<string, string> = {
                EVERY_HOUR: 'Cada Hora',
                EVERY_2_HOURS: 'Cada 2 Horas',
                EVERY_4_HOURS: 'Cada 4 Horas',
                EVERY_6_HOURS: 'Cada 6 Horas',
                EVERY_DAY_9AM: 'Diario 9:00 AM',
                EVERY_DAY_NOON: 'Diario 12:00 PM',
              };

              const isActive = status?.cronExpression === cronExpression;

              return (
                <Button
                  key={key}
                  onClick={() => handleChangeCron(cronExpression as string)}
                  variant={isActive ? 'default' : 'outline'}
                  className={`font-mono ${isActive ? 'bg-primary text-primary-foreground' : 'border-primary text-primary hover:bg-primary/10'}`}
                  disabled={updateCronMutation.isPending}
                >
                  {labels[key] || key}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-background/50 border border-border rounded">
            <p className="text-xs font-mono text-muted-foreground">
              <strong>Expresión Cron Actual:</strong> {status?.cronExpression || 'N/A'}
            </p>
          </div>
        </div>
      </CyberCard>

      {/* Información del Sistema */}
      <CyberCard title="CÓMO FUNCIONA EL AUTO-PILOT" variant="success">
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary text-sm mb-1">Evaluación Automática</h4>
              <p className="text-xs text-muted-foreground">
                El sistema evalúa todas tus campañas activas según las reglas configuradas (CPR,
                gasto, conversiones, etc.)
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary text-sm mb-1">Acciones Inteligentes</h4>
              <p className="text-xs text-muted-foreground">
                Pausa campañas con CPR alto, escala presupuesto de campañas ganadoras, reduce
                presupuesto de bajo rendimiento
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary text-sm mb-1">Notificaciones por Email</h4>
              <p className="text-xs text-muted-foreground">
                Recibirás un email cada vez que el sistema tome una decisión importante sobre tus
                campañas
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary text-sm mb-1">Sin Intervención Manual</h4>
              <p className="text-xs text-muted-foreground">
                Una vez activado, el Auto-Pilot trabaja 24/7 sin necesidad de que revises el
                dashboard constantemente
              </p>
            </div>
          </div>
        </div>
      </CyberCard>
    </CyberpunkLayout>
  );
}
