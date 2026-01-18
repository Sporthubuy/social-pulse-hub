import { Heart, MessageCircle, UserPlus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share';
  message: string;
  time: string;
  platform: 'instagram' | 'facebook';
}

const activityIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  share: Share2,
};

const activityColors = {
  like: 'text-pink-500 bg-pink-500/10',
  comment: 'text-blue-500 bg-blue-500/10',
  follow: 'text-sport-success bg-sport-success/10',
  share: 'text-primary bg-primary/10',
};

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Actividad Reciente
        </h2>
      </div>
      
      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div 
                key={activity.id} 
                className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  colorClass
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
