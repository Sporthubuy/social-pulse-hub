import { useState } from 'react';
import { Users, Heart, MessageCircle, Eye, Instagram, Facebook } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SocialConnector } from '@/components/dashboard/SocialConnector';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useToast } from '@/hooks/use-toast';

// Mock data - replace with real data from Meta API
const mockMetrics = {
  totalFollowers: 15420,
  followersChange: 12.5,
  totalLikes: 45890,
  likesChange: 8.2,
  totalComments: 3240,
  commentsChange: -2.1,
  totalReach: 125000,
  reachChange: 15.8,
};

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
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: false,
    facebook: false,
  });
  const { toast } = useToast();

  const handleConnect = (platform: 'instagram' | 'facebook') => {
    // Mock connection - replace with Meta OAuth flow
    toast({
      title: 'Conectando...',
      description: `Redirigiendo a ${platform === 'instagram' ? 'Instagram' : 'Facebook'} para autorizar`,
    });
    
    // Simulate successful connection after delay
    setTimeout(() => {
      setConnectedAccounts(prev => ({ ...prev, [platform]: true }));
      toast({
        title: '¡Conectado!',
        description: `Tu cuenta de ${platform === 'instagram' ? 'Instagram' : 'Facebook'} ha sido conectada`,
      });
    }, 1500);
  };

  const handleDisconnect = (platform: 'instagram' | 'facebook') => {
    setConnectedAccounts(prev => ({ ...prev, [platform]: false }));
    toast({
      title: 'Desconectado',
      description: `Tu cuenta de ${platform === 'instagram' ? 'Instagram' : 'Facebook'} ha sido desconectada`,
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
        </div>

        {/* Social Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SocialConnector
            platform="instagram"
            isConnected={connectedAccounts.instagram}
            username={connectedAccounts.instagram ? 'sporthub_oficial' : undefined}
            onConnect={() => handleConnect('instagram')}
            onDisconnect={() => handleDisconnect('instagram')}
          />
          <SocialConnector
            platform="facebook"
            isConnected={connectedAccounts.facebook}
            username={connectedAccounts.facebook ? 'SportHub' : undefined}
            onConnect={() => handleConnect('facebook')}
            onDisconnect={() => handleDisconnect('facebook')}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Seguidores"
            value={formatNumber(mockMetrics.totalFollowers)}
            change={mockMetrics.followersChange}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Likes"
            value={formatNumber(mockMetrics.totalLikes)}
            change={mockMetrics.likesChange}
            icon={<Heart className="w-5 h-5" />}
          />
          <MetricCard
            title="Comentarios"
            value={formatNumber(mockMetrics.totalComments)}
            change={mockMetrics.commentsChange}
            icon={<MessageCircle className="w-5 h-5" />}
          />
          <MetricCard
            title="Alcance"
            value={formatNumber(mockMetrics.totalReach)}
            change={mockMetrics.reachChange}
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
                    <p className="text-xs text-muted-foreground">8.5K seguidores</p>
                  </div>
                  <span className="text-sm font-semibold text-sport-success">+5.2%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Facebook</p>
                    <p className="text-xs text-muted-foreground">6.9K seguidores</p>
                  </div>
                  <span className="text-sm font-semibold text-sport-success">+3.8%</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5">
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                💡 Tip del día
              </h3>
              <p className="text-sm text-muted-foreground">
                Los posts con videos tienen 38% más engagement. ¡Considera agregar más contenido en video!
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
