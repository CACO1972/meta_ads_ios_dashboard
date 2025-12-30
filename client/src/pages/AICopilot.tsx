import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  BarChart3,
  Bot,
  Gauge,
  Activity,
  LineChart,
  Image,
  Eye,
  ThumbsUp,
  ThumbsDown
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
import { Progress } from '@/components/ui/progress';

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

interface ConfigData {
  promptMaestro?: string | null;
  maxCPR?: string | null;
  minROI?: string | null;
  maxFrequency?: string | null;
  maxDailySpend?: string | null;
  autoApproveHighConfidence: boolean;
  autoApproveThreshold: string;
  analysisInterval: number;
  emailNotifications: boolean;
  highPriorityOnly: boolean;
}

function SuggestionCard({ 
  suggestion, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting,
  autoModeActive,
  autoThreshold
}: { 
  suggestion: Suggestion;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  autoModeActive?: boolean;
  autoThreshold?: number;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const PriorityIcon = priorityIcons[suggestion.priority];
  const ActionIcon = actionIcons[suggestion.action] || Zap;
  
  const confidence = parseFloat(suggestion.confidence) * 100;
  const estimatedProfit = suggestion.estimatedProfit ? parseFloat(suggestion.estimatedProfit) : null;
  const estimatedSavings = suggestion.estimatedSavings ? parseFloat(suggestion.estimatedSavings) : null;
  const estimatedROI = suggestion.estimatedROI ? parseFloat(suggestion.estimatedROI) : null;

  // Check if this suggestion would be auto-approved
  const wouldAutoApprove = autoModeActive && autoThreshold && confidence >= autoThreshold;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M CLP`;
    } else if (value >= 1000) {
      return `$${value.toLocaleString('es-CL')} CLP`;
    }
    return `$${value.toFixed(2)} CLP`;
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-lg ${wouldAutoApprove ? 'border-purple-500/50 bg-purple-500/5' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeColors[suggestion.type] || 'bg-gray-500/10'}`}>
                <ActionIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {suggestion.action === 'scale_budget' && 'Escalar Presupuesto'}
                  {suggestion.action === 'pause_ad' && 'Pausar Anuncio'}
                  {suggestion.action === 'refresh_creative' && 'Refrescar Creativo'}
                  {suggestion.action === 'optimize_schedule' && 'Optimizar Horarios'}
                  {suggestion.action === 'consolidate_campaigns' && 'Consolidar Campañas'}
                </h3>
                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                  {suggestion.targetName}
                  {suggestion.serviceName && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted">
                      {suggestion.serviceName}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wouldAutoApprove && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <Bot className="h-3 w-3 mr-1" />
                  Auto
                </Badge>
              )}
              <Badge className={priorityColors[suggestion.priority]}>
                {suggestion.priority === 'high' && 'Alta'}
                {suggestion.priority === 'medium' && 'Media'}
                {suggestion.priority === 'low' && 'Baja'}
              </Badge>
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {estimatedProfit && (
              <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                <p className="text-xs text-green-500 mb-1">↗ Profit Est.</p>
                <p className="font-semibold text-sm">{formatCurrency(estimatedProfit)}</p>
              </div>
            )}
            {estimatedSavings && (
              <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                <p className="text-xs text-blue-500 mb-1">$ Ahorro Est.</p>
                <p className="font-semibold text-sm">{formatCurrency(estimatedSavings)}</p>
              </div>
            )}
            {estimatedROI && (
              <div className="bg-purple-500/5 rounded-lg p-3 border border-purple-500/10">
                <p className="text-xs text-purple-500 mb-1">◎ ROI Est.</p>
                <p className="font-semibold text-sm">{estimatedROI.toFixed(1)}x</p>
              </div>
            )}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">ⓘ Confianza</p>
              <p className="font-semibold text-sm">{confidence.toFixed(0)}%</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetails(true)}
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
                <XCircle className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Aprobar
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

// Configuration Panel Component
function ConfigPanel({ 
  isOpen, 
  onClose,
  config,
  onSave,
  isSaving
}: { 
  isOpen: boolean; 
  onClose: () => void;
  config: ConfigData | null;
  onSave: (data: Partial<ConfigData>) => void;
  isSaving: boolean;
}) {
  const [localConfig, setLocalConfig] = useState<Partial<ConfigData>>({
    autoApproveHighConfidence: false,
    autoApproveThreshold: '0.95',
    analysisInterval: 60,
    emailNotifications: true,
    highPriorityOnly: false,
    promptMaestro: '',
  });

  useEffect(() => {
    if (config) {
      setLocalConfig({
        autoApproveHighConfidence: config.autoApproveHighConfidence,
        autoApproveThreshold: config.autoApproveThreshold,
        analysisInterval: config.analysisInterval,
        emailNotifications: config.emailNotifications,
        highPriorityOnly: config.highPriorityOnly,
        promptMaestro: config.promptMaestro || '',
        maxCPR: config.maxCPR || '',
        minROI: config.minROI || '',
      });
    }
  }, [config]);

  const thresholdValue = parseFloat(localConfig.autoApproveThreshold || '0.95') * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del AI Co-Pilot
          </DialogTitle>
          <DialogDescription>
            Personaliza el comportamiento del asistente de optimización
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto Mode Section */}
          <div className="space-y-4 p-4 rounded-lg border bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Bot className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Modo Automático</h3>
                  <p className="text-sm text-muted-foreground">
                    Ejecuta sugerencias de alta confianza automáticamente
                  </p>
                </div>
              </div>
              <Switch
                checked={localConfig.autoApproveHighConfidence}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, autoApproveHighConfidence: checked }))
                }
              />
            </div>

            {localConfig.autoApproveHighConfidence && (
              <div className="space-y-3 pt-3 border-t border-purple-500/20">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Umbral de Confianza</Label>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {thresholdValue.toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[thresholdValue]}
                  onValueChange={([value]) => 
                    setLocalConfig(prev => ({ ...prev, autoApproveThreshold: (value / 100).toString() }))
                  }
                  min={70}
                  max={99}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Las sugerencias con confianza ≥ {thresholdValue.toFixed(0)}% se ejecutarán automáticamente
                </p>
              </div>
            )}
          </div>

          {/* Analysis Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Configuración de Análisis
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxCPR">CPR Máximo (CLP)</Label>
                <Input
                  id="maxCPR"
                  type="number"
                  placeholder="ej: 50000"
                  value={localConfig.maxCPR || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, maxCPR: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minROI">ROI Mínimo (x)</Label>
                <Input
                  id="minROI"
                  type="number"
                  placeholder="ej: 5"
                  value={localConfig.minROI || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, minROI: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysisInterval">Intervalo de Análisis (minutos)</Label>
              <Input
                id="analysisInterval"
                type="number"
                min={15}
                max={1440}
                value={localConfig.analysisInterval}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, analysisInterval: parseInt(e.target.value) || 60 }))}
              />
            </div>
          </div>

          {/* Prompt Maestro */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Prompt Maestro
            </h3>
            <Textarea
              placeholder="Instrucciones personalizadas para el AI Co-Pilot. Ejemplo: 'Prioriza siempre los anuncios de implantes dentales. No pausar anuncios con menos de 3 días activos.'"
              value={localConfig.promptMaestro || ''}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, promptMaestro: e.target.value }))}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Estas instrucciones guiarán las decisiones del AI Co-Pilot
            </p>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="font-semibold">Notificaciones</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones por Email</Label>
                <p className="text-xs text-muted-foreground">
                  Recibe alertas de nuevas sugerencias
                </p>
              </div>
              <Switch
                checked={localConfig.emailNotifications}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Solo Alta Prioridad</Label>
                <p className="text-xs text-muted-foreground">
                  Solo notificar sugerencias de alta prioridad
                </p>
              </div>
              <Switch
                checked={localConfig.highPriorityOnly}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, highPriorityOnly: checked }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(localConfig)}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Guardar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Predictions Panel Component
function PredictionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  // Calculate predictions based on historical data
  const executedSuggestions = suggestions.filter(s => s.status === 'executed');
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  
  // Calculate potential impact if all pending suggestions are approved
  const potentialProfit = pendingSuggestions.reduce((sum, s) => {
    return sum + (parseFloat(s.estimatedProfit || '0') || 0);
  }, 0);
  
  const potentialSavings = pendingSuggestions.reduce((sum, s) => {
    return sum + (parseFloat(s.estimatedSavings || '0') || 0);
  }, 0);

  // Calculate success rate
  const totalProcessed = suggestions.filter(s => s.status === 'executed' || s.status === 'failed').length;
  const successRate = totalProcessed > 0 
    ? (executedSuggestions.length / totalProcessed) * 100 
    : 0;

  // Calculate average confidence of executed suggestions
  const avgConfidence = executedSuggestions.length > 0
    ? executedSuggestions.reduce((sum, s) => sum + parseFloat(s.confidence), 0) / executedSuggestions.length * 100
    : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChart className="h-5 w-5 text-purple-500" />
          Predicciones de Rendimiento
        </CardTitle>
        <CardDescription>
          Proyecciones basadas en datos históricos y sugerencias pendientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Potential Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Profit Potencial</span>
            </div>
            <p className="text-xl font-bold text-green-500">
              {formatCurrency(potentialProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Si apruebas todas las pendientes
            </p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Ahorro Potencial</span>
            </div>
            <p className="text-xl font-bold text-blue-500">
              {formatCurrency(potentialSavings)}
            </p>
            <p className="text-xs text-muted-foreground">
              En optimización de gasto
            </p>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tasa de Éxito</span>
            <span className="font-semibold">{successRate.toFixed(0)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confianza Promedio</span>
            <span className="font-semibold">{avgConfidence.toFixed(0)}%</span>
          </div>
          <Progress value={avgConfidence} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{pendingSuggestions.length}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{executedSuggestions.length}</p>
            <p className="text-xs text-muted-foreground">Ejecutadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{suggestions.filter(s => s.status === 'rejected').length}</p>
            <p className="text-xs text-muted-foreground">Rechazadas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Creative Analysis Panel
function CreativeAnalysisPanel({ suggestions }: { suggestions: Suggestion[] }) {
  // Group suggestions by creative-related actions
  const creativeSuggestions = suggestions.filter(s => 
    s.action === 'refresh_creative' || s.type === 'creative'
  );

  // Find top performing creatives (from scale_budget suggestions)
  const scaleSuggestions = suggestions.filter(s => 
    s.action === 'scale_budget' && s.status === 'pending'
  ).slice(0, 3);

  // Find underperforming creatives (from pause_ad suggestions)
  const pauseSuggestions = suggestions.filter(s => 
    s.action === 'pause_ad' && s.status === 'pending'
  ).slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="h-5 w-5 text-purple-500" />
          Análisis de Creativos
        </CardTitle>
        <CardDescription>
          Rendimiento y recomendaciones de creativos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Performers */}
        {scaleSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-green-500">
              <ThumbsUp className="h-4 w-4" />
              Creativos Top (Escalar)
            </h4>
            <div className="space-y-2">
              {scaleSuggestions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded bg-green-500/5 border border-green-500/10">
                  <span className="text-sm truncate max-w-[200px]">{s.targetName}</span>
                  <Badge variant="outline" className="text-green-500">
                    ROI {parseFloat(s.estimatedROI || '0').toFixed(0)}x
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Underperformers */}
        {pauseSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-red-500">
              <ThumbsDown className="h-4 w-4" />
              Creativos a Pausar
            </h4>
            <div className="space-y-2">
              {pauseSuggestions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                  <span className="text-sm truncate max-w-[200px]">{s.targetName}</span>
                  <Badge variant="outline" className="text-red-500">
                    Ahorro {((parseFloat(s.estimatedSavings || '0')) / 1000).toFixed(0)}K
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Suggestions */}
        {creativeSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-purple-500">
              <RefreshCw className="h-4 w-4" />
              Sugerencias de Refresh
            </h4>
            <p className="text-sm text-muted-foreground">
              {creativeSuggestions.length} creativos necesitan actualización
            </p>
          </div>
        )}

        {scaleSuggestions.length === 0 && pauseSuggestions.length === 0 && creativeSuggestions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay análisis de creativos disponible</p>
            <p className="text-xs">Ejecuta un análisis para ver recomendaciones</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AICopilot() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Queries
  const { data: pendingSuggestions, refetch: refetchPending, isLoading: loadingPending } = 
    trpc.aiCopilot.getPendingSuggestions.useQuery();
  
  const { data: allSuggestions, refetch: refetchAll, isLoading: loadingAll } = 
    trpc.aiCopilot.getAllSuggestions.useQuery({ status: 'all', limit: 100 });
  
  const { data: stats, refetch: refetchStats } = trpc.aiCopilot.getStats.useQuery();
  
  const { data: config, refetch: refetchConfig } = trpc.aiCopilot.getConfig.useQuery();

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
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ Acción ejecutada correctamente en Meta Ads", {
          description: "La sugerencia ha sido aprobada y la acción se ha ejecutado en tu cuenta de Meta Ads.",
          duration: 5000,
        });
      } else {
        toast.warning("⚠️ Acción aprobada pero requiere ejecución manual", {
          description: data.error || "La acción no pudo ejecutarse automáticamente. Por favor, realízala manualmente en Meta Ads Manager.",
          duration: 8000,
        });
      }
      setApprovingId(null);
      refetchPending();
      refetchAll();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`❌ Error al aprobar: ${error.message}`, {
        description: "Hubo un problema al procesar la sugerencia. Por favor, intenta de nuevo.",
        duration: 5000,
      });
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

  const saveConfigMutation = trpc.aiCopilot.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuración guardada correctamente");
      refetchConfig();
      setShowConfig(false);
    },
    onError: (error) => {
      toast.error(`Error al guardar: ${error.message}`);
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

  const handleSaveConfig = (data: Partial<ConfigData>) => {
    saveConfigMutation.mutate({
      promptMaestro: data.promptMaestro || undefined,
      maxCPR: data.maxCPR ? parseFloat(data.maxCPR) : undefined,
      minROI: data.minROI ? parseFloat(data.minROI) : undefined,
      autoApproveHighConfidence: data.autoApproveHighConfidence,
      autoApproveThreshold: data.autoApproveThreshold ? parseFloat(data.autoApproveThreshold) : undefined,
      analysisInterval: data.analysisInterval,
      emailNotifications: data.emailNotifications,
      highPriorityOnly: data.highPriorityOnly,
    });
  };

  const pendingCount = pendingSuggestions?.length || 0;
  const highPriorityCount = pendingSuggestions?.filter((s: Suggestion) => s.priority === 'high').length || 0;
  const autoModeActive = config?.autoApproveHighConfidence || false;
  const autoThreshold = parseFloat(config?.autoApproveThreshold || '0.95') * 100;

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
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">AI Co-Pilot</h1>
                  {autoModeActive && (
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                      <Bot className="h-3 w-3 mr-1" />
                      Auto Mode
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Optimización asistida por inteligencia artificial
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfig(true)}
              >
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suggestions Panel - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pendientes
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
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
                ) : !pendingSuggestions || pendingSuggestions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Sin sugerencias pendientes</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Todas las sugerencias han sido procesadas
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

                    {/* Auto Mode Banner */}
                    {autoModeActive && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 flex items-center gap-3">
                        <Bot className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-semibold text-purple-500">
                            Modo Automático Activo
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Las sugerencias con confianza ≥ {autoThreshold.toFixed(0)}% se marcan con badge "Auto"
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
                        autoModeActive={autoModeActive}
                        autoThreshold={autoThreshold}
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

          {/* Side Panels - Takes 1 column */}
          <div className="space-y-6">
            {/* Predictions Panel */}
            <PredictionsPanel suggestions={allSuggestions || []} />
            
            {/* Creative Analysis Panel */}
            <CreativeAnalysisPanel suggestions={allSuggestions || []} />
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <ConfigPanel
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        config={config as ConfigData | null}
        onSave={handleSaveConfig}
        isSaving={saveConfigMutation.isPending}
      />
    </div>
  );
}
