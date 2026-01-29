import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Upload, Check, Edit2, Package } from "lucide-react";

interface ProductVariation {
  id: string;
  name: string;
  price: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  hasVariations: boolean;
  variations: ProductVariation[];
  image: File | null;
  imagePreview: string | null;
}

interface ProductFormSectionProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

// Card compacto para produtos já adicionados
function ProductCompactCard({
  product,
  onEdit,
  onRemove,
}: {
  product: Product;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const displayPrice = product.hasVariations && product.variations.length > 0
    ? `R$ ${Math.min(...product.variations.map(v => parseFloat(v.price) || 0)).toFixed(2).replace(".", ",")} - R$ ${Math.max(...product.variations.map(v => parseFloat(v.price) || 0)).toFixed(2).replace(".", ",")}`
    : `R$ ${parseFloat(product.price || "0").toFixed(2).replace(".", ",")}`;

  return (
    <Card className="overflow-hidden border border-border bg-card rounded-xl">
      <CardContent className="p-3 flex items-center gap-3">
        {product.imagePreview ? (
          <img
            src={product.imagePreview}
            alt={product.name}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{product.name || "Sem nome"}</h4>
          <p className="text-xs text-primary font-medium">{displayPrice}</p>
          {product.hasVariations && (
            <p className="text-[10px] text-muted-foreground">
              {product.variations.length} {product.variations.length === 1 ? "variação" : "variações"}
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={onEdit}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Formulário completo de produto (com fundo azul marinho)
function ProductFormCard({
  product,
  index,
  onUpdate,
  onToggleVariations,
  onAddVariation,
  onRemoveVariation,
  onUpdateVariation,
  onImageChange,
  onRemoveImage,
  onSave,
  onCancel,
  canCancel,
}: {
  product: Product;
  index: number;
  onUpdate: (field: keyof Product, value: string | boolean) => void;
  onToggleVariations: (hasVariations: boolean) => void;
  onAddVariation: () => void;
  onRemoveVariation: (variationId: string) => void;
  onUpdateVariation: (variationId: string, field: "name" | "price", value: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onCancel: () => void;
  canCancel: boolean;
}) {
  const isValid = product.name.trim() && product.imagePreview && (
    product.hasVariations
      ? product.variations.length > 0 && product.variations.every(v => v.name.trim() && v.price.trim())
      : product.price.trim()
  );

  return (
    <Card className="overflow-hidden border-0 bg-[#1a2847] text-white rounded-2xl shadow-lg">
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-200">
            {index === -1 ? "Novo Produto" : `Editando Produto ${index + 1}`}
          </span>
          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-blue-200 hover:text-white hover:bg-white/10 text-xs"
            >
              Cancelar
            </Button>
          )}
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-blue-100">Nome do Produto *</Label>
          <Input
            placeholder="Ex: Pizza, Pão Francês, Hambúrguer"
            value={product.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            className="h-11 rounded-xl bg-white text-foreground border-0 placeholder:text-muted-foreground"
          />
        </div>

        {/* Imagem */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-blue-100">Imagem do Produto *</Label>
          <div className="flex items-center gap-3">
            {product.imagePreview ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-300">
                <img src={product.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label
                htmlFor={`product-form-image-${product.id}`}
                className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-blue-300/50 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-300/10 transition-all"
              >
                <Upload className="h-5 w-5 text-blue-200" />
                <span className="text-xs text-blue-200 mt-1">Foto</span>
              </label>
            )}
            <input
              id={`product-form-image-${product.id}`}
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="sr-only"
            />
            <p className="text-xs text-blue-200 flex-1">
              Envie uma foto do produto
            </p>
          </div>
        </div>

        {/* Toggle variações */}
        <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-xl">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-blue-100">Este produto possui variações?</Label>
            <p className="text-xs text-blue-200/70">
              Ex: tamanhos diferentes, sabores, opções
            </p>
          </div>
          <Switch
            checked={product.hasVariations}
            onCheckedChange={onToggleVariations}
          />
        </div>

        {/* Preço simples */}
        {!product.hasVariations && (
          <div className="space-y-2 bg-white rounded-xl p-3">
            <Label className="text-sm font-medium text-foreground">Preço *</Label>
            <Input
              placeholder="Ex: 25.00"
              value={product.price}
              onChange={(e) => onUpdate("price", e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="h-11 rounded-xl border-input"
            />
          </div>
        )}

        {/* Variações */}
        {product.hasVariations && (
          <div className="space-y-3 bg-white rounded-xl p-3">
            <Label className="text-sm font-medium text-foreground">Variações *</Label>
            {product.variations.map((variation, vIndex) => (
              <div key={variation.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Nome (ex: Pequeno)"
                    value={variation.name}
                    onChange={(e) => onUpdateVariation(variation.id, "name", e.target.value)}
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="w-28">
                  <Input
                    placeholder="Preço"
                    value={variation.price}
                    onChange={(e) => onUpdateVariation(variation.id, "price", e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                {product.variations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive hover:text-destructive"
                    onClick={() => onRemoveVariation(variation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddVariation}
              className="mt-2 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Variação
            </Button>
          </div>
        )}

        {/* Botão Adicionar */}
        <Button
          type="button"
          onClick={onSave}
          disabled={!isValid}
          className="w-full h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold"
        >
          <Check className="h-4 w-4 mr-2" />
          {index === -1 ? "Adicionar Produto" : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProductFormSection({ products, setProducts }: ProductFormSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftProduct, setDraftProduct] = useState<Product | null>(null);

  // Produtos já salvos (com nome preenchido)
  const savedProducts = products.filter(p => p.name.trim() && p.imagePreview && !editingId?.includes(p.id));
  const isAddingNew = draftProduct !== null && !editingId;
  const isEditing = editingId !== null;

  const createNewDraft = (): Product => ({
    id: crypto.randomUUID(),
    name: "",
    price: "",
    hasVariations: false,
    variations: [],
    image: null,
    imagePreview: null,
  });

  const handleStartNew = () => {
    if (draftProduct) return; // Já está criando
    setDraftProduct(createNewDraft());
    setEditingId(null);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setDraftProduct({ ...product });
      setEditingId(productId);
    }
  };

  const handleCancelEdit = () => {
    setDraftProduct(null);
    setEditingId(null);
  };

  const handleSaveProduct = () => {
    if (!draftProduct) return;

    if (editingId) {
      // Atualizar existente
      setProducts(prev => prev.map(p => p.id === editingId ? draftProduct : p));
    } else {
      // Adicionar novo
      setProducts(prev => [...prev, draftProduct]);
    }

    setDraftProduct(null);
    setEditingId(null);
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleUpdateDraft = (field: keyof Product, value: string | boolean) => {
    if (!draftProduct) return;
    setDraftProduct({ ...draftProduct, [field]: value });
  };

  const handleToggleVariations = (hasVariations: boolean) => {
    if (!draftProduct) return;
    if (hasVariations) {
      setDraftProduct({
        ...draftProduct,
        hasVariations: true,
        price: "",
        variations: [{ id: crypto.randomUUID(), name: "", price: "" }],
      });
    } else {
      setDraftProduct({ ...draftProduct, hasVariations: false, variations: [] });
    }
  };

  const handleAddVariation = () => {
    if (!draftProduct) return;
    setDraftProduct({
      ...draftProduct,
      variations: [...draftProduct.variations, { id: crypto.randomUUID(), name: "", price: "" }],
    });
  };

  const handleRemoveVariation = (variationId: string) => {
    if (!draftProduct) return;
    setDraftProduct({
      ...draftProduct,
      variations: draftProduct.variations.filter(v => v.id !== variationId),
    });
  };

  const handleUpdateVariation = (variationId: string, field: "name" | "price", value: string) => {
    if (!draftProduct) return;
    setDraftProduct({
      ...draftProduct,
      variations: draftProduct.variations.map(v =>
        v.id === variationId ? { ...v, [field]: value } : v
      ),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && draftProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftProduct({
          ...draftProduct,
          image: file,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    if (!draftProduct) return;
    setDraftProduct({ ...draftProduct, image: null, imagePreview: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Produtos Oferecidos</h3>
        </div>
        {!isAddingNew && !isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStartNew}
            className="rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        )}
      </div>

      {/* Produtos já adicionados */}
      {savedProducts.length > 0 && !isEditing && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            {savedProducts.length} {savedProducts.length === 1 ? "produto adicionado" : "produtos adicionados"}
          </p>
          <div className="grid gap-2">
            {savedProducts.map(product => (
              <ProductCompactCard
                key={product.id}
                product={product}
                onEdit={() => handleEditProduct(product.id)}
                onRemove={() => handleRemoveProduct(product.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Formulário de edição/criação */}
      {draftProduct && (
        <ProductFormCard
          product={draftProduct}
          index={editingId ? products.findIndex(p => p.id === editingId) : -1}
          onUpdate={handleUpdateDraft}
          onToggleVariations={handleToggleVariations}
          onAddVariation={handleAddVariation}
          onRemoveVariation={handleRemoveVariation}
          onUpdateVariation={handleUpdateVariation}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
          onSave={handleSaveProduct}
          onCancel={handleCancelEdit}
          canCancel={savedProducts.length > 0 || editingId !== null}
        />
      )}

      {/* Mensagem quando vazio */}
      {savedProducts.length === 0 && !draftProduct && (
        <div className="text-center py-8 bg-muted/30 rounded-2xl">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">Nenhum produto adicionado</p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleStartNew}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar primeiro produto
          </Button>
        </div>
      )}
    </div>
  );
}
