import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Article {
  id: string;
  author_id: string | null;
  category_id: string | null;
  title: string;
  preview: string | null;
  body: string;
  media_url: string | null;
  media_type: string | null;
  is_anonymous: boolean | null;
  status: string | null;
  rejection_reason: string | null;
  likes_count: number | null;
  comments_count: number | null;
  favorites_count: number | null;
  rep_score: number | null;
  allow_comments: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_premium: boolean | null;
    reputation: number | null;
    show_avatar?: boolean | null;
    show_name?: boolean | null;
    show_username?: boolean | null;
  } | null;
}

export interface CreateArticleData {
  category_id: string;
  title: string;
  body: string;
  preview?: string;
  media_url?: string;
  media_type?: 'image' | 'youtube';
  is_anonymous?: boolean;
  allow_comments?: boolean;
  sources?: string[];
}

function getInitData() {
  // @ts-ignore
  const tg = window.Telegram?.WebApp;
  return tg?.initData || '';
}

async function extractEdgeErrorMessage(err: any): Promise<string> {
  try {
    const res = err?.context;
    if (res && typeof res.json === 'function') {
      const body = await res.json().catch(() => null);
      const msg = body?.error || body?.message;
      if (msg) return String(msg);
    }
  } catch {
    // ignore
  }
  return err?.message || 'Ошибка запроса к серверу';
}

export function useArticles() {
  const [loading, setLoading] = useState(false);

  // Get approved articles (public, no auth needed)
  const getApprovedArticles = useCallback(async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:author_id(id, first_name, last_name, username, avatar_url, is_premium, reputation, show_avatar, show_name, show_username)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Article[];
    } catch (err) {
      console.error('Error fetching articles:', err);
      return [];
    }
  }, []);

  // Get user's articles via backend function
  const getUserArticles = useCallback(async () => {
    const initData = getInitData();
    if (!initData) return [];

    try {
      const { data, error } = await supabase.functions.invoke('tg-my-articles', {
        body: { initData },
      });

      if (error) {
        const msg = await extractEdgeErrorMessage(error);
        throw new Error(msg);
      }

      return (data?.articles || []) as Article[];
    } catch (err) {
      console.error('Error fetching user articles:', err);
      return [];
    }
  }, []);

  // Create article via backend function
  const createArticle = useCallback(async (articleData: CreateArticleData) => {
    const initData = getInitData();
    if (!initData) {
      toast.error('Необходимо авторизоваться через Telegram');
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tg-create-article', {
        body: { initData, article: articleData },
      });

      if (error) {
        const msg = await extractEdgeErrorMessage(error);
        throw new Error(msg);
      }

      if (!data?.article) {
        throw new Error('Не удалось создать статью');
      }

      // Send moderation request
      try {
        await supabase.functions.invoke('send-moderation', {
          body: { articleId: data.article.id },
        });
      } catch (modError) {
        console.error('Error sending moderation request:', modError);
      }

      toast.success('Статья отправлена на модерацию');
      return data.article;
    } catch (err: any) {
      console.error('Error creating article:', err);
      toast.error(err?.message || 'Ошибка создания статьи');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update article (placeholder - implement if needed)
  const updateArticle = useCallback(async (articleId: string, updates: Partial<CreateArticleData>) => {
    toast.error('Редактирование статей пока недоступно');
    return false;
  }, []);

  return {
    loading,
    getApprovedArticles,
    getUserArticles,
    createArticle,
    updateArticle,
  };
}
