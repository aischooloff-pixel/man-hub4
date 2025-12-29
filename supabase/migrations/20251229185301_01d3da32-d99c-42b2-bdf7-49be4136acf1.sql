-- Таблица лайков
CREATE TABLE public.article_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(article_id, user_profile_id)
);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" ON public.article_likes
FOR SELECT USING (true);

CREATE POLICY "Service role can manage likes" ON public.article_likes
FOR ALL USING (true) WITH CHECK (true);

-- Таблица избранного
CREATE TABLE public.article_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(article_id, user_profile_id)
);

ALTER TABLE public.article_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favorites are viewable by everyone" ON public.article_favorites
FOR SELECT USING (true);

CREATE POLICY "Service role can manage favorites" ON public.article_favorites
FOR ALL USING (true) WITH CHECK (true);

-- Таблица комментариев
CREATE TABLE public.article_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.article_comments
FOR SELECT USING (true);

CREATE POLICY "Service role can manage comments" ON public.article_comments
FOR ALL USING (true) WITH CHECK (true);

-- Индексы для быстрого поиска
CREATE INDEX idx_article_likes_article ON public.article_likes(article_id);
CREATE INDEX idx_article_likes_user ON public.article_likes(user_profile_id);
CREATE INDEX idx_article_favorites_article ON public.article_favorites(article_id);
CREATE INDEX idx_article_favorites_user ON public.article_favorites(user_profile_id);
CREATE INDEX idx_article_comments_article ON public.article_comments(article_id);