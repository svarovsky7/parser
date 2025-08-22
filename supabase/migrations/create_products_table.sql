-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id bigint PRIMARY KEY,
    name text NOT NULL,
    brand text NOT NULL,
    article text,
    brand_code text NOT NULL,
    cli_code text,
    class text NOT NULL,
    class_code bigint NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.products
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.products
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products(brand);
CREATE INDEX IF NOT EXISTS products_class_code_idx ON public.products(class_code);
CREATE INDEX IF NOT EXISTS products_brand_code_idx ON public.products(brand_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();