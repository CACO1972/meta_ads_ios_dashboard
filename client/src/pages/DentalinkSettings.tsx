import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function DentalinkSettingsPage() {
  const [apiToken, setApiToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: credentials, refetch: refetchCredentials } = trpc.dentalink.getCredentials.useQuery();
  const setCredentialsMutation = trpc.dentalink.setCredentials.useMutation();
  const syncPatientsMutation = trpc.dentalink.syncPatients.useMutation();

  const handleSaveCredentials = async () => {
    if (!apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor ingresa tu API Token" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await setCredentialsMutation.mutateAsync({ apiToken: apiToken.trim() });
      setMessage({ type: "success", text: "Credenciales guardadas exitosamente" });
      setApiToken("");
      refetchCredentials();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al guardar credenciales" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncPatients = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await syncPatientsMutation.mutateAsync({});
      setMessage({
        type: "success",
        text: `Sincronización completada: ${result.synced} nuevos, ${result.updated} actualizados`,
      });
      refetchCredentials();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al sincronizar pacientes" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración de Dentalink</h1>
        <p className="text-muted-foreground">
          Conecta tu cuenta de Dentalink para sincronizar pacientes y rastrear conversiones desde Meta Ads
        </p>
      </div>

      {/* Estado de conexión */}
      {credentials && credentials.configured && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Conectado a Dentalink
            {credentials.lastSyncAt && (
              <span className="ml-2 text-sm text-green-600">
                Última sincronización: {new Date(credentials.lastSyncAt).toLocaleString("es-CL")}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Mensajes de feedback */}
      {message && (
        <Alert className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Configurar credenciales */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Token de Dentalink</CardTitle>
          <CardDescription>
            Ingresa tu token de acceso de Dentalink. Puedes generarlo en la plataforma de Dentalink en
            Administrador → Configuración API → +Agregar cliente → Ver Token → Generar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Ingresa tu token de Dentalink"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button onClick={handleSaveCredentials} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Credenciales
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sincronización manual */}
      {credentials && credentials.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Sincronización de Pacientes</CardTitle>
            <CardDescription>
              Sincroniza manualmente los pacientes desde Dentalink. La sincronización automática se ejecuta cada hora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSyncPatients} disabled={isSubmitting} variant="outline">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronizar Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>¿Cómo obtener tu API Token?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Inicia sesión en tu cuenta de Dentalink</li>
            <li>Haz clic en tu nombre de usuario (esquina superior derecha)</li>
            <li>Selecciona "Configuración API"</li>
            <li>Haz clic en "+Agregar cliente"</li>
            <li>Ingresa un nombre para la aplicación (ej: "Meta Ads Dashboard")</li>
            <li>Haz clic en "Crear"</li>
            <li>Haz clic en "Ver Token" y luego en "Generar"</li>
            <li>Copia el token generado y pégalo arriba</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El token de Dentalink tiene todos los permisos por defecto. Asegúrate de
              configurar los permisos específicos en la plataforma de Dentalink si deseas restringir el acceso.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
