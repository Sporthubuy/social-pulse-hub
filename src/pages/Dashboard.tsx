import { useState, useEffect } from 'react';
import { Users, Heart, MessageCircle, Eye, Instagram, Facebook, RefreshCw, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  fetchInstagramMetrics,
  type InstagramMetrics,
} from '@/services/instagram-api';

export default function Dashboard() {
  const [instagramData, setInstagramData] = useState<InstagramMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInstagramMetrics();
      setInstagramData(data);
      toast({
        title: 'Datos cargados',
        description: `@${data.profile.username} - ${data.profile.followers_count} seguidores`,
      });
    } catch (err) {
      console.error('Error loading Instagram data:', err);
      setError('No se pudieron cargar los datos de Instagram');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de Instagram',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    toast({
      title: 'Actualizando...',
      description: 'Obteniendo datos de Instagram',
    });
    loadData();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('es-AR');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Redes Sociales
            </h1>
            <p className="text-muted-foreground mt-1">
              Métricas de Instagram - @{instagramData?.profile.username || 'sporthubuy'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Profile Card */}
        {instagramData && (
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-4">
              {instagramData.profile.profile_picture_url && (
                <img
                  src={instagramData.profile.profile_picture_url}
                  alt={instagramData.profile.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    @{instagramData.profile.username}
                  </h2>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Instagram className="w-3 h-3 text-white" />
                  </div>
                </div>
                {instagramData.profile.biography && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {instagramData.profile.biography}
                  </p>
                )}
              </div>
              <a
                href={`https://instagram.com/${instagramData.profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
              Reintentar
            </Button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Seguidores"
            value={instagramData ? formatNumber(instagramData.profile.followers_count) : '-'}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Siguiendo"
            value={instagramData ? formatNumber(instagramData.profile.follows_count) : '-'}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Publicaciones"
            value={instagramData ? formatNumber(instagramData.profile.media_count) : '-'}
            icon={<Instagram className="w-5 h-5" />}
          />
          <MetricCard
            title="Engagement"
            value={instagramData ? `${instagramData.avgEngagement.toFixed(2)}%` : '-'}
            icon={<Heart className="w-5 h-5" />}
          />
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Total Likes (últimos posts)"
            value={instagramData ? formatNumber(instagramData.totalLikes) : '-'}
            icon={<Heart className="w-5 h-5 text-red-500" />}
          />
          <MetricCard
            title="Total Comentarios"
            value={instagramData ? formatNumber(instagramData.totalComments) : '-'}
            icon={<MessageCircle className="w-5 h-5 text-blue-500" />}
          />
          <MetricCard
            title="Interacciones Totales"
            value={instagramData ? formatNumber(instagramData.totalLikes + instagramData.totalComments) : '-'}
            icon={<Eye className="w-5 h-5 text-purple-500" />}
          />
        </div>

        {/* Recent Posts */}
        {instagramData && instagramData.recentMedia.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Publicaciones Recientes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {instagramData.recentMedia.slice(0, 10).map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                    alt={post.caption?.substring(0, 50) || 'Post'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {formatNumber(post.like_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {formatNumber(post.comments_count)}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">{formatDate(post.timestamp)}</p>
                    </div>
                  </div>
                  {post.media_type === 'VIDEO' && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded px-1.5 py-0.5 text-white text-xs">
                      Video
                    </div>
                  )}
                  {post.media_type === 'CAROUSEL_ALBUM' && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded px-1.5 py-0.5 text-white text-xs">
                      Album
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Top Posts Table */}
        {instagramData && instagramData.recentMedia.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Rendimiento de Posts
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Caption</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Likes</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Comentarios</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {instagramData.recentMedia
                    .sort((a, b) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count))
                    .slice(0, 10)
                    .map((post) => {
                      const engagement = ((post.like_count + post.comments_count) / instagramData.profile.followers_count) * 100;
                      return (
                        <tr key={post.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(post.timestamp)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              post.media_type === 'VIDEO'
                                ? 'bg-purple-500/20 text-purple-500'
                                : post.media_type === 'CAROUSEL_ALBUM'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-pink-500/20 text-pink-500'
                            }`}>
                              {post.media_type === 'VIDEO' ? 'Video' : post.media_type === 'CAROUSEL_ALBUM' ? 'Album' : 'Imagen'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary"
                            >
                              {post.caption?.substring(0, 50) || 'Sin caption'}
                              {post.caption && post.caption.length > 50 ? '...' : ''}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-red-500">
                            {formatNumber(post.like_count)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-blue-500">
                            {formatNumber(post.comments_count)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-green-500">
                            {engagement.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Facebook placeholder */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Facebook
              </h3>
              <p className="text-sm text-muted-foreground">
                Próximamente - Conecta tu página de Facebook
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
