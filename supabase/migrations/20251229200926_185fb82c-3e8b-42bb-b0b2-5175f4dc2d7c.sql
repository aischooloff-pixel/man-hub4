-- Create table for article reports (complaints)
CREATE TABLE public.article_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  reporter_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_telegram_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Service role can manage reports" 
ON public.article_reports 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can view their own reports" 
ON public.article_reports 
FOR SELECT 
USING (reporter_profile_id IN (SELECT id FROM public.profiles WHERE telegram_id IS NOT NULL));

-- Index for faster lookups
CREATE INDEX idx_article_reports_status ON public.article_reports(status);
CREATE INDEX idx_article_reports_article_id ON public.article_reports(article_id);