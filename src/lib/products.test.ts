import { describe, it, expect } from 'vitest';
import { productSchema, effectivePrice, toFormValues, priceLabel, existingCategories, PRODUCT_LIMITS, type MerchantProduct } from './products';
import { validateImageFile, extensionFor, IMAGE_MAX_BYTES } from './imageUpload';

const valid = { name: 'Pão francês', price: 1.5, is_available: true, hasVariations: false };

describe('productSchema', () => {
  it('aceita um produto simples', () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });
  it('nome muito curto ou muito longo', () => {
    expect(productSchema.safeParse({ ...valid, name: 'a' }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, name: 'a'.repeat(PRODUCT_LIMITS.name + 1) }).success).toBe(false);
  });
  it('produto sem variações exige preço maior que zero', () => {
    expect(productSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: 100_001 }).success).toBe(false);
  });
  it('com variações, o preço principal é ignorado mas é preciso ter variação válida', () => {
    expect(productSchema.safeParse({ ...valid, price: 0, hasVariations: true, variations: [] }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: 0, hasVariations: true, variations: [{ name: 'Grande', price: 12 }] }).success).toBe(true);
    expect(productSchema.safeParse({ ...valid, price: 0, hasVariations: true, variations: [{ name: '', price: 12 }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: 0, hasVariations: true, variations: [{ name: 'X', price: 0 }] }).success).toBe(false);
  });
  it('limita descrição, categoria e quantidade de variações', () => {
    expect(productSchema.safeParse({ ...valid, description: 'x'.repeat(PRODUCT_LIMITS.description + 1) }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, category: 'x'.repeat(PRODUCT_LIMITS.category + 1) }).success).toBe(false);
    const many = Array.from({ length: PRODUCT_LIMITS.variations + 1 }, (_, i) => ({ name: `V${i}`, price: 1 }));
    expect(productSchema.safeParse({ ...valid, hasVariations: true, variations: many }).success).toBe(false);
  });
});

describe('preço e rótulos', () => {
  it('effectivePrice usa a variação mais barata', () => {
    expect(effectivePrice({ price: 99, hasVariations: true, variations: [{ name: 'G', price: 15 }, { name: 'P', price: 9 }] })).toBe(9);
    expect(effectivePrice({ price: 7, hasVariations: false, variations: [] })).toBe(7);
  });
  it('priceLabel', () => {
    const clean = (s: string) => s.replace(/\s/g, ' ');
    expect(clean(priceLabel({ price: 10, product_variations: [] }))).toBe('R$ 10,00');
    expect(clean(priceLabel({ price: 10, product_variations: [{ name: 'P', price: 8 }, { name: 'G', price: 12 }] }))).toBe('a partir de R$ 8,00');
  });
});

describe('toFormValues / categorias', () => {
  const product: MerchantProduct = {
    id: 'p1', name: 'Pizza', description: null, price: 8, image: null, unit: null, category: 'Pizzas',
    is_available: false, is_promotion: false, promotion_description: null, promotion_expiration: null, created_at: null,
    product_variations: [{ name: 'Média', price: 8 }, { name: 'Grande', price: 12 }],
  };
  it('preenche o formulário com o produto existente', () => {
    const v = toFormValues(product);
    expect(v).toMatchObject({ name: 'Pizza', hasVariations: true, is_available: false, price: 0, category: 'Pizzas' });
    expect(v.variations).toHaveLength(2);
  });
  it('produto novo começa disponível e vazio', () => {
    expect(toFormValues(null)).toMatchObject({ name: '', is_available: true, hasVariations: false, price: 0 });
  });
  it('lista categorias sem repetir e em ordem', () => {
    expect(existingCategories([{ category: 'Pizzas' }, { category: 'Bebidas' }, { category: ' Pizzas ' }, { category: null }])).toEqual(['Bebidas', 'Pizzas']);
  });
});

describe('validateImageFile', () => {
  it('aceita JPG, PNG e WebP até 5 MB', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES })).toBeNull();
    expect(validateImageFile({ type: 'image/webp', size: 10 })).toBeNull();
  });
  it('recusa outros tipos, arquivos grandes e vazios', () => {
    expect(validateImageFile({ type: 'image/svg+xml', size: 10 })).toMatch(/JPG, PNG ou WebP/);
    expect(validateImageFile({ type: 'application/pdf', size: 10 })).toBeTruthy();
    expect(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES + 1 })).toMatch(/5 MB/);
    expect(validateImageFile({ type: 'image/png', size: 0 })).toBeTruthy();
  });
  it('a extensão vem do tipo, não do nome', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('text/html')).toBeNull();
  });
});
