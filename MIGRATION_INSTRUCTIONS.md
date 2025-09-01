# Инструкции по применению миграции для связи таблиц main и prise_list_etm

## Цель миграции
Связать таблицы `main` и `prise_list_etm` через поле `name` и реализовать функции поиска материалов в Supabase.

## Что делает миграция

### 1. Создание функций поиска:
- `find_exact_material_matches()` - точный поиск по названию
- `search_materials_by_name()` - поиск по сходству с trigram
- `search_materials_by_keywords()` - поиск по ключевым словам
- `find_best_material_match()` - поиск лучшего совпадения для конкретной записи

### 2. Создание представления:
- `material_matches_view` - для удобного просмотра связей между таблицами

## Применение миграции

### Способ 1: Через Supabase Dashboard
1. Откройте Supabase Dashboard
2. Перейдите в раздел "SQL Editor"
3. Скопируйте содержимое файла `supabase/migrations/create_material_search_functions.sql`
4. Вставьте в редактор и выполните

### Способ 2: Через CLI (если настроен)
```bash
supabase db push
```

## Проверка успешного применения

После применения миграции выполните следующие проверки:

### 1. Проверка функций
```sql
-- Проверьте, что функции созданы
SELECT proname FROM pg_proc WHERE proname LIKE '%material%';

-- Ожидаемый результат:
-- find_exact_material_matches
-- search_materials_by_name  
-- search_materials_by_keywords
-- find_best_material_match
```

### 2. Проверка представления
```sql
-- Проверьте, что представление создано
SELECT table_name FROM information_schema.views WHERE table_name = 'material_matches_view';
```

### 3. Тестирование функций
```sql
-- Тест точного поиска
SELECT * FROM find_exact_material_matches('Болт М8');

-- Тест поиска по сходству
SELECT * FROM search_materials_by_name('болт', 0.3, 5);

-- Тест поиска по ключевым словам  
SELECT * FROM search_materials_by_keywords('болт стальной', 3, 5);

-- Тест представления
SELECT * FROM material_matches_view LIMIT 10;
```

## Требования к данным

### Убедитесь, что:
1. **Таблица `main` содержит данные** с корректными названиями в поле `name`
2. **Таблица `prise_list_etm` содержит данные** с названиями материалов в поле `name`
3. **Включено расширение pg_trgm** для trigram поиска (должно быть по умолчанию)

### Проверка данных:
```sql
-- Проверка данных в main
SELECT COUNT(*) as main_count FROM main WHERE name IS NOT NULL;

-- Проверка данных в prise_list_etm
SELECT COUNT(*) as prise_list_count FROM prise_list_etm WHERE name IS NOT NULL;

-- Проверка trigram индексов
SELECT indexname FROM pg_indexes WHERE tablename IN ('main', 'prise_list_etm');
```

## После применения миграции

1. **Перезапустите приложение** для загрузки новых функций
2. **Протестируйте кнопку "Подбор материала"** в интерфейсе
3. **Проверьте консоль браузера** на наличие ошибок

## Возможные проблемы и решения

### Ошибка: "function does not exist"
- Убедитесь, что миграция применена успешно
- Проверьте права доступа к функциям

### Ошибка: "relation does not exist"  
- Убедитесь, что таблицы `main` и `prise_list_etm` существуют
- Проверьте правильность названий таблиц

### Плохое качество результатов поиска
- Убедитесь, что данные в таблицах содержат осмысленные названия
- Проверьте, что trigram индексы созданы

## Контакты для поддержки
При возникновении проблем обратитесь к разработчику или проверьте логи в консоли браузера.