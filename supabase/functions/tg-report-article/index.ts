import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const ADMIN_BOT_TOKEN = Deno.env.get('ADMIN_BOT_TOKEN')!;
const TELEGRAM_ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseInitData(initData: string) {
  return new URLSearchParams(initData);
}

function enc(text: string) {
  return new TextEncoder().encode(text);
}

async function hmacSha256Raw(key: string, data: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc(data));
}

async function hmacSha256Hex(key: ArrayBuffer, data: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTelegramInitData(initData: string): Promise<{ user: any | null }> {
  const params = parseInitData(initData);

  const hash = params.get('hash');
  if (!hash) {
    return { user: null };
  }

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = await hmacSha256Raw('WebAppData', TELEGRAM_BOT_TOKEN);
  const checkHash = await hmacSha256Hex(secretKey, dataCheckString);

  if (checkHash !== hash) {
    return { user: null };
  }

  const userJson = params.get('user');
  if (!userJson) {
    return { user: null };
  }

  try {
    const user = JSON.parse(userJson);
    return { user };
  } catch {
    return { user: null };
  }
}

async function sendAdminMessage(chatId: string | number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });

  return response.json();
}

function safe(s: any) {
  return String(s ?? '').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { initData, articleId, reason } = await req.json();

    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!articleId || !reason) {
      return new Response(JSON.stringify({ error: 'articleId and reason are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user: tgUser } = await verifyTelegramInitData(initData);

    if (!tgUser?.id) {
      return new Response(JSON.stringify({ error: 'Invalid Telegram initData' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's profile
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', tgUser.id)
      .maybeSingle();

    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get article info
    const { data: article, error: aErr } = await supabase
      .from('articles')
      .select('id, title, author_id')
      .eq('id', articleId)
      .maybeSingle();

    if (aErr || !article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already reported this article
    const { data: existing } = await supabase
      .from('article_reports')
      .select('id')
      .eq('article_id', articleId)
      .eq('reporter_profile_id', profile.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Вы уже отправили жалобу на эту статью' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create report
    const { error: insertErr } = await supabase
      .from('article_reports')
      .insert({
        article_id: articleId,
        reporter_profile_id: profile.id,
        reason: reason.slice(0, 1000),
      });

    if (insertErr) {
      console.error('Error creating report:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to submit report' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notification to admin
    const message = `🚨 <b>Жалоба на статью</b>

📝 <b>Статья:</b> ${safe(article.title)}

📋 <b>Причина:</b>
${safe(reason)}

👤 <b>От:</b> ${tgUser.username ? `@${safe(tgUser.username)}` : safe(tgUser.first_name || 'Пользователь')} (ID: ${tgUser.id})`;

    await sendAdminMessage(TELEGRAM_ADMIN_CHAT_ID, message);

    console.log(`[tg-report-article] Report created for article ${articleId} by user ${tgUser.id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('tg-report-article error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
