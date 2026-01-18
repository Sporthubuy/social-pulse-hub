import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import {
  getMetaOAuthUrl,
  exchangeCodeForToken,
  getFacebookPages,
  getInstagramAccount,
  getInstagramInsights,
  getFacebookPageInfo,
  getFacebookPageInsights,
  validateToken,
  type FacebookPage,
  type InstagramAccount,
  type SocialMetrics,
} from '@/services/meta-api';

export interface SocialConnection {
  id: string;
  platform: 'instagram' | 'facebook';
  accessToken: string;
  tokenExpiresAt: Date | null;
  pageId: string | null;
  igUserId: string | null;
  username: string | null;
  profilePicture: string | null;
}

export interface ConnectionState {
  instagram: {
    isConnected: boolean;
    username?: string;
    profilePicture?: string;
    account?: InstagramAccount;
  };
  facebook: {
    isConnected: boolean;
    username?: string;
    profilePicture?: string;
    pageId?: string;
  };
}

export interface SocialData {
  instagram: {
    metrics: SocialMetrics | null;
    account: InstagramAccount | null;
  };
  facebook: {
    metrics: SocialMetrics | null;
    pageInfo: { name: string; fan_count: number; followers_count: number } | null;
  };
}

const REDIRECT_URI = `${window.location.origin}/auth/callback/meta`;

export function useSocialConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionState>({
    instagram: { isConnected: false },
    facebook: { isConnected: false },
  });
  const [socialData, setSocialData] = useState<SocialData>({
    instagram: { metrics: null, account: null },
    facebook: { metrics: null, pageInfo: null },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing connections from localStorage (temporary storage)
  // In production, use Supabase table
  const loadConnections = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`social_connections_${user.id}`);
      if (stored) {
        const data = JSON.parse(stored);

        // Validate tokens and update state
        for (const connection of data) {
          const isValid = await validateToken(connection.accessToken);
          if (!isValid) {
            // Token expired, remove connection
            removeConnection(connection.platform);
            continue;
          }

          if (connection.platform === 'instagram' && connection.igUserId) {
            const account = await getInstagramAccount(connection.igUserId, connection.accessToken);
            const insights = await getInstagramInsights(connection.igUserId, connection.accessToken);

            setConnections(prev => ({
              ...prev,
              instagram: {
                isConnected: true,
                username: account.username,
                profilePicture: account.profile_picture_url,
                account,
              },
            }));

            setSocialData(prev => ({
              ...prev,
              instagram: {
                account,
                metrics: {
                  followers: account.followers_count,
                  likes: 0,
                  comments: 0,
                  reach: insights.reach,
                },
              },
            }));
          }

          if (connection.platform === 'facebook' && connection.pageId) {
            const pageInfo = await getFacebookPageInfo(connection.pageId, connection.accessToken);
            const insights = await getFacebookPageInsights(connection.pageId, connection.accessToken);

            setConnections(prev => ({
              ...prev,
              facebook: {
                isConnected: true,
                username: pageInfo.name,
                pageId: connection.pageId,
              },
            }));

            setSocialData(prev => ({
              ...prev,
              facebook: {
                pageInfo,
                metrics: {
                  followers: pageInfo.followers_count || pageInfo.fan_count,
                  likes: insights.page_engaged_users,
                  comments: 0,
                  reach: insights.page_impressions,
                },
              },
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Error al cargar las conexiones');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Initiate OAuth flow
  const connect = useCallback((platform: 'instagram' | 'facebook') => {
    const state = JSON.stringify({ platform, userId: user?.id });
    const encodedState = btoa(state);
    const oauthUrl = getMetaOAuthUrl(REDIRECT_URI, encodedState);

    // Store state for verification
    localStorage.setItem('meta_oauth_state', encodedState);

    // Redirect to Meta OAuth
    window.location.href = oauthUrl;
  }, [user]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify state
      const storedState = localStorage.getItem('meta_oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      localStorage.removeItem('meta_oauth_state');

      // Decode state to get platform
      const { platform } = JSON.parse(atob(state));

      // Exchange code for token
      const tokenData = await exchangeCodeForToken(code, REDIRECT_URI);
      const accessToken = tokenData.access_token;

      // Get Facebook pages
      const pages = await getFacebookPages(accessToken);

      if (pages.length === 0) {
        throw new Error('No se encontraron páginas de Facebook. Necesitas una página de Facebook conectada.');
      }

      // Use first page (in production, let user choose)
      const page = pages[0];

      const connectionData: any = {
        platform,
        accessToken: page.access_token, // Use page token for longer validity
        pageId: page.id,
        pageName: page.name,
      };

      if (platform === 'instagram' || page.instagram_business_account) {
        // Get Instagram business account if available
        if (page.instagram_business_account) {
          const igAccount = await getInstagramAccount(
            page.instagram_business_account.id,
            page.access_token
          );
          connectionData.igUserId = page.instagram_business_account.id;
          connectionData.igUsername = igAccount.username;
          connectionData.igProfilePicture = igAccount.profile_picture_url;

          setConnections(prev => ({
            ...prev,
            instagram: {
              isConnected: true,
              username: igAccount.username,
              profilePicture: igAccount.profile_picture_url,
              account: igAccount,
            },
          }));

          const insights = await getInstagramInsights(
            page.instagram_business_account.id,
            page.access_token
          );

          setSocialData(prev => ({
            ...prev,
            instagram: {
              account: igAccount,
              metrics: {
                followers: igAccount.followers_count,
                likes: 0,
                comments: 0,
                reach: insights.reach,
              },
            },
          }));
        }
      }

      if (platform === 'facebook') {
        const pageInfo = await getFacebookPageInfo(page.id, page.access_token);
        const insights = await getFacebookPageInsights(page.id, page.access_token);

        setConnections(prev => ({
          ...prev,
          facebook: {
            isConnected: true,
            username: pageInfo.name,
            pageId: page.id,
          },
        }));

        setSocialData(prev => ({
          ...prev,
          facebook: {
            pageInfo,
            metrics: {
              followers: pageInfo.followers_count || pageInfo.fan_count,
              likes: insights.page_engaged_users,
              comments: 0,
              reach: insights.page_impressions,
            },
          },
        }));
      }

      // Save to localStorage (in production, save to Supabase)
      const stored = localStorage.getItem(`social_connections_${user?.id}`);
      const existingConnections = stored ? JSON.parse(stored) : [];
      const filteredConnections = existingConnections.filter(
        (c: any) => c.platform !== platform
      );
      filteredConnections.push(connectionData);
      localStorage.setItem(
        `social_connections_${user?.id}`,
        JSON.stringify(filteredConnections)
      );

      return { success: true };
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setError(err.message || 'Error al conectar la cuenta');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Disconnect account
  const disconnect = useCallback((platform: 'instagram' | 'facebook') => {
    removeConnection(platform);

    setConnections(prev => ({
      ...prev,
      [platform]: { isConnected: false },
    }));

    setSocialData(prev => ({
      ...prev,
      [platform]: { metrics: null, account: null, pageInfo: null },
    }));
  }, [user]);

  const removeConnection = (platform: string) => {
    if (!user) return;

    const stored = localStorage.getItem(`social_connections_${user.id}`);
    if (stored) {
      const connections = JSON.parse(stored);
      const filtered = connections.filter((c: any) => c.platform !== platform);
      localStorage.setItem(`social_connections_${user.id}`, JSON.stringify(filtered));
    }
  };

  // Refresh data for a platform
  const refreshData = useCallback(async (platform: 'instagram' | 'facebook') => {
    if (!user) return;

    const stored = localStorage.getItem(`social_connections_${user.id}`);
    if (!stored) return;

    const connections = JSON.parse(stored);
    const connection = connections.find((c: any) => c.platform === platform);
    if (!connection) return;

    try {
      if (platform === 'instagram' && connection.igUserId) {
        const account = await getInstagramAccount(connection.igUserId, connection.accessToken);
        const insights = await getInstagramInsights(connection.igUserId, connection.accessToken);

        setSocialData(prev => ({
          ...prev,
          instagram: {
            account,
            metrics: {
              followers: account.followers_count,
              likes: 0,
              comments: 0,
              reach: insights.reach,
            },
          },
        }));
      }

      if (platform === 'facebook' && connection.pageId) {
        const pageInfo = await getFacebookPageInfo(connection.pageId, connection.accessToken);
        const insights = await getFacebookPageInsights(connection.pageId, connection.accessToken);

        setSocialData(prev => ({
          ...prev,
          facebook: {
            pageInfo,
            metrics: {
              followers: pageInfo.followers_count || pageInfo.fan_count,
              likes: insights.page_engaged_users,
              comments: 0,
              reach: insights.page_impressions,
            },
          },
        }));
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [user]);

  return {
    connections,
    socialData,
    isLoading,
    error,
    connect,
    disconnect,
    handleCallback,
    refreshData,
  };
}
