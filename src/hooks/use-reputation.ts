import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReputationEntry {
  id: string;
  user_id: string | null;
  from_user_id: string | null;
  article_id: string | null;
  value: number;
  created_at: string | null;
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

export function useReputation() {
  const [loading, setLoading] = useState(false);

  const getMyReputation = useCallback(async () => {
    const initData = getInitData();
    if (!initData) return { reputation: 0, history: [] as ReputationEntry[] };

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tg-my-reputation', {
        body: { initData },
      });

      if (error) {
        const msg = await extractEdgeErrorMessage(error);
        throw new Error(msg);
      }

      return {
        reputation: data?.reputation || 0,
        history: (data?.history || []) as ReputationEntry[],
      };
    } catch (err) {
      console.error('Error fetching reputation:', err);
      return { reputation: 0, history: [] as ReputationEntry[] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { getMyReputation, loading };
}

  return { getMyReputation, loading };
}
