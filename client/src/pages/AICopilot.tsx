import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Brain,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

// Priority colors
const priorityColors = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const priorityIcons = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Clock,
};

// Action icons
const actionIcons: Record<string, typeof TrendingUp> = {
  scale_budget: TrendingUp,
  pause_ad: Pause,
  refresh_creative: RefreshCw,
  optimize_schedule: Clock,
  consolidate_campaigns: Target,
};

// Type colors
const typeColors: Record<string, string> = {
  budget: 'bg-green-500/10 text-green-500',
  creative: 'bg-purple-500/10 text-purple-500',
  schedule: 'bg-blue-500/10 text-blue-500',
  strategy: 'bg-orange-500/10 text-orange-500',
  audience: 'bg-pink-500/10 text-pink-500',
};

interface Suggestion {
  id: number;
  type: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  serviceName?: string | null;
  currentState: unknown;
  proposedState: unknown;
  estimatedRevenue?: string | null;
  estimatedProfit?: string | null;
  estimatedSavings?: string | null;
  estimatedROI?: string | null;
  confidence: string;
  risk: string;
  reasoning: string;
  status: string;
  createdAt: Date;
  expiresAt?: Date | null;
}

function SuggestionCard({ 
  suggestion, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting 
}: { 
  suggestion: Suggestion;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const PriorityIcon = priorityIcons[suggestion.priority];
  const ActionIcon = actionIcons[suggestion.action] || Zap;
  
  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return `$${num.toLocaleString('es-CL')} CLP`;
  };

  const confidence = parseFloat(suggestion.confidence) * 100;

  return (
    <>
      <Card className={`border-l-4 ${
        suggestion.priority === 'high' ? 'border-l-red-500' :
        suggestion.priority === 'medium' ? 'border-l-yellow-500' :
        'border-l-blue-500'
      } hover:shadow-lg transition-shadow`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeColors[suggestion.type] || 'bg-gray-500/10'}`}>
                <ActionIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {suggestion.action === 'scale_budget' && 'Escalar Presupuesto'}
                  {suggestion.action === 'pause_ad' && 'Pausar Anuncio'}
                  {suggestion.action === 'refresh_creative' && 'Refrescar Creativo'}
                  {suggestion.action === 'optimize_schedule' && 'Optimizar Horarios'}
                  {suggestion.action === 'consolidate_campaigns' && 'Consolidar Campañas'}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {suggestion.targetName}
                  {suggestion.serviceName && (
                    <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                      {suggestion.serviceName}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={priorityColors[suggestion.priority]}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Media' : 'Baja'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Impact Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {suggestion.estimatedProfit && (
              <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                <div className="flex items-center gap-1 text-green-500 text-xs mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Profit Est.
                </div>
                <div className="font-semibold text-sm">
                  {formatCurrency(suggestion.estimatedProfit)}
                </div>
              </div>
            )}
            {suggestion.estimatedSavings && (
              <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                <div className="flex items-center gap-1 text-blue-500 text-xs mb-1">
                  <DollarSign className="h-3 w-3" />
                  Ahorro Est.
                </div>
                <div className="font-semibold text-sm">
                  {formatCurrency(suggestion.estimatedSavings)}
                </div>
              </div>
            )}
            {suggestion.estimatedROI && (
              <div className="bg-purple-500/5 rounded-lg p-3 border border-purple-500/10">
                <div className="flex items-center gap-1 text-purple-500 text-xs mb-1">
                  <Target className="h-3 w-3" />
                  ROI Est.
                </div>
                <div className="font-semibold text-sm">
                  {parseFloat(suggestion.estimatedROI).toFixed(1)}x
                </div>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                <Brain className="h-3 w-3" />
                Confianza
              </div>
              <div className="font-semibold text-sm">
                {confidence.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(true)}
              className="text-muted-foreground"
            >
              Ver detalles
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={isRejecting || isApproving}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                {isRejecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Rechazar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Aprobar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ActionIcon className="h-5 w-5" />
              {suggestion.action === 'scale_budget' && 'Escalar Presupuesto'}
              {suggestion.action === 'pause_ad' && 'Pausar Anuncio'}
              {suggestion.action === 'refresh_creative' && 'Refrescar Creativo'}
              {suggestion.action === 'optimize_schedule' && 'Optimizar Horarios'}
              {suggestion.action === 'consolidate_campaigns' && 'Consolidar Campañas'}
            </DialogTitle>
            <DialogDescription>
              {suggestion.targetName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Reasoning */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Análisis y Justificación
              </h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {suggestion.reasoning}
              </div>
            </div>

            {/* Current vs Proposed State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10">
                <h4 className="font-semibold mb-2 text-red-500 text-sm">Estado Actual</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(suggestion.currentState as Record<string, unknown>, null, 2)}
                </pre>
              </div>
              <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/10">
                <h4 className="font-semibold mb-2 text-green-500 text-sm">Estado Propuesto</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(suggestion.proposedState as Record<string, unknown>, null, 2)}
                </pre>
              </div>
            </div>

            {/* Risk and Confidence */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={
                suggestion.risk === 'low' ? 'bg-green-500/10 text-green-500' :
                suggestion.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }>
                Riesgo: {suggestion.risk === 'low' ? 'Bajo' : suggestion.risk === 'medium' ? 'Medio' : 'Alto'}
              </Badge>
              <Badge variant="outline">
                Confianza: {confidence.toFixed(0)}%
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onReject();
                setShowDetails(false);
              }}
              disabled={isRejecting || isApproving}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
            <Button
              onClick={() => {
                onApprove();
                setShowDetails(false);
              }}
              disabled={isApproving || isRejecting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aprobar y Ejecutar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AICopilot() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // Queries
  const { data: pendingSuggestions, refetch: refetchPending, isLoading: loadingPending } = 
    trpc.aiCopilot.getPendingSuggestions.useQuery();
  
  const { data: allSuggestions, refetch: refetchAll, isLoading: loadingAll } = 
    trpc.aiCopilot.getAllSuggestions.useQuery({ status: 'all', limit: 100 });
  
  const { data: stats, refetch: refetchStats } = trpc.aiCopilot.getStats.useQuery();

  // Mutations
  const analyzeMutation = trpc.aiCopilot.analyze.useMutation({
    onSuccess: (data) => {
      toast.success(`Análisis completado: ${data.suggestions.length} sugerencias nuevas`);
      refetchPending();
      refetchAll();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Error en análisis: ${error.message}`);
    },
  });

  const approveMutation = trpc.aiCopilot.approveSuggestion.useMutation({
    onSuccess: () => {
      toast.success("Sugerencia aprobada y ejecutada correctamente");
      setApprovingId(null);
      refetchPending();
      refetchAll();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Error al aprobar: ${error.message}`);
      setApprovingId(null);
    },
  });

  const rejectMutation = trpc.aiCopilot.rejectSuggestion.useMutation({
    onSuccess: () => {
      toast.info("Sugerencia rechazada");
      setRejectingId(null);
      refetchPending();
      refetchAll();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Error al rechazar: ${error.message}`);
      setRejectingId(null);
    },
  });

  const handleApprove = (suggestionId: number) => {
    setApprovingId(suggestionId);
    approveMutation.mutate({ suggestionId });
  };

  const handleReject = (suggestionId: number) => {
    setRejectingId(suggestionId);
    rejectMutation.mutate({ suggestionId });
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };

  const pendingCount = pendingSuggestions?.length || 0;
  const highPriorityCount = pendingSuggestions?.filter((s: Suggestion) => s.priority === 'high').length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Co-Pilot</h1>
                <p className="text-muted-foreground">
                  Optimización asistida por inteligencia artificial
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {analyzeMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Analizar Campañas
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              {highPriorityCount > 0 && (
                <p className="text-xs text-red-500 mt-2">
                  {highPriorityCount} de alta prioridad
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ejecutadas</p>
                  <p className="text-2xl font-bold">{stats?.executed || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ahorro Total</p>
                  <p className="text-2xl font-bold">
                    ${((stats?.totalSavings || 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Total</p>
                  <p className="text-2xl font-bold">
                    ${((stats?.totalProfit || 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="relative">
              Pendientes
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loadingPending ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No hay sugerencias pendientes</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Haz click en "Analizar Campañas" para generar nuevas sugerencias
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                  >
                    {analyzeMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Analizar Ahora
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* High Priority Banner */}
                {highPriorityCount > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-500">
                        {highPriorityCount} sugerencia{highPriorityCount > 1 ? 's' : ''} de alta prioridad
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Estas acciones pueden tener un impacto significativo en tu ROI
                      </p>
                    </div>
                  </div>
                )}

                {/* Suggestions List */}
                {pendingSuggestions?.map((suggestion: Suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApprove={() => handleApprove(suggestion.id)}
                    onReject={() => handleReject(suggestion.id)}
                    isApproving={approvingId === suggestion.id}
                    isRejecting={rejectingId === suggestion.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !allSuggestions || allSuggestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Sin historial</h3>
                  <p className="text-muted-foreground text-sm">
                    Las sugerencias aprobadas y rechazadas aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allSuggestions.map((suggestion: Suggestion) => (
                  <Card key={suggestion.id} className="opacity-80">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeColors[suggestion.type] || 'bg-gray-500/10'}`}>
                            {(() => {
                              const Icon = actionIcons[suggestion.action] || Zap;
                              return <Icon className="h-4 w-4" />;
                            })()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{suggestion.targetName}</p>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.action === 'scale_budget' && 'Escalar Presupuesto'}
                              {suggestion.action === 'pause_ad' && 'Pausar Anuncio'}
                              {suggestion.action === 'refresh_creative' && 'Refrescar Creativo'}
                              {suggestion.action === 'optimize_schedule' && 'Optimizar Horarios'}
                              {suggestion.action === 'consolidate_campaigns' && 'Consolidar Campañas'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          suggestion.status === 'executed' ? 'bg-green-500/10 text-green-500' :
                          suggestion.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          suggestion.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                          suggestion.status === 'failed' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-gray-500/10 text-gray-500'
                        }>
                          {suggestion.status === 'executed' && 'Ejecutada'}
                          {suggestion.status === 'rejected' && 'Rechazada'}
                          {suggestion.status === 'approved' && 'Aprobada'}
                          {suggestion.status === 'failed' && 'Fallida'}
                          {suggestion.status === 'pending' && 'Pendiente'}
                          {suggestion.status === 'expired' && 'Expirada'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
