-- Создание таблицы базы материалов
CREATE TABLE IF NOT EXISTS public.materials_database (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    manufacturer VARCHAR(100),
    unit VARCHAR(20),
    price DECIMAL(10, 2),
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы для сохраненных материалов из Excel
CREATE TABLE IF NOT EXISTS public.materials_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    position INTEGER,
    name TEXT,
    type_mark_documents VARCHAR(100),
    equipment_code VARCHAR(50),
    manufacturer VARCHAR(100),
    unit VARCHAR(20),
    quantity DECIMAL(10, 2),
    material_picker TEXT,
    price_unit VARCHAR(20),
    price DECIMAL(10, 2),
    source VARCHAR(50),
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_materials_database_code ON public.materials_database(code);
CREATE INDEX IF NOT EXISTS idx_materials_database_name ON public.materials_database(name);
CREATE INDEX IF NOT EXISTS idx_materials_data_position ON public.materials_data(position);
CREATE INDEX IF NOT EXISTS idx_materials_data_name ON public.materials_data(name);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materials_database_updated_at
    BEFORE UPDATE ON public.materials_database
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_data_updated_at
    BEFORE UPDATE ON public.materials_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных в базу материалов
INSERT INTO public.materials_database (code, name, manufacturer, unit, price, source) VALUES
    ('LED-001', 'Светодиодная лампа E27 10W', '' ||
                                              'OSRAM', 'шт.', 250, 'ETM.ru'),
    ('LED-002', 'Светодиодная лента RGB 5м', 'Philips', 'м', 1200, 'База 1С'),
    ('LED-003', 'Светодиодная система освещения', 'CAPOC', 'шт.', 3500, 'Tinko.ru'),
    ('LED-004', 'Светодиодная панель уличная', 'ТВЕРЬ', 'шт.', 2800, 'ETM.ru'),
    ('LED-005', 'Светодиодный прожектор уличный', 'ГАЛА', 'шт.', 4200, 'База 1С'),
    ('SW-001', 'Выключатель одноклавишный', 'Legrand', 'шт.', 180, 'Tinko.ru'),
    ('SW-002', 'Выключатель двухклавишный', 'Schneider', 'шт.', 220, 'ETM.ru'),
    ('CABLE-001', 'Кабель ВВГ 3х2.5', 'Севкабель', 'м', 45, 'База 1С'),
    ('BOX-001', 'Распределительная коробка IP65', 'IEK', 'шт.', 320, 'Tinko.ru'),
    ('LIGHT-001', 'Прожектор светодиодный 50W', 'ELF', 'шт.', 1500, 'ETM.ru'),
    ('LIGHT-002', 'Прожектор уличный ЭЛЬФ', 'ELF', 'шт.', 1800, 'База 1С'),
    ('LIGHT-003', 'Уличный светильник LED', 'CAPOC', 'шт.', 2200, 'Tinko.ru'),
    ('BULB-001', 'Лампа накаливания 100W', 'OSRAM', 'шт.', 80, 'ETM.ru'),
    ('POLE-001', 'Опора освещения коническая', 'БУЛЬВАР', 'шт.', 15000, 'База 1С'),
    ('POLE-002', 'Опора круглая для освещения', 'ОКК', 'шт.', 12000, 'Tinko.ru'),
    ('MOUNT-001', 'Монтажный комплект для опор', 'MPE', 'комплект', 850, 'ETM.ru'),
    ('MOUNT-002', 'Комплект крепления светильника', 'CAPOC', 'комплект', 650, 'База 1С'),
    ('AUTO-001', 'Автомат дифференциальный', 'EKF', 'шт.', 1200, 'Tinko.ru'),
    ('AUTO-002', 'Дифференциальный выключатель', 'Schneider', 'шт.', 1400, 'ETM.ru'),
    ('GARDEN-001', 'Ландшафтный светильник LED', 'GARDEN', 'шт.', 3200, 'База 1С')
ON CONFLICT (code) DO NOTHING;