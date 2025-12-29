import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseInitData(initData: string) {
  return new URLSearchParams(initData);
}

async function hmacSha256Raw(key: string, data: string) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

async function hmacSha256Hex(key: ArrayBuffer, data: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTelegramInitData(initData: string): Promise<{ user: any | null }> {
  const params = parseInitData(initData);
  const hash = params.get('hash');
  if (!hash) return { user: null };
  params.delete('hash');
  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');
  const secretKey = await hmacSha256Raw('WebAppData', TELEGRAM_BOT_TOKEN);
  const calculatedHash = await hmacSha256Hex(secretKey, dataCheckString);
  if (calculatedHash !== hash) return { user: null };
  try {
    return { user: JSON.parse(params.get('user') || 'null') };
  } catch {
    return { user: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData, articleId } = await req.json();
    
    const { user: tgUser } = await verifyTelegramInitData(initData);
    if (!tgUser) {
      return new Response(JSON.stringify({ error: 'Неверные данные авторизации' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', tgUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Профиль не найден' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', articleId)
      .eq('user_profile_id', profile.id)
      .maybeSingle();

    let isLiked: boolean;

    if (existingLike) {
      // Remove like
      await supabase
        .from('article_likes')
        .delete()
        .eq('id', existingLike.id);
      
      // Decrease likes count
      const { data: articleDec } = await supabase
        .from('articles')
        .select('likes_count')
        .eq('id', articleId)
        .single();
      
      await supabase
        .from('articles')
        .update({ likes_count: Math.max(0, (articleDec?.likes_count || 1) - 1) })
        .eq('id', articleId);
      
      isLiked = false;
    } else {
      // Add like
      await supabase
        .from('article_likes')
        .insert({ article_id: articleId, user_profile_id: profile.id });
      
      // Increase likes count
      const { data: article } = await supabase
        .from('articles')
        .select('likes_count')
        .eq('id', articleId)
        .single();
      
      await supabase
        .from('articles')
        .update({ likes_count: (article?.likes_count || 0) + 1 })
        .eq('id', articleId);
      
      isLiked = true;
    }

    // Get updated count
    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);

    console.log(`Like toggled for article ${articleId} by user ${tgUser.id}: ${isLiked}`);

    return new Response(JSON.stringify({ 
      success: true, 
      isLiked,
      likesCount: count || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    return new Response(JSON.stringify({ error: 'Ошибка сервера' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
