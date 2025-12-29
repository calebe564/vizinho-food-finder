-- Add new categories to the establishment_category enum
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'sorveteria';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'acai';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'espetinho';