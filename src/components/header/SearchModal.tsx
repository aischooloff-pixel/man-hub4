import { useState, useEffect } from 'react';
import { X, Search, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ArticleDetailModal } from '@/components/articles/ArticleDetailModal';
import { Article as TypeArticle } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchArticle {
  id: string;
  title: string;
  topic?: string | null;
  preview: string | null;
  body: string;
  author_id: string | null;
  category_id: string | null;
  media_url: string | null;
  media_type: string | null;
  is_anonymous: boolean | null;
  status: string | null;
  likes_count: number | null;
  comments_count: number | null;
  favorites_count: number | null;
  rep_score: number | null;
  allow_comments: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  author?: any;
}

const RECENT_SEARCHES_KEY = 'manhub_recent_searches';

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<TypeArticle | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      setSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) return;
    
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    
    setLoading(true);
    setSearched(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-articles', {
        body: { query: query.trim(), limit: 20 },
      });
      
      if (!error && data?.articles) {
        setResults(data.articles);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const mapToArticle = (article: SearchArticle): TypeArticle => ({
    id: article.id,
    author_id: article.author_id || '',
    category_id: article.category_id || '',
    topic_id: '',
    title: article.title,
    preview: article.preview || '',
    body: article.body,
    media_url: article.media_url || undefined,
    media_type: article.media_type as 'image' | 'youtube' | undefined,
    is_anonymous: article.is_anonymous || false,
    status: (article.status || 'approved') as 'draft' | 'pending' | 'approved' | 'rejected',
    likes_count: article.likes_count || 0,
    comments_count: article.comments_count || 0,
    favorites_count: article.favorites_count || 0,
    rep_score: article.rep_score || 0,
    allow_comments: article.allow_comments !== false,
    created_at: article.created_at || '',
    updated_at: article.updated_at || '',
  });

  if (!isOpen) return null;

  const trendingTopics = [
    'Инвестиции',
    'Продуктивность',
    'Фитнес',
    'Криптовалюта',
    'Саморазвитие',
  ];

  return (
    <>
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="absolute inset-x-0 top-0 bg-card animate-slide-down max-h-[80vh] overflow-y-auto">
          <div className="container py-4">
            {/* Search input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск статей, тем..."
                  className="pl-10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(searchQuery);
                  }}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* Results */}
            {!loading && searched && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Статьи ({results.length})
                </h3>
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(mapToArticle(article))}
                        className="w-full text-left rounded-lg bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                      >
                        <p className="font-medium text-sm">{article.topic || article.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {article.preview || article.body.substring(0, 100)}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Ничего не найдено</p>
                )}
              </div>
            )}

            {/* Recent searches */}
            {!searched && recentSearches.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Недавние запросы</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearRecent}>
                    Очистить
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((query) => (
                    <button
                      key={query}
                      onClick={() => handleRecentClick(query)}
                      className="rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-secondary/80"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            {!searched && (
              <div className="mt-4 pb-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Популярные темы</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleRecentClick(topic)}
                      className="rounded-full bg-secondary/50 px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ArticleDetailModal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
      />
    </>
  );
}
