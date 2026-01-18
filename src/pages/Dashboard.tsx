import { Users, Heart, MessageCircle, Eye, Instagram, Facebook, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SocialConnector } from '@/components/dashboard/SocialConnector';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useSocialConnections } from '@/hooks/use-social-connections';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Mock activities - these would come from real API in production
const mockActivities = [
  {
    id: '1',
    type: 'like' as const,
    message: 'Tu publicación recibió 150 likes nuevos',
    time: 'Hace 5 minutos',
    platform: 'instagram' as const,
  },
  {
    id: '2',
    type: 'follow' as const,
    message: '25 nuevos seguidores esta semana',
    time: 'Hace 1 hora',
    platform: 'facebook' as const,
  },
  {
    id: '3',
    type: 'comment' as const,
    message: 'Nuevo comentario en "Entrenamiento de hoy"',
    time: 'Hace 2 horas',
    platform: 'instagram' as const,
  },
  {
    id: '4',
    type: 'share' as const,
    message: 'Tu video fue compartido 12 veces',
    time: 'Hace 3 horas',
    platform: 'facebook' as const,
  },
];

export default function Dashboard() {
  const { connections, socialData, isLoading, connect, disconnect, refreshData } = useSocialConnections();
  const { toast } = useToast();

  const handleConnect = (platform: 'instagram' | 'facebook') => {
    toast({
      title: 'Conectando...',
      description: `Redirigiendo a Meta para autorizar ${platform === 'instagram' ? 'Instagram' : 'Facebook'}`,
    });
    connect(platform);
  };

  const handleDisconnect = (platform: 'instagram' | 'facebook') => {
    disconnect(platform);
    toast({
      title: 'Desconectado',
      description: `Tu cuenta de ${platform === 'instagram' ? 'Instagram' : 'Facebook'} ha sido desconectada`,
    });
  };

  const handleRefresh = async () => {
    toast({
      title: 'Actualizando...',
      description: 'Obteniendo datos más recientes',
    });

    if (connections.instagram.isConnected) {
      await refreshData('instagram');
    }
    if (connections.facebook.isConnected) {
      await refreshData('facebook');
    }

    toast({
      title: 'Actualizado',
      description: 'Los datos han sido actualizados',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Calculate combined metrics from connected platforms
  const combinedMetrics = {
    totalFollowers:
      (socialData.instagram.metrics?.followers || 0) +
      (socialData.facebook.metrics?.followers || 0),
    totalLikes:
      (socialData.instagram.metrics?.likes || 0) +
      (socialData.facebook.metrics?.likes || 0),
    totalComments:
      (socialData.instagram.metrics?.comments || 0) +
      (socialData.facebook.metrics?.comments || 0),
    totalReach:
      (socialData.instagram.metrics?.reach || 0) +
      (socialData.facebook.metrics?.reach || 0),
  };

  const hasConnectedAccounts = connections.instagram.isConnected || connections.facebook.isConnected;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Resumen de tus redes sociales
            </p>
          </div>
          {hasConnectedAccounts && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          )}
        </div>

        {/* Social Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SocialConnector
            platform="instagram"
            isConnected={connections.instagram.isConnected}
            username={connections.instagram.username}
            onConnect={() => handleConnect('instagram')}
            onDisconnect={() => handleDisconnect('instagram')}
          />
          <SocialConnector
            platform="facebook"
            isConnected={connections.facebook.isConnected}
            username={connections.facebook.username}
            onConnect={() => handleConnect('facebook')}
            onDisconnect={() => handleDisconnect('facebook')}
          />
        </div>

        {/* Info message if no accounts connected */}
        {!hasConnectedAccounts && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Conecta tus cuentas para ver tus métricas
            </h3>
            <p className="text-muted-foreground text-sm">
              Conecta tu cuenta de Instagram Business o Facebook Page para empezar a ver tus estadísticas en tiempo real.
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Seguidores"
            value={hasConnectedAccounts ? formatNumber(combinedMetrics.totalFollowers) : '-'}
            change={hasConnectedAccounts ? 0 : undefined}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Likes"
            value={hasConnectedAccounts ? formatNumber(combinedMetrics.totalLikes) : '-'}
            change={hasConnectedAccounts ? 0 : undefined}
            icon={<Heart className="w-5 h-5" />}
          />
          <MetricCard
            title="Comentarios"
            value={hasConnectedAccounts ? formatNumber(combinedMetrics.totalComments) : '-'}
            change={hasConnectedAccounts ? 0 : undefined}
            icon={<MessageCircle className="w-5 h-5" />}
          />
          <MetricCard
            title="Alcance"
            value={hasConnectedAccounts ? formatNumber(combinedMetrics.totalReach) : '-'}
            change={hasConnectedAccounts ? 0 : undefined}
            icon={<Eye className="w-5 h-5" />}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity activities={mockActivities} />
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                Por Plataforma
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Instagram</p>
                    <p className="text-xs text-muted-foreground">
                      {connections.instagram.isConnected
                        ? `${formatNumber(socialData.instagram.metrics?.followers || 0)} seguidores`
                        : 'No conectado'}
                    </p>
                  </div>
                  {connections.instagram.isConnected && (
                    <span className="text-sm font-semibold text-sport-success">Conectado</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Facebook</p>
                    <p className="text-xs text-muted-foreground">
                      {connections.facebook.isConnected
                        ? `${formatNumber(socialData.facebook.metrics?.followers || 0)} seguidores`
                        : 'No conectado'}
                    </p>
                  </div>
                  {connections.facebook.isConnected && (
                    <span className="text-sm font-semibold text-sport-success">Conectado</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5">
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                Tip del dia
              </h3>
              <p className="text-sm text-muted-foreground">
                {!hasConnectedAccounts
                  ? 'Conecta tu cuenta de Instagram Business o Facebook Page para empezar a ver tus métricas reales.'
                  : 'Los posts con videos tienen 38% más engagement. Considera agregar más contenido en video.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
