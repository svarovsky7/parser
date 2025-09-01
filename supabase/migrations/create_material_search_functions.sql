-- Функции для связи таблиц main и prise_list_etm по полю name
-- Создано для поиска и подбора материалов

-- Функция точного поиска материалов в prise_list_etm
CREATE OR REPLACE FUNCTION find_exact_material_matches(search_name TEXT)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  brand TEXT,
  article TEXT,
  brand_code TEXT,
  cli_code TEXT,
  class TEXT,
  class_code BIGINT,
  similarity_score FLOAT DEFAULT 1.0,
  match_score FLOAT DEFAULT 100.0
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.article,
    p.brand_code,
    p.cli_code,
    p.class,
    p.class_code,
    1.0::FLOAT as similarity_score,
    100.0::FLOAT as match_score
  FROM public.prise_list_etm p
  WHERE LOWER(p.name) = LOWER(search_name)
  ORDER BY p.name;
END;
$$;

-- Функция поиска по сходству в prise_list_etm
CREATE OR REPLACE FUNCTION search_materials_by_name(
  search_name TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  limit_results INT DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  brand TEXT,
  article TEXT,
  brand_code TEXT,
  cli_code TEXT,
  class TEXT,
  class_code BIGINT,
  similarity_score FLOAT,
  match_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.article,
    p.brand_code,
    p.cli_code,
    p.class,
    p.class_code,
    similarity(p.name, search_name)::FLOAT as similarity_score,
    (similarity(p.name, search_name) * 100)::FLOAT as match_score
  FROM public.prise_list_etm p
  WHERE similarity(p.name, search_name) > similarity_threshold
  ORDER BY similarity(p.name, search_name) DESC
  LIMIT limit_results;
END;
$$;

-- Функция поиска по ключевым словам в prise_list_etm
CREATE OR REPLACE FUNCTION search_materials_by_keywords(
  search_name TEXT,
  min_word_length INT DEFAULT 3,
  limit_results INT DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  brand TEXT,
  article TEXT,
  brand_code TEXT,
  cli_code TEXT,
  class TEXT,
  class_code BIGINT,
  similarity_score FLOAT,
  match_score FLOAT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  search_words TEXT[];
  word TEXT;
  query_condition TEXT := '';
BEGIN
  -- Разбиваем поисковую строку на слова длиной >= min_word_length
  search_words := string_to_array(LOWER(search_name), ' ');
  
  -- Формируем условие для поиска по ключевым словам
  FOR i IN array_lower(search_words, 1)..array_upper(search_words, 1) LOOP
    word := search_words[i];
    IF length(word) >= min_word_length THEN
      IF query_condition != '' THEN
        query_condition := query_condition || ' OR ';
      END IF;
      query_condition := query_condition || 'LOWER(p.name) LIKE ''%' || word || '%''';
    END IF;
  END LOOP;
  
  -- Если нет подходящих слов, возвращаем пустой результат
  IF query_condition = '' THEN
    RETURN;
  END IF;
  
  -- Выполняем поиск с динамическим запросом
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
    similarity(p.name, $1)::FLOAT as similarity_score,
    (similarity(p.name, $1) * 100)::FLOAT as match_score
  FROM public.prise_list_etm p
  WHERE ' || query_condition || '
  ORDER BY similarity(p.name, $1) DESC
  LIMIT $2'
  USING search_name, limit_results;
END;
$$;

-- Функция для связи записи из main с наиболее подходящими материалами из prise_list_etm
CREATE OR REPLACE FUNCTION find_best_material_match(main_row_id BIGINT)
RETURNS TABLE (
  main_id BIGINT,
  main_name TEXT,
  suggested_material_id BIGINT,
  suggested_name TEXT,
  suggested_brand TEXT,
  suggested_article TEXT,
  suggested_brand_code TEXT,
  suggested_class TEXT,
  match_score FLOAT,
  match_type TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  material_name TEXT;
  exact_matches_count INT;
BEGIN
  -- Получаем название материала из main
  SELECT name INTO material_name 
  FROM public.main 
  WHERE id = main_row_id;
  
  IF material_name IS NULL THEN
    RETURN;
  END IF;
  
  -- Проверяем точные совпадения
  SELECT COUNT(*) INTO exact_matches_count
  FROM find_exact_material_matches(material_name);
  
  IF exact_matches_count > 0 THEN
    -- Возвращаем точные совпадения
    RETURN QUERY
    SELECT 
      main_row_id,
      material_name,
      em.id,
      em.name,
      em.brand,
      em.article,
      em.brand_code,
      em.class,
      em.match_score,
      'exact'::TEXT as match_type
    FROM find_exact_material_matches(material_name) em
    LIMIT 5;
  ELSE
    -- Возвращаем поиск по ключевым словам
    RETURN QUERY
    SELECT 
      main_row_id,
      material_name,
      km.id,
      km.name,
      km.brand,
      km.article,
      km.brand_code,
      km.class,
      km.match_score,
      'keywords'::TEXT as match_type
    FROM search_materials_by_keywords(material_name) km
    WHERE km.match_score >= 15
    LIMIT 3;
    
    -- Если по ключевым словам ничего не найдено, пробуем по сходству
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT 
        main_row_id,
        material_name,
        sm.id,
        sm.name,
        sm.brand,
        sm.article,
        sm.brand_code,
        sm.class,
        sm.match_score,
        'similarity'::TEXT as match_type
      FROM search_materials_by_name(material_name) sm
      WHERE sm.match_score >= 30
      LIMIT 2;
    END IF;
  END IF;
END;
$$;

-- Создание представления для удобного просмотра связей
CREATE OR REPLACE VIEW material_matches_view AS
SELECT 
  m.id as main_id,
  m.name as main_name,
  m.type_brand,
  m.manufacturer as main_manufacturer,
  p.id as prise_list_id,
  p.name as prise_list_name,
  p.brand,
  p.article,
  p.brand_code,
  p.class,
  similarity(m.name, p.name) as similarity_score,
  CASE 
    WHEN LOWER(m.name) = LOWER(p.name) THEN 'Точное совпадение'
    WHEN similarity(m.name, p.name) > 0.5 THEN 'Высокое сходство'
    WHEN similarity(m.name, p.name) > 0.3 THEN 'Среднее сходство'
    ELSE 'Низкое сходство'
  END as match_quality
FROM public.main m
LEFT JOIN public.prise_list_etm p ON similarity(m.name, p.name) > 0.3
ORDER BY m.id, similarity(m.name, p.name) DESC;

-- Комментарии к функциям
COMMENT ON FUNCTION find_exact_material_matches(TEXT) IS 'Поиск точных совпадений материалов в prise_list_etm по названию';
COMMENT ON FUNCTION search_materials_by_name(TEXT, FLOAT, INT) IS 'Поиск материалов по сходству названий с использованием trigram';
COMMENT ON FUNCTION search_materials_by_keywords(TEXT, INT, INT) IS 'Поиск материалов по ключевым словам';
COMMENT ON FUNCTION find_best_material_match(BIGINT) IS 'Поиск наиболее подходящих материалов для конкретной записи из main';
COMMENT ON VIEW material_matches_view IS 'Представление для просмотра связей между main и prise_list_etm';