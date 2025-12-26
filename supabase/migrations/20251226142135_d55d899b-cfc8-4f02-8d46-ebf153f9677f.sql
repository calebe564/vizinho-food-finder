-- Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pre_adm';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'empresario';