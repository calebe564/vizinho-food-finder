-- Create enum for establishment categories
CREATE TYPE public.establishment_category AS ENUM ('restaurante', 'lanchonete', 'padaria', 'supermercado', 'açougue', 'hortifruti', 'pizzaria', 'hamburgueria', 'bar', 'cafe', 'outro');

-- Create establishments table
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT NOT NULL,
  schedule TEXT NOT NULL,
  category establishment_category NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  banner_image TEXT,
  profile_image TEXT,
  description TEXT,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create statistics table for tracking views and clicks
CREATE TABLE public.establishment_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  banner_views INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for establishments (public read, admin write)
CREATE POLICY "Anyone can view active establishments"
  ON public.establishments
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage establishments"
  ON public.establishments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Anyone can view products"
  ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE id = products.establishment_id AND active = true
    )
  );

CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin users"
  ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for statistics (public can increment, admin can view all)
CREATE POLICY "Anyone can view statistics"
  ON public.establishment_statistics
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage statistics"
  ON public.establishment_statistics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_establishments_category ON public.establishments(category);
CREATE INDEX idx_establishments_paid ON public.establishments(is_paid);
CREATE INDEX idx_establishments_active ON public.establishments(active);
CREATE INDEX idx_products_establishment ON public.products(establishment_id);

-- Create function to automatically create statistics entry for new establishments
CREATE OR REPLACE FUNCTION public.create_establishment_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.establishment_statistics (establishment_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic statistics creation
CREATE TRIGGER on_establishment_created
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_establishment_statistics();