/**
 * Reports Page
 * 
 * Visual dashboard for analyzing Meta Ads campaign performance
 * with downloadable reports
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, DollarSign, Target, MousePointerClick, BarChart3 } from "lucide-react";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to format percentage
const formatPercentage = (value: number, decimals: number = 2) => {
  return `${value.toFixed(decimals)}%`;
};

// Helper to format number
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-CL').format(value);
};

// Helper to get date range
const getDateRange = (period: string): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export default function ReportsPage() {
  const [period, setPeriod] = useState('30d');
  const [sortBy, setSortBy] = useState<'spend' | 'cpr' | 'results' | 'ctr'>('spend');
  
  const dateRange = useMemo(() => getDateRange(period), [period]);
  
  // Fetch summary report
  const { data: summary, isLoading: summaryLoading } = trpc.reports.getSummary.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  
  // Fetch campaign details
  const { data: campaigns, isLoading: campaignsLoading } = trpc.reports.getCampaignDetails.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    sortBy,
    sortOrder: 'desc',
  });
  
  const isLoading = summaryLoading || campaignsLoading;
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reportes de Campañas</h1>
            <p className="text-muted-foreground mt-1">
              Análisis detallado de rendimiento de Meta Ads
            </p>
          </div>
          
          <div className="flex gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando datos de campañas...</p>
            </div>
          </div>
        )}
        
        {/* Summary Cards */}
        {!isLoading && summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Spend */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(summary.totals.totalSpend)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.totals.activeCampaigns} de {summary.totals.campaigns} campañas activas
                  </p>
                </CardContent>
              </Card>
              
              {/* Average CPR */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPR Promedio</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(summary.averages.avgCPR)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(summary.totals.totalResults)} resultados totales
                  </p>
                </CardContent>
              </Card>
              
              {/* Average CTR */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CTR Promedio</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(summary.averages.avgCTR)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(summary.totals.totalClicks)} clics totales
                  </p>
                </CardContent>
              </Card>
              
              {/* Total Impressions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impresiones</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(summary.totals.totalImpressions)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alcance: {formatNumber(summary.totals.totalReach)}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Mejor Rendimiento
                  </CardTitle>
                  <CardDescription>Campaña con menor CPR</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topPerformers.bestCPR ? (
                    <div>
                      <p className="font-semibold">{summary.topPerformers.bestCPR.name}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-muted-foreground">CPR:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(summary.topPerformers.bestCPR.cpr)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-muted-foreground">Resultados:</span>
                        <span>{formatNumber(summary.topPerformers.bestCPR.results)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Requiere Atención
                  </CardTitle>
                  <CardDescription>Campaña con mayor CPR</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topPerformers.worstCPR ? (
                    <div>
                      <p className="font-semibold">{summary.topPerformers.worstCPR.name}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-muted-foreground">CPR:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(summary.topPerformers.worstCPR.cpr)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-muted-foreground">Resultados:</span>
                        <span>{formatNumber(summary.topPerformers.worstCPR.results)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Campaign Details Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Detalle de Campañas</CardTitle>
                    <CardDescription>Rendimiento individual por campaña</CardDescription>
                  </div>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spend">Ordenar por Gasto</SelectItem>
                      <SelectItem value="cpr">Ordenar por CPR</SelectItem>
                      <SelectItem value="results">Ordenar por Resultados</SelectItem>
                      <SelectItem value="ctr">Ordenar por CTR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {campaigns && campaigns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaña</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Gasto</TableHead>
                        <TableHead className="text-right">CPR</TableHead>
                        <TableHead className="text-right">Resultados</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {campaign.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(campaign.cpr)}</TableCell>
                          <TableCell className="text-right">{formatNumber(campaign.results)}</TableCell>
                          <TableCell className="text-right">{formatPercentage(campaign.ctr)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay campañas en este período
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
