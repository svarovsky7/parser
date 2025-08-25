-- Создание индексов для быстрого поиска по name
-- Индекс для таблицы main
CREATE INDEX IF NOT EXISTS idx_main_name ON main USING gin(name gin_trgm_ops);

-- Индекс для таблицы prise_list_etm 
CREATE INDEX IF NOT EXISTS idx_prise_list_etm_name ON prise_list_etm USING gin(name gin_trgm_ops);

-- Включаем расширение pg_trgm если не включено (для текстового поиска)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Функция для поиска материалов в prise_list_etm по name из main
CREATE OR REPLACE FUNCTION search_materials_by_name(
  search_name TEXT,
  similarity_threshold REAL DEFAULT 0.3,
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  brand TEXT,
  article TEXT,
  brand_code TEXT,
  cli_code TEXT,
  class TEXT,
  class_code TEXT,
  similarity_score REAL
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.article,
    p.brand_code,
    p.cli_code,
    p.class,
    p.class_code,
    similarity(p.name, search_name) as similarity_score
  FROM prise_list_etm p
  WHERE similarity(p.name, search_name) > similarity_threshold
  ORDER BY similarity_score DESC, p.name
  LIMIT limit_results;
$$;

-- Функция для получения точных совпадений по name
CREATE OR REPLACE FUNCTION find_exact_material_matches(search_name TEXT)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  brand TEXT,
  article TEXT,
  brand_code TEXT,
  cli_code TEXT,
  class TEXT,
  class_code TEXT
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.article,
    p.brand_code,
    p.cli_code,
    p.class,
    p.class_code
  FROM prise_list_etm p
  WHERE LOWER(p.name) = LOWER(search_name)
  ORDER BY p.name;
$$;

-- Функция для поиска материалов с учетом ключевых слов
CREATE OR REPLACE FUNCTION search_materials_by_keywords(
  search_name TEXT,
  min_word_length INTEGER DEFAULT 3,
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  brand TEXT,
  article TEXT,
  brand_code TEXT,
  cli_code TEXT,
  class TEXT,
  class_code TEXT,
  match_score INTEGER
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_words TEXT[];
  word TEXT;
  query_condition TEXT := '';
BEGIN
  -- Разбиваем поисковую строку на слова длиной больше min_word_length
  SELECT ARRAY(
    SELECT LOWER(word)
    FROM unnest(string_to_array(search_name, ' ')) AS word
    WHERE LENGTH(word) > min_word_length
  ) INTO search_words;

  -- Если нет подходящих слов, возвращаем пустой результат
  IF array_length(search_words, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Строим условие поиска
  FOREACH word IN ARRAY search_words
  LOOP
    IF query_condition != '' THEN
      query_condition := query_condition || ' AND ';
    END IF;
    query_condition := query_condition || 'LOWER(p.name) LIKE ''%' || word || '%''';
  END LOOP;

  -- Выполняем поиск и возвращаем результаты с подсчетом совпадений
  RETURN QUERY EXECUTE
    'SELECT 
       p.id,
       p.name,
       p.brand,
       p.article,
       p.brand_code,
       p.cli_code,
       p.class,
       p.class_code,
       (' || 
       (SELECT string_agg('CASE WHEN LOWER(p.name) LIKE ''%' || word || '%'' THEN 1 ELSE 0 END', ' + ')
        FROM unnest(search_words) AS word) ||
       ') as match_score
     FROM prise_list_etm p
     WHERE ' || query_condition || '
     ORDER BY match_score DESC, similarity(p.name, $1) DESC, p.name
     LIMIT $2'
  USING search_name, limit_results;
END;
$$;

-- Создаем представление для удобства работы с связанными данными
CREATE OR REPLACE VIEW main_with_materials AS
SELECT 
  m.*,
  p.id as material_id,
  p.name as material_name,
  p.brand as material_brand,
  p.article as material_article,
  p.brand_code as material_brand_code,
  p.cli_code as material_cli_code,
  p.class as material_class,
  p.class_code as material_class_code,
  similarity(m.name, p.name) as name_similarity
FROM main m
LEFT JOIN prise_list_etm p ON similarity(m.name, p.name) > 0.3
ORDER BY m.id, name_similarity DESC;