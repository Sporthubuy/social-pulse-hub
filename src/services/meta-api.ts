// Meta Graph API Service
// Handles Facebook and Instagram API calls

const META_APP_ID = import.meta.env.VITE_META_APP_ID;
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Permissions needed for our app
const PERMISSIONS = [
  'public_profile',
  'email',
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'instagram_basic',
  'instagram_manage_insights',
  'business_management',
].join(',');

export interface MetaAuthResponse {
  accessToken: string;
  userID: string;
  expiresIn: number;
  signedRequest?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

export interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  profile_views: number;
  follower_count: number;
}

export interface FacebookPageInsights {
  page_impressions: number;
  page_engaged_users: number;
  page_fans: number;
}

export interface SocialMetrics {
  followers: number;
  followersChange?: number;
  likes: number;
  likesChange?: number;
  comments: number;
  commentsChange?: number;
  reach: number;
  reachChange?: number;
}

// Generate OAuth URL for Meta Login
export function getMetaOAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: redirectUri,
    scope: PERMISSIONS,
    response_type: 'code',
    state: state || crypto.randomUUID(),
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

// Exchange authorization code for access token (should be done server-side in production)
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  // NOTE: In production, this should be done on your backend
  // The app secret should NEVER be exposed to the frontend
  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
    new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: redirectUri,
      code: code,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to exchange code for token');
  }

  return response.json();
}

// Get long-lived access token (valid for 60 days)
export async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: META_APP_ID,
      fb_exchange_token: shortLivedToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get long-lived token');
  }

  const data = await response.json();
  return data.access_token;
}

// Get user's Facebook pages
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?` +
    new URLSearchParams({
      fields: 'id,name,access_token,instagram_business_account',
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get Facebook pages');
  }

  const data = await response.json();
  return data.data || [];
}

// Get Instagram Business Account info
export async function getInstagramAccount(
  igUserId: string,
  accessToken: string
): Promise<InstagramAccount> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${igUserId}?` +
    new URLSearchParams({
      fields: 'id,username,profile_picture_url,followers_count,follows_count,media_count',
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get Instagram account');
  }

  return response.json();
}

// Get Instagram insights
export async function getInstagramInsights(
  igUserId: string,
  accessToken: string,
  period: 'day' | 'week' | 'days_28' = 'day'
): Promise<InstagramInsights> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/insights?` +
    new URLSearchParams({
      metric: 'impressions,reach,profile_views,follower_count',
      period: period,
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    // Some metrics might not be available, return defaults
    console.warn('Instagram insights error:', error);
    return {
      impressions: 0,
      reach: 0,
      profile_views: 0,
      follower_count: 0,
    };
  }

  const data = await response.json();
  const insights: InstagramInsights = {
    impressions: 0,
    reach: 0,
    profile_views: 0,
    follower_count: 0,
  };

  data.data?.forEach((metric: { name: string; values: { value: number }[] }) => {
    if (metric.values?.[0]?.value !== undefined) {
      insights[metric.name as keyof InstagramInsights] = metric.values[0].value;
    }
  });

  return insights;
}

// Get Instagram media (posts)
export async function getInstagramMedia(
  igUserId: string,
  accessToken: string,
  limit: number = 10
): Promise<any[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/media?` +
    new URLSearchParams({
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit: limit.toString(),
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get Instagram media');
  }

  const data = await response.json();
  return data.data || [];
}

// Get Facebook Page info
export async function getFacebookPageInfo(
  pageId: string,
  accessToken: string
): Promise<{ name: string; fan_count: number; followers_count: number }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}?` +
    new URLSearchParams({
      fields: 'name,fan_count,followers_count,picture',
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get Facebook page info');
  }

  return response.json();
}

// Get Facebook Page insights
export async function getFacebookPageInsights(
  pageId: string,
  pageAccessToken: string,
  period: 'day' | 'week' | 'days_28' = 'day'
): Promise<FacebookPageInsights> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/insights?` +
    new URLSearchParams({
      metric: 'page_impressions,page_engaged_users,page_fans',
      period: period,
      access_token: pageAccessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    console.warn('Facebook page insights error:', error);
    return {
      page_impressions: 0,
      page_engaged_users: 0,
      page_fans: 0,
    };
  }

  const data = await response.json();
  const insights: FacebookPageInsights = {
    page_impressions: 0,
    page_engaged_users: 0,
    page_fans: 0,
  };

  data.data?.forEach((metric: { name: string; values: { value: number }[] }) => {
    if (metric.values?.[0]?.value !== undefined) {
      insights[metric.name as keyof FacebookPageInsights] = metric.values[0].value;
    }
  });

  return insights;
}

// Get Facebook Page posts
export async function getFacebookPagePosts(
  pageId: string,
  pageAccessToken: string,
  limit: number = 10
): Promise<any[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/posts?` +
    new URLSearchParams({
      fields: 'id,message,created_time,shares,likes.summary(true),comments.summary(true),full_picture',
      limit: limit.toString(),
      access_token: pageAccessToken,
    })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get Facebook posts');
  }

  const data = await response.json();
  return data.data || [];
}

// Validate access token
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/me?access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Debug token (get token info)
export async function debugToken(accessToken: string): Promise<{
  is_valid: boolean;
  expires_at: number;
  scopes: string[];
}> {
  const response = await fetch(
    `${GRAPH_API_BASE}/debug_token?` +
    new URLSearchParams({
      input_token: accessToken,
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    throw new Error('Failed to debug token');
  }

  const data = await response.json();
  return data.data;
}
