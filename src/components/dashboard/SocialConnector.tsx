import { Instagram, Facebook, Link2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocialConnectorProps {
  platform: 'instagram' | 'facebook';
  isConnected: boolean;
  username?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

const platformConfig = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'from-pink-500 to-purple-600',
    bgLight: 'bg-pink-500/10',
    textColor: 'text-pink-500',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'from-blue-500 to-blue-700',
    bgLight: 'bg-blue-500/10',
    textColor: 'text-blue-500',
  },
};

export function SocialConnector({ 
  platform, 
  isConnected, 
  username, 
  onConnect, 
  onDisconnect 
}: SocialConnectorProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 transition-all",
      isConnected && "border-sport-success/30"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          `bg-gradient-to-br ${config.color}`
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{config.name}</h3>
            {isConnected && (
              <CheckCircle className="w-4 h-4 text-sport-success" />
            )}
          </div>
          {isConnected && username ? (
            <p className="text-sm text-muted-foreground truncate">@{username}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No conectado</p>
          )}
        </div>
        
        {isConnected ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDisconnect}
            className="shrink-0"
          >
            Desconectar
          </Button>
        ) : (
          <Button 
            variant="sport" 
            size="sm" 
            onClick={onConnect}
            className="shrink-0"
          >
            <Link2 className="w-4 h-4" />
            Conectar
          </Button>
        )}
      </div>
    </div>
  );
}
