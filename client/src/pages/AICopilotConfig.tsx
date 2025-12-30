import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Settings,
  Brain,
  DollarSign,
  Target,
  Clock,
  Bell,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface Service {
  name: string;
  price: number;
  ltv: number;
  cprTarget: number;
  cprMax: number;
  roiMin: number;
  keywords: string[];
}

const DEFAULT_SERVICES: Service[] = [
  {
    name: 'All on Four',
    price: 1850000,
    ltv: 2220000,
    cprTarget: 33300,
    cprMax: 66600,
    roiMin: 5,
    keywords: ['all on four', 'all-on-4', 'allon4', 'protesis fija', 'dientes fijos']
  },
  {
    name: 'Estética Facial',
    price: 1500000,
    ltv: 1800000,
    cprTarget: 27000,
    cprMax: 54000,
    roiMin: 5,
    keywords: ['estetica facial', 'botox', 'rellenos', 'acido hialuronico', 'facial']
  },
  {
    name: 'Ortodoncia',
    price: 950000,
    ltv: 1140000,
    cprTarget: 17100,
    cprMax: 34200,
    roiMin: 5,
    keywords: ['ortodoncia', 'brackets', 'invisalign', 'alineadores', 'frenillos']
  },
  {
    name: 'Implante Dental',
    price: 850000,
    ltv: 1020000,
    cprTarget: 15300,
    cprMax: 30600,
    roiMin: 5,
    keywords: ['implante', 'implant', 'dental implant', 'titanio']
  },
  {
    name: 'Carillas',
    price: 320000,
    ltv: 384000,
    cprTarget: 5760,
    cprMax: 11520,
    roiMin: 5,
    keywords: ['carillas', 'carilla', 'veneer', 'sonrisa', 'diseño de sonrisa']
  },
  {
    name: 'Caries Incipiente',
    price: 180000,
    ltv: 216000,
    cprTarget: 3240,
    cprMax: 6480,
    roiMin: 5,
    keywords: ['caries', 'limpieza', 'profilaxis', 'blanqueamiento']
  }
];

const DEFAULT_PROMPT_MAESTRO = `# PROMPT MAESTRO - CLÍNICA MIRÓ

## OBJETIVO PRINCIPAL
Reducir CPR promedio de $35 a $15 manteniendo o aumentando el volumen de resultados.
Maximizar ROI por servicio según su valor (LTV).

## REGLAS GENERALES

### PRESUPUESTO
- Si CPR < CPR_TARGET y ROI > 8x → Escalar +50-70%
- Si CPR < CPR_TARGET y ROI > 5x → Escalar +30-50%
- Si CPR > CPR_MAX → Pausar inmediatamente
- Si CPR entre TARGET y MAX → Monitorear 48h antes de decidir

### FRECUENCIA
- Si frecuencia > 3.5 → Pausar o refresh creativo
- Si frecuencia > 2.5 → Preparar nuevo creativo
- Si frecuencia < 1.5 → Audiencia tiene potencial de escalar

### AUDIENCIAS
- Cold (prospecting): CPR objetivo = CPR_TARGET * 1.5
- Warm (engagement): CPR objetivo = CPR_TARGET
- Hot (retargeting): CPR objetivo = CPR_TARGET * 0.5
- Lookalike 1%: CPR objetivo = CPR_TARGET * 1.2
- Lookalike 3%: CPR objetivo = CPR_TARGET * 1.4

### HORARIOS
- Pausar anuncios entre 1am-6am (bajo engagement)
- Concentrar presupuesto en 8am-10am y 7pm-10pm

### CONSOLIDACIÓN
- Máximo 15 anuncios activos simultáneos
- Máximo 5 campañas activas
- Consolidar campañas con objetivos similares

## PRIORIDADES POR SERVICIO
1. All on Four (LTV $2.2M) - Máxima prioridad
2. Estética Facial (LTV $1.8M) - Alta prioridad
3. Ortodoncia (LTV $1.14M) - Media-alta prioridad
4. Implante Dental (LTV $1.02M) - Media prioridad
5. Carillas (LTV $384K) - Media-baja prioridad
6. Caries Incipiente (LTV $216K) - Baja prioridad

## RESTRICCIONES
- No pausar anuncios con menos de 3 días activos
- No escalar más de 70% en un solo día
- Mantener al menos 2 anuncios por servicio principal
- Reservar 20% del presupuesto para testing de nuevos creativos`;

export default function AICopilotConfig() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [promptMaestro, setPromptMaestro] = useState(DEFAULT_PROMPT_MAESTRO);
  const [config, setConfig] = useState({
    maxCPR: 50000,
    minROI: 5,
    maxFrequency: 3.5,
    maxDailySpend: 60000,
    autoApproveHighConfidence: false,
    autoApproveThreshold: 0.95,
    analysisInterval: 60,
    emailNotifications: true,
    highPriorityOnly: false,
  });

  const saveServicesMutation = trpc.aiCopilot.saveServices.useMutation({
    onSuccess: () => {
      toast.success('Servicios guardados correctamente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const saveConfigMutation = trpc.aiCopilot.saveConfig.useMutation({
    onSuccess: () => {
      toast.success('Configuración guardada correctamente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSaveServices = () => {
    saveServicesMutation.mutate(services);
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate({
      promptMaestro,
      ...config,
    });
  };

  const handleAddService = () => {
    setServices([...services, {
      name: 'Nuevo Servicio',
      price: 100000,
      ltv: 120000,
      cprTarget: 1800,
      cprMax: 3600,
      roiMin: 5,
      keywords: [],
    }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof Service, value: string | number | string[]) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CL')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation('/ai-copilot')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Configuración AI Co-Pilot</h1>
                <p className="text-muted-foreground">
                  Personaliza las reglas y parámetros de optimización
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="services" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="prompt" className="gap-2">
              <Brain className="h-4 w-4" />
              Prompt Maestro
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="gap-2">
              <Target className="h-4 w-4" />
              Umbrales
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Automatización
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Servicios y Precios</CardTitle>
                    <CardDescription>
                      Define los servicios de tu clínica con sus precios y umbrales de CPR
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAddService}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Servicio
                    </Button>
                    <Button onClick={handleSaveServices} disabled={saveServicesMutation.isPending}>
                      {saveServicesMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {services.map((service, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <Label>Nombre del Servicio</Label>
                            <Input
                              value={service.name}
                              onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                              placeholder="Ej: Implante Dental"
                            />
                          </div>
                          <div>
                            <Label>Precio (CLP)</Label>
                            <Input
                              type="number"
                              value={service.price}
                              onChange={(e) => handleServiceChange(index, 'price', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>LTV (CLP)</Label>
                            <Input
                              type="number"
                              value={service.ltv}
                              onChange={(e) => handleServiceChange(index, 'ltv', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>CPR Target</Label>
                            <Input
                              type="number"
                              value={service.cprTarget}
                              onChange={(e) => handleServiceChange(index, 'cprTarget', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>CPR Máximo</Label>
                            <Input
                              type="number"
                              value={service.cprMax}
                              onChange={(e) => handleServiceChange(index, 'cprMax', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <Label>Keywords (separadas por coma)</Label>
                            <Input
                              value={service.keywords.join(', ')}
                              onChange={(e) => handleServiceChange(index, 'keywords', e.target.value.split(',').map(k => k.trim()))}
                              placeholder="implante, dental, titanio"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveService(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          ROI Mínimo: {service.roiMin}x | 
                          CPR Target: {formatCurrency(service.cprTarget)} | 
                          CPR Máximo: {formatCurrency(service.cprMax)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompt Maestro Tab */}
          <TabsContent value="prompt">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Prompt Maestro
                    </CardTitle>
                    <CardDescription>
                      Define las reglas de negocio que guiarán las decisiones del AI Co-Pilot
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    {saveConfigMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">¿Qué es el Prompt Maestro?</p>
                      <p className="text-muted-foreground">
                        Es un documento que define todas las reglas de optimización. El AI Co-Pilot 
                        consultará estas reglas antes de generar cada sugerencia, asegurando que 
                        todas las decisiones estén alineadas con tus objetivos de negocio.
                      </p>
                    </div>
                  </div>
                </div>
                <Textarea
                  value={promptMaestro}
                  onChange={(e) => setPromptMaestro(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Define las reglas de optimización..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Umbrales Globales</CardTitle>
                    <CardDescription>
                      Define los límites máximos y mínimos para las métricas clave
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    {saveConfigMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>CPR Máximo Global (CLP)</Label>
                      <Input
                        type="number"
                        value={config.maxCPR}
                        onChange={(e) => setConfig({ ...config, maxCPR: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Anuncios con CPR mayor serán sugeridos para pausar
                      </p>
                    </div>
                    <div>
                      <Label>ROI Mínimo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={config.minROI}
                        onChange={(e) => setConfig({ ...config, minROI: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Anuncios con ROI menor serán sugeridos para optimizar
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Frecuencia Máxima</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={config.maxFrequency}
                        onChange={(e) => setConfig({ ...config, maxFrequency: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Anuncios con frecuencia mayor serán sugeridos para refresh
                      </p>
                    </div>
                    <div>
                      <Label>Gasto Diario Máximo (CLP)</Label>
                      <Input
                        type="number"
                        value={config.maxDailySpend}
                        onChange={(e) => setConfig({ ...config, maxDailySpend: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alertará si el gasto diario supera este límite
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Automatización</CardTitle>
                    <CardDescription>
                      Configura el comportamiento automático del AI Co-Pilot
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    {saveConfigMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Auto-approve */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <Label className="text-base">Auto-aprobar sugerencias de alta confianza</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ejecutar automáticamente sugerencias con confianza mayor al umbral
                      </p>
                    </div>
                    <Switch
                      checked={config.autoApproveHighConfidence}
                      onCheckedChange={(checked) => setConfig({ ...config, autoApproveHighConfidence: checked })}
                    />
                  </div>

                  {config.autoApproveHighConfidence && (
                    <div className="ml-6">
                      <Label>Umbral de confianza para auto-aprobar (%)</Label>
                      <Input
                        type="number"
                        min="80"
                        max="100"
                        value={config.autoApproveThreshold * 100}
                        onChange={(e) => setConfig({ ...config, autoApproveThreshold: (parseInt(e.target.value) || 95) / 100 })}
                        className="w-32"
                      />
                    </div>
                  )}

                  {/* Analysis interval */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <Label className="text-base">Intervalo de análisis</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cada cuántos minutos el AI Co-Pilot analiza las campañas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="15"
                        max="1440"
                        value={config.analysisInterval}
                        onChange={(e) => setConfig({ ...config, analysisInterval: parseInt(e.target.value) || 60 })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">minutos</span>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-yellow-500" />
                        <Label className="text-base">Notificaciones por email</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Recibir notificaciones de sugerencias críticas
                      </p>
                    </div>
                    <Switch
                      checked={config.emailNotifications}
                      onCheckedChange={(checked) => setConfig({ ...config, emailNotifications: checked })}
                    />
                  </div>

                  {/* High priority only */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <Label className="text-base">Solo alta prioridad</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mostrar solo sugerencias de alta prioridad
                      </p>
                    </div>
                    <Switch
                      checked={config.highPriorityOnly}
                      onCheckedChange={(checked) => setConfig({ ...config, highPriorityOnly: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
