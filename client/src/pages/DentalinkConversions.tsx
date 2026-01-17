import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react";
// Utility function
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function DentalinkConversionsPage() {
  // Últimos 30 días por defecto
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 30);

  const dateFromStr = dateFrom.toISOString().split("T")[0];
  const dateToStr = dateTo.toISOString().split("T")[0];

  const { data: credentials } = trpc.dentalink.getCredentials.useQuery();
  const { data: stats, isLoading, error } = trpc.dentalink.getConversionStats.useQuery(
    { dateFrom: dateFromStr, dateTo: dateToStr },
    { enabled: credentials?.configured === true }
  );

  if (!credentials?.configured) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Debes configurar tu cuenta de Dentalink primero.{" "}
            <a href="/dentalink-settings" className="underline font-medium">
              Ir a configuración
            </a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Error al cargar estadísticas: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const conversionRate = stats && stats.newPatients > 0 
    ? ((stats.appointmentsScheduled / stats.newPatients) * 100).toFixed(1)
    : "0.0";

  const treatmentRate = stats && stats.appointmentsScheduled > 0
    ? ((stats.treatmentsCompleted / stats.appointmentsScheduled) * 100).toFixed(1)
    : "0.0";

  const avgTreatmentValue = stats && stats.treatmentsCompleted > 0
    ? stats.totalRevenue / stats.treatmentsCompleted
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Conversiones</h1>
        <p className="text-muted-foreground">
          Rastreo completo desde Lead hasta Tratamiento Completado (últimos 30 días)
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pacientes Nuevos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Nuevos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              De {stats?.totalPatients || 0} pacientes totales
            </p>
          </CardContent>
        </Card>

        {/* Citas Agendadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointmentsScheduled || 0}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% de conversión
            </p>
          </CardContent>
        </Card>

        {/* Tratamientos Completados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos Completados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.treatmentsCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              {treatmentRate}% de las citas
            </p>
          </CardContent>
        </Card>

        {/* Revenue Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(avgTreatmentValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel de conversión */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Funnel de Conversión</CardTitle>
          <CardDescription>
            Visualización del recorrido desde Lead hasta Tratamiento Completado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Lead → Paciente */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Lead → Paciente</span>
                  <span className="text-sm text-muted-foreground">
                    {stats?.newPatients || 0} pacientes
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* Paciente → Cita */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Paciente → Cita Agendada</span>
                  <span className="text-sm text-muted-foreground">
                    {stats?.appointmentsScheduled || 0} citas ({conversionRate}%)
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${stats && stats.newPatients > 0 
                        ? (stats.appointmentsScheduled / stats.newPatients) * 100 
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cita → Tratamiento */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cita → Tratamiento Completado</span>
                  <span className="text-sm text-muted-foreground">
                    {stats?.treatmentsCompleted || 0} tratamientos ({treatmentRate}%)
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{
                      width: `${stats && stats.appointmentsScheduled > 0
                        ? (stats.treatmentsCompleted / stats.appointmentsScheduled) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de conversiones */}
      {stats?.conversions && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conversiones</CardTitle>
            <CardDescription>
              Distribución de leads por estado en el funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.conversions.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
