-- Создание связи между таблицами main и prise_list_etm
-- product_code в таблице main ссылается на id в таблице prise_list_etm

-- Добавляем внешний ключ для связи main.product_code → prise_list_etm.id
ALTER TABLE public.main 
ADD CONSTRAINT fk_main_product_code 
FOREIGN KEY (product_code) 
REFERENCES public.prise_list_etm(id::text);

-- Добавляем индекс для оптимизации запросов по product_code
CREATE INDEX IF NOT EXISTS idx_main_product_code ON public.main(product_code);

-- Добавляем комментарии для документирования связи
COMMENT ON COLUMN public.main.product_code IS 'Внешний ключ на prise_list_etm.id - связь с каталогом товаров';
COMMENT ON CONSTRAINT fk_main_product_code ON public.main IS 'Связь с каталогом товаров prise_list_etm';

-- Создаем представление для удобного объединения данных
CREATE OR REPLACE VIEW public.materials_with_products AS
SELECT 
    m.id,
    m.row_no,
    m.name as material_name,
    m.type_brand,
    m.drawing_code,
    m.manufacturer,
    m.unit,
    m.qty,
    m.unit_out,
    m.cost,
    m.basis,
    m.product_code,
    p.name as product_name,
    p.brand as product_brand,
    p.article as product_article,
    p.brand_code as product_brand_code,
    p.cli_code as product_cli_code,
    p.class as product_class,
    p.class_code as product_class_code,
    m.created_at,
    m.updated_at
FROM public.main m
LEFT JOIN public.prise_list_etm p ON m.product_code = p.id::text;

-- Добавляем комментарий к представлению
COMMENT ON VIEW public.materials_with_products IS 'Объединенное представление материалов проекта с данными из каталога товаров';