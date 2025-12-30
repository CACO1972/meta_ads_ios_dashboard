import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  Globe,
  Zap,
  Play,
  ChevronRight,
  MapPin,
  Calendar,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";

// Platform icons
const MetaIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AICentral() {
  const [selectedService, setSelectedService] = useState<string>("");
  const [budget, setBudget] = useState<string>("500000");
  const [duration, setDuration] = useState<string>("30");
  const [activeTab, setActiveTab] = useState("strategy");
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);

  // Queries
  const { data: servicesData } = trpc.aiCentral.getServices.useQuery();
  const { data: dashboardStats } = trpc.aiCentral.getDashboardStats.useQuery();
  const { data: pendingCampaigns, refetch: refetchCampaigns } = trpc.aiCentral.getPendingCampaigns.useQuery();
  const { data: contentGuides, refetch: refetchGuides } = trpc.aiCentral.getContentGuides.useQuery({ status: 'all', type: 'all' });
  const { data: audienceInsights } = trpc.aiCentral.getAudienceInsights.useQuery({ platform: 'combined' });
  const { data: platformStatus } = trpc.aiCentral.getPlatformStatus.useQuery();

  // Mutations
  const generateStrategy = trpc.aiCentral.generateStrategy.useMutation({
    onSuccess: (data) => {
      setGeneratedStrategy(data.strategy);
      setShowStrategyDialog(true);
      refetchCampaigns();
      refetchGuides();
      toast.success("Estrategia generada exitosamente");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const approveCampaign = trpc.aiCentral.approveCampaign.useMutation({
    onSuccess: () => {
      refetchCampaigns();
      toast.success("Campaña aprobada");
    },
  });

  const rejectCampaign = trpc.aiCentral.rejectCampaign.useMutation({
    onSuccess: () => {
      refetchCampaigns();
      toast.info("Campaña rechazada");
    },
  });

  const handleGenerateStrategy = () => {
    if (!selectedService) {
      toast.error("Selecciona un servicio");
      return;
    }
    generateStrategy.mutate({
      serviceId: selectedService,
      totalBudget: Number(budget),
      durationDays: Number(duration),
    });
  };

  const selectedServiceData = servicesData?.services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-[#0d0d14]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">AI CENTRAL</h1>
                  <p className="text-xs text-gray-400">Estrategias Multi-Plataforma</p>
                </div>
              </div>
            </div>

            {/* Platform Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${platformStatus?.meta?.connected ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                  <MetaIcon />
                  <span>Meta</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${platformStatus?.tiktok?.connected ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-800 text-gray-500'}`}>
                  <TikTokIcon />
                  <span>TikTok</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${platformStatus?.google?.connected ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  <GoogleIcon />
                  <span>Google</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300">Servicios</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats?.services.total || 0}</p>
                  <p className="text-xs text-gray-400">{dashboardStats?.services.dental || 0} dental • {dashboardStats?.services.facial || 0} facial</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-cyan-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-300">Campañas</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats?.campaigns.total || 0}</p>
                  <p className="text-xs text-gray-400">{dashboardStats?.campaigns.pending || 0} pendientes</p>
                </div>
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900/40 to-pink-800/20 border-pink-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-pink-300">Contenido</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats?.content.total || 0}</p>
                  <p className="text-xs text-gray-400">{dashboardStats?.content.pending || 0} por producir</p>
                </div>
                <Video className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-300">Audiencia Top</p>
                  <p className="text-lg font-bold text-white">Mujeres 25-44</p>
                  <p className="text-xs text-gray-400">ABC1, Las Condes</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="strategy" className="data-[state=active]:bg-purple-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Estrategia
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-600">
              <Globe className="w-4 h-4 mr-2" />
              Campañas ({pendingCampaigns?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-pink-600">
              <Users className="w-4 h-4 mr-2" />
              Análisis de Públicos
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-green-600">
              <Video className="w-4 h-4 mr-2" />
              Guía de Producción
            </TabsTrigger>
          </TabsList>

          {/* Strategy Generator Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Service Selector */}
              <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Generador de Estrategias Globales
                  </CardTitle>
                  <CardDescription>
                    Selecciona un servicio y presupuesto para generar una estrategia multi-plataforma optimizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Tabs */}
                  <div className="space-y-4">
                    <Label>Categoría de Servicio</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {servicesData?.categories.map((cat) => (
                        <button
                          key={cat.id}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedServiceData?.category === (cat.id === 'odontologia' ? 'Odontología' : 'Estética Facial')
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                          onClick={() => setSelectedService("")}
                        >
                          <p className="font-semibold">{cat.name}</p>
                          <p className="text-sm text-gray-400">{cat.count} servicios</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Selector */}
                  <div className="space-y-2">
                    <Label>Servicio</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                        <div className="px-2 py-1 text-xs text-gray-400 font-semibold">Odontología</div>
                        {servicesData?.services.filter(s => s.category === 'Odontología').map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{service.name}</span>
                              <span className="text-gray-400 ml-2">${service.price.toLocaleString('es-CL')}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1 text-xs text-gray-400 font-semibold mt-2">Estética Facial</div>
                        {servicesData?.services.filter(s => s.category === 'Estética Facial').map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{service.name}</span>
                              <span className="text-gray-400 ml-2">${service.price.toLocaleString('es-CL')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget and Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Presupuesto Total (CLP)</Label>
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                        min={100000}
                        step={50000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duración (días)</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                        min={7}
                        max={90}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateStrategy}
                    disabled={!selectedService || generateStrategy.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {generateStrategy.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generar Estrategia Multi-Plataforma
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Service Preview */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Vista Previa del Servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedServiceData ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-bold">{selectedServiceData.name}</p>
                        <Badge variant="outline" className="mt-1">{selectedServiceData.category}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-gray-800 rounded">
                          <p className="text-gray-400">Precio</p>
                          <p className="font-semibold">${selectedServiceData.price.toLocaleString('es-CL')}</p>
                        </div>
                        <div className="p-2 bg-gray-800 rounded">
                          <p className="text-gray-400">LTV</p>
                          <p className="font-semibold">${selectedServiceData.ltv.toLocaleString('es-CL')}</p>
                        </div>
                        <div className="p-2 bg-gray-800 rounded">
                          <p className="text-gray-400">CPR Objetivo</p>
                          <p className="font-semibold text-green-400">${selectedServiceData.cprTarget.toLocaleString('es-CL')}</p>
                        </div>
                        <div className="p-2 bg-gray-800 rounded">
                          <p className="text-gray-400">CPR Máximo</p>
                          <p className="font-semibold text-red-400">${selectedServiceData.cprMax.toLocaleString('es-CL')}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Mejores Plataformas</p>
                        <div className="flex gap-2">
                          {selectedServiceData.bestPlatforms.map((platform) => (
                            <Badge key={platform} className={
                              platform === 'meta' ? 'bg-blue-500/20 text-blue-400' :
                              platform === 'tiktok' ? 'bg-pink-500/20 text-pink-400' :
                              'bg-green-500/20 text-green-400'
                            }>
                              {platform === 'meta' ? 'Meta' : platform === 'tiktok' ? 'TikTok' : 'Google'}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Audiencia Objetivo</p>
                        <p className="text-sm">
                          {selectedServiceData.targetAudience.ageMin}-{selectedServiceData.targetAudience.ageMax} años
                          {selectedServiceData.targetAudience.gender !== 'all' && `, ${selectedServiceData.targetAudience.gender === 'female' ? 'Mujeres' : 'Hombres'}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Selecciona un servicio para ver detalles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            {pendingCampaigns && pendingCampaigns.length > 0 ? (
              pendingCampaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{campaign.name}</h3>
                          <Badge className="bg-yellow-500/20 text-yellow-400">Pendiente</Badge>
                        </div>
                        <p className="text-sm text-gray-400">{campaign.objective}</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-sm">Total: ${campaign.totalBudget.toLocaleString('es-CL')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">{campaign.targetAgeMin}-{campaign.targetAgeMax} años</span>
                          </div>
                        </div>

                        {/* Budget Distribution */}
                        <div className="flex items-center gap-3 mt-3">
                          {campaign.metaBudget > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <MetaIcon />
                              <span>${campaign.metaBudget.toLocaleString('es-CL')}</span>
                            </div>
                          )}
                          {campaign.tiktokBudget > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <TikTokIcon />
                              <span>${campaign.tiktokBudget.toLocaleString('es-CL')}</span>
                            </div>
                          )}
                          {campaign.googleBudget > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <GoogleIcon />
                              <span>${campaign.googleBudget.toLocaleString('es-CL')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectCampaign.mutate({ campaignId: campaign.id })}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveCampaign.mutate({ campaignId: campaign.id })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="py-12 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No hay campañas pendientes de aprobación</p>
                  <p className="text-sm text-gray-500 mt-1">Genera una estrategia para crear nuevas campañas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Audience Analysis Tab */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demographics */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-400" />
                    Demografía
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Distribución por Edad</p>
                    {audienceInsights?.demographics.ageDistribution && Object.entries(audienceInsights.demographics.ageDistribution).map(([age, percentage]) => (
                      <div key={age} className="flex items-center gap-3 mb-2">
                        <span className="text-sm w-16">{age}</span>
                        <Progress value={percentage as number} className="flex-1 h-2" />
                        <span className="text-sm text-gray-400 w-10">{percentage}%</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-3">Género</p>
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-pink-500/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-pink-400">{audienceInsights?.demographics.genderDistribution.female}%</p>
                        <p className="text-sm text-gray-400">Mujeres</p>
                      </div>
                      <div className="flex-1 p-3 bg-blue-500/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-400">{audienceInsights?.demographics.genderDistribution.male}%</p>
                        <p className="text-sm text-gray-400">Hombres</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-3">Top Comunas</p>
                  {audienceInsights?.geographic.topLocations.map((loc) => (
                    <div key={loc.name} className="flex items-center gap-3 mb-2">
                      <span className="text-sm flex-1">{loc.name}</span>
                      <Progress value={loc.percentage} className="w-32 h-2" />
                      <span className="text-sm text-gray-400 w-10">{loc.percentage}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Socioeconomic */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    Nivel Socioeconómico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {audienceInsights?.socioeconomic.distribution && Object.entries(audienceInsights.socioeconomic.distribution).map(([level, percentage]) => (
                      <div key={level} className="p-3 bg-gray-800 rounded-lg text-center">
                        <p className="text-xl font-bold">{percentage}%</p>
                        <p className="text-xs text-gray-400">{level}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Best Segments */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    Mejores Segmentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {audienceInsights?.bestPerformingSegments.map((segment, i) => (
                    <div key={i} className="p-3 bg-gray-800 rounded-lg mb-2">
                      <p className="text-sm font-medium">{segment.segment}</p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-green-400">CPR: ${segment.cpr.toLocaleString('es-CL')}</span>
                        <span className="text-cyan-400">ROI: {segment.roi}x</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Production Tab */}
          <TabsContent value="content" className="space-y-4">
            {contentGuides && contentGuides.length > 0 ? (
              contentGuides.map((guide) => (
                <Card key={guide.id} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        guide.type === 'video' ? 'bg-pink-500/20' :
                        guide.type === 'testimonial' ? 'bg-green-500/20' :
                        guide.type === 'educational' ? 'bg-blue-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {guide.type === 'video' ? <Video className="w-6 h-6 text-pink-400" /> :
                         guide.type === 'testimonial' ? <Users className="w-6 h-6 text-green-400" /> :
                         guide.type === 'educational' ? <Lightbulb className="w-6 h-6 text-blue-400" /> :
                         <Camera className="w-6 h-6 text-purple-400" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{guide.title}</h3>
                          <Badge className={
                            guide.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            guide.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }>
                            {guide.priority === 'high' ? 'Alta' : guide.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          <Badge variant="outline" className={
                            guide.status === 'pending' ? 'border-gray-500 text-gray-400' :
                            guide.status === 'in_production' ? 'border-yellow-500 text-yellow-400' :
                            guide.status === 'completed' ? 'border-green-500 text-green-400' :
                            'border-blue-500 text-blue-400'
                          }>
                            {guide.status === 'pending' ? 'Pendiente' :
                             guide.status === 'in_production' ? 'En Producción' :
                             guide.status === 'completed' ? 'Completado' : 'Publicado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{guide.description}</p>
                        
                        {guide.estimatedDuration && (
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {guide.estimatedDuration}s
                            </span>
                          </div>
                        )}

                        {guide.script && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="mt-3">
                                <FileText className="w-4 h-4 mr-1" />
                                Ver Guión
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
                              <DialogHeader>
                                <DialogTitle>{guide.title}</DialogTitle>
                                <DialogDescription>Guión de producción</DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <pre className="text-sm whitespace-pre-wrap p-4 bg-gray-800 rounded-lg">
                                  {guide.script}
                                </pre>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="py-12 text-center">
                  <Video className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No hay guías de contenido</p>
                  <p className="text-sm text-gray-500 mt-1">Genera una estrategia para crear guías de producción</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Strategy Result Dialog */}
      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Estrategia Generada
            </DialogTitle>
            <DialogDescription>
              {generatedStrategy?.name}
            </DialogDescription>
          </DialogHeader>
          
          {generatedStrategy && (
            <div className="space-y-6">
              {/* Expected Results */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {generatedStrategy.expectedResults.totalConversions}
                  </p>
                  <p className="text-sm text-gray-400">Conversiones Est.</p>
                </div>
                <div className="p-4 bg-cyan-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-cyan-400">
                    ${generatedStrategy.expectedResults.averageCPR.toLocaleString('es-CL')}
                  </p>
                  <p className="text-sm text-gray-400">CPR Promedio</p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {generatedStrategy.expectedResults.expectedROI.toFixed(1)}x
                  </p>
                  <p className="text-sm text-gray-400">ROI Esperado</p>
                </div>
              </div>

              {/* Platform Distribution */}
              <div>
                <h4 className="font-semibold mb-3">Distribución por Plataforma</h4>
                <div className="space-y-3">
                  {generatedStrategy.platforms.map((platform: any) => (
                    <div key={platform.platform} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {platform.platform === 'meta' ? <MetaIcon /> :
                           platform.platform === 'tiktok' ? <TikTokIcon /> :
                           <GoogleIcon />}
                          <span className="font-medium capitalize">{platform.platform}</span>
                        </div>
                        <span className="text-green-400">${platform.budgetAllocation.toLocaleString('es-CL')}</span>
                      </div>
                      <p className="text-sm text-gray-400">{platform.objective}</p>
                      <div className="flex gap-2 mt-2">
                        {platform.adFormats.map((format: string) => (
                          <Badge key={format} variant="outline" className="text-xs">{format}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Reasoning */}
              <div>
                <h4 className="font-semibold mb-3">Razonamiento de la Estrategia</h4>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap text-gray-300">
                    {generatedStrategy.reasoning}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStrategyDialog(false)}>
                  Cerrar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ver en Campañas Pendientes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
