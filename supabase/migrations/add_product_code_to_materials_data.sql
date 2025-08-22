-- Добавление поля product_code в таблицу materials_data
ALTER TABLE public.materials_data 
ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);

-- Добавление индекса для поля product_code для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_materials_data_product_code ON public.materials_data(product_code);

-- Комментарий к новому полю
COMMENT ON COLUMN public.materials_data.product_code IS 'Код товара для материала';