-- Function to create notification on like
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_author_id uuid;
  v_article_title text;
  v_liker_name text;
BEGIN
  -- Get article author
  SELECT author_id, title INTO v_article_author_id, v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Don't notify if user likes their own article
  IF v_article_author_id IS NULL OR v_article_author_id = NEW.user_profile_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker name
  SELECT COALESCE(first_name, username, 'Кто-то') INTO v_liker_name
  FROM profiles
  WHERE id = NEW.user_profile_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_article_author_id,
    'like',
    v_liker_name || ' понравилась ваша статья "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '"',
    NEW.article_id,
    NEW.user_profile_id,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for likes
DROP TRIGGER IF EXISTS on_article_like_notification ON article_likes;
CREATE TRIGGER on_article_like_notification
  AFTER INSERT ON article_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_author_id uuid;
  v_article_title text;
  v_commenter_name text;
BEGIN
  -- Get article author
  SELECT author_id, title INTO v_article_author_id, v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Don't notify if user comments on their own article
  IF v_article_author_id IS NULL OR v_article_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name
  SELECT COALESCE(first_name, username, 'Кто-то') INTO v_commenter_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_article_author_id,
    'comment',
    v_commenter_name || ' прокомментировал вашу статью "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '"',
    NEW.article_id,
    NEW.author_id,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for comments
DROP TRIGGER IF EXISTS on_article_comment_notification ON article_comments;
CREATE TRIGGER on_article_comment_notification
  AFTER INSERT ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Function to create notification on favorite
CREATE OR REPLACE FUNCTION public.create_favorite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_author_id uuid;
  v_article_title text;
  v_user_name text;
BEGIN
  -- Get article author
  SELECT author_id, title INTO v_article_author_id, v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Don't notify if user favorites their own article
  IF v_article_author_id IS NULL OR v_article_author_id = NEW.user_profile_id THEN
    RETURN NEW;
  END IF;
  
  -- Get user name
  SELECT COALESCE(first_name, username, 'Кто-то') INTO v_user_name
  FROM profiles
  WHERE id = NEW.user_profile_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_article_author_id,
    'favorite',
    v_user_name || ' добавил вашу статью "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '" в избранное',
    NEW.article_id,
    NEW.user_profile_id,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for favorites
DROP TRIGGER IF EXISTS on_article_favorite_notification ON article_favorites;
CREATE TRIGGER on_article_favorite_notification
  AFTER INSERT ON article_favorites
  FOR EACH ROW
  EXECUTE FUNCTION create_favorite_notification();