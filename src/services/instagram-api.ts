// Instagram Graph API Service
// Uses the Instagram Business Account token directly

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Instagram Business Account ID (sporthubuy)
const INSTAGRAM_ACCOUNT_ID = '17841480089330113';

// Access token from Meta Developer Console
// In production, this should be stored securely and refreshed before expiration
const INSTAGRAM_ACCESS_TOKEN = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN || 'IGAAKeVKkm05dBZAGFsSkRiRGljUEUxd0MyS1dPaldQN0JJdGJHVjItRl9oQWZAlMk1xeWRpX1pTN29DQmVnTlRNZAEdsYkVfZA2k3Q08xZA2JfeUNHcGlISzZAGNkxIaEQzTHNwVVVEMkxLTHBBVkpHMlZAuMjNjNXdsbjFDMFhtTTJBbwZDZD';

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography?: string;
  website?: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  profile_views: number;
  accounts_engaged: number;
  total_interactions: number;
}

export interface InstagramMetrics {
  profile: InstagramProfile;
  recentMedia: InstagramMedia[];
  totalLikes: number;
  totalComments: number;
  avgEngagement: number;
}

// Fetch Instagram profile data
export async function fetchInstagramProfile(): Promise<InstagramProfile> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${INSTAGRAM_ACCOUNT_ID}?` +
    new URLSearchParams({
      fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website',
      access_token: INSTAGRAM_ACCESS_TOKEN,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Instagram API error:', error);
    throw new Error(error.error?.message || 'Failed to fetch Instagram profile');
  }

  return response.json();
}

// Fetch recent media posts
export async function fetchInstagramMedia(limit: number = 25): Promise<InstagramMedia[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${INSTAGRAM_ACCOUNT_ID}/media?` +
    new URLSearchParams({
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit: limit.toString(),
      access_token: INSTAGRAM_ACCESS_TOKEN,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Instagram media error:', error);
    throw new Error(error.error?.message || 'Failed to fetch Instagram media');
  }

  const data = await response.json();
  return data.data || [];
}

// Fetch account insights (requires instagram_manage_insights permission)
export async function fetchInstagramInsights(): Promise<InstagramInsights> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${INSTAGRAM_ACCOUNT_ID}/insights?` +
      new URLSearchParams({
        metric: 'impressions,reach,profile_views,accounts_engaged,total_interactions',
        period: 'day',
        metric_type: 'total_value',
        access_token: INSTAGRAM_ACCESS_TOKEN,
      })
    );

    if (!response.ok) {
      // Insights might not be available for all accounts
      console.warn('Instagram insights not available');
      return {
        impressions: 0,
        reach: 0,
        profile_views: 0,
        accounts_engaged: 0,
        total_interactions: 0,
      };
    }

    const data = await response.json();
    const insights: InstagramInsights = {
      impressions: 0,
      reach: 0,
      profile_views: 0,
      accounts_engaged: 0,
      total_interactions: 0,
    };

    data.data?.forEach((metric: { name: string; total_value?: { value: number }; values?: { value: number }[] }) => {
      const value = metric.total_value?.value || metric.values?.[0]?.value || 0;
      if (metric.name in insights) {
        insights[metric.name as keyof InstagramInsights] = value;
      }
    });

    return insights;
  } catch (error) {
    console.warn('Error fetching Instagram insights:', error);
    return {
      impressions: 0,
      reach: 0,
      profile_views: 0,
      accounts_engaged: 0,
      total_interactions: 0,
    };
  }
}

// Fetch all Instagram metrics
export async function fetchInstagramMetrics(): Promise<InstagramMetrics> {
  const [profile, recentMedia] = await Promise.all([
    fetchInstagramProfile(),
    fetchInstagramMedia(25),
  ]);

  // Calculate totals from recent media
  const totalLikes = recentMedia.reduce((sum, post) => sum + (post.like_count || 0), 0);
  const totalComments = recentMedia.reduce((sum, post) => sum + (post.comments_count || 0), 0);

  // Calculate average engagement rate
  const totalEngagement = totalLikes + totalComments;
  const avgEngagement = recentMedia.length > 0
    ? (totalEngagement / recentMedia.length / profile.followers_count) * 100
    : 0;

  return {
    profile,
    recentMedia,
    totalLikes,
    totalComments,
    avgEngagement,
  };
}

// Check if the token is valid
export async function validateInstagramToken(): Promise<boolean> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${INSTAGRAM_ACCOUNT_ID}?` +
      new URLSearchParams({
        fields: 'id',
        access_token: INSTAGRAM_ACCESS_TOKEN,
      })
    );
    return response.ok;
  } catch {
    return false;
  }
}
