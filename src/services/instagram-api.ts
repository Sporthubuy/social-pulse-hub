// Instagram Graph API Service
// Uses the Instagram Business Account token directly

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Meta App ID
const META_APP_ID = '737036405756823';

// Access token from environment variable (stored securely)
const INSTAGRAM_ACCESS_TOKEN = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN || '';

// Function to get Instagram Business Account ID from the token
let cachedAccountId: string | null = null;

async function getInstagramAccountId(): Promise<string> {
  if (cachedAccountId) return cachedAccountId;
  
  try {
    // First get the Facebook pages connected to this token
    const pagesResponse = await fetch(
      `${GRAPH_API_BASE}/me/accounts?` +
      new URLSearchParams({
        access_token: INSTAGRAM_ACCESS_TOKEN,
      })
    );
    
    if (!pagesResponse.ok) {
      throw new Error('Failed to get Facebook pages');
    }
    
    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];
    
    if (pages.length === 0) {
      throw new Error('No Facebook pages found');
    }
    
    // Get Instagram Business Account connected to the first page
    const pageId = pages[0].id;
    const pageAccessToken = pages[0].access_token;
    
    const igResponse = await fetch(
      `${GRAPH_API_BASE}/${pageId}?` +
      new URLSearchParams({
        fields: 'instagram_business_account',
        access_token: pageAccessToken,
      })
    );
    
    if (!igResponse.ok) {
      throw new Error('Failed to get Instagram account');
    }
    
    const igData = await igResponse.json();
    
    if (!igData.instagram_business_account?.id) {
      throw new Error('No Instagram Business Account connected to this page');
    }
    
    cachedAccountId = igData.instagram_business_account.id;
    console.log('Instagram Business Account ID:', cachedAccountId);
    return cachedAccountId;
  } catch (error) {
    console.error('Error getting Instagram Account ID:', error);
    // Fallback to hardcoded ID if dynamic lookup fails
    return '17841480089330113';
  }
}

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
  const accountId = await getInstagramAccountId();
  const response = await fetch(
    `${GRAPH_API_BASE}/${accountId}?` +
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
  const accountId = await getInstagramAccountId();
  const response = await fetch(
    `${GRAPH_API_BASE}/${accountId}/media?` +
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
    const accountId = await getInstagramAccountId();
    const response = await fetch(
      `${GRAPH_API_BASE}/${accountId}/insights?` +
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
    // First check if we can get the account ID
    const accountId = await getInstagramAccountId();
    const response = await fetch(
      `${GRAPH_API_BASE}/${accountId}?` +
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
