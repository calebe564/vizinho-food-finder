import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Compass as CompassIcon, MapPin, Search, Store, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RatingBadge } from "@/components/StarRating";
import { SEGMENTS, categoryLabel, categoryValuesInSegment, type SegmentId } from "@/config/categories";
import { categoryIcon, segmentIcon } from "@/config/categoryIcons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MIN_QUERY_LENGTH, PAGE_SIZE, useDirectorySearch, type DirectoryResult } from "@/hooks/useDirectorySearch";

const SUGGESTIONS = ["pizza", "salão de beleza", "mecânico", "farmácia", "pet shop", "eletricista", "academia"];

const formatPrice = (price: number | null) =>
  price == null ? "" : price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ResultCard({ item }: { item: DirectoryResult }) {
  const Icon = categoryIcon(item.category);
  const isProduct = item.kind === "produto";
  const to = isProduct ? `/produto/${item.id}` : `/estabelecimento/${item.establishment_id}`;
  const where = [item.neighborhood, item.city].filter(Boolean).join(", ");

  return (
    <Link to={to} className="block">
      <Card className="hover:shadow-lg transition-shadow h-full">
        <CardContent className="p-3 flex gap-3">
          <div className="h-20 w-20 shrink-0 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
            {item.image ? (
              <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isProduct ? "secondary" : "outline"} className="text-[10px]">
                {isProduct ? "Produto" : categoryLabel(item.category)}
              </Badge>
              {item.is_destaque && <Badge className="text-[10px]">Destaque</Badge>}
            </div>

            <h3 className="font-semibold leading-tight truncate">{item.name}</h3>

            {isProduct ? (
              <p className="text-sm text-muted-foreground truncate">
                {formatPrice(item.price)} · {item.establishment_name}
              </p>
            ) : (
              item.description && <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
            )}

            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {where && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {where}
                </span>
              )}
              <RatingBadge average={item.rating_average ?? 0} count={item.rating_count ?? 0} size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Compass() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [text, setText] = useState(searchParams.get("q") ?? "");
  const [segment, setSegment] = useState<SegmentId | "todos">((searchParams.get("segmento") as SegmentId) || "todos");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const debounced = useDebouncedValue(text, 300);
  const categories = useMemo(() => (segment === "todos" ? null : categoryValuesInSegment(segment)), [segment]);

  const { data, isFetching, isError, refetch } = useDirectorySearch({ query: debounced, categories, limit });
  const results = data ?? [];
  const ready = debounced.trim().length >= MIN_QUERY_LENGTH;

  const updateUrl = (q: string, seg: SegmentId | "todos") => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (seg !== "todos") next.set("segmento", seg);
    setSearchParams(next, { replace: true });
  };

  const onChangeText = (value: string) => {
    setText(value);
    setLimit(PAGE_SIZE);
    updateUrl(value, segment);
  };

  const onChangeSegment = (value: SegmentId | "todos") => {
    setSegment(value);
    setLimit(PAGE_SIZE);
    updateUrl(text, value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Bússola: encontre comércio e serviços perto de você | Comércio Vizinho</title>
        <meta
          name="description"
          content="Procure qualquer comércio, produto ou serviço do seu bairro: comida, lojas, salões, oficinas, saúde e mais."
        />
      </Helmet>
      <Header />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
              <CompassIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold">Bússola</h1>
            <p className="text-muted-foreground mt-1">
              Procure qualquer comércio, produto ou serviço do seu bairro. Pode errar a digitação que a gente entende.
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Ex.: pizza, barbeiro, farmácia, eletricista..."
              aria-label="O que você procura?"
              autoFocus
              maxLength={120}
              className="h-12 pl-10 pr-10 rounded-xl text-base"
            />
            {text && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => onChangeText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Tipo de negócio">
            {[{ id: "todos" as const, label: "Tudo" }, ...SEGMENTS.filter((s) => s.id !== "outros")].map((s) => {
              const Icon = s.id === "todos" ? Store : segmentIcon(s.id);
              const active = segment === s.id;
              return (
                <Button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  variant={active ? "default" : "secondary"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => onChangeSegment(s.id)}
                >
                  <Icon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  {s.label}
                </Button>
              );
            })}
          </div>

          {!ready && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">Experimente procurar por:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" className="rounded-full" onClick={() => onChangeText(s)}>
                    {s}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Prefere navegar?{" "}
                <Link to="/categorias" className="text-primary underline underline-offset-2">
                  Veja todas as categorias
                </Link>
              </p>
            </div>
          )}

          {ready && isError && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">Não deu para buscar agora. Tente de novo.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}

          {ready && !isError && (
            <div aria-live="polite">
              {isFetching && results.length === 0 && <p className="text-center text-muted-foreground py-8">Buscando...</p>}

              {!isFetching && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="font-medium">Nada encontrado para "{debounced.trim()}"</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente outra palavra ou outro tipo de negócio. Quer ver a sua empresa aqui?{" "}
                    <Link to="/cadastrar" className="text-primary underline underline-offset-2">
                      Cadastre grátis
                    </Link>
                    .
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <>
                  <div className="grid gap-3">
                    {results.map((item) => (
                      <ResultCard key={`${item.kind}-${item.id}`} item={item} />
                    ))}
                  </div>

                  {results.length >= limit && limit < 50 && (
                    <div className="text-center mt-6">
                      <Button variant="outline" disabled={isFetching} onClick={() => setLimit((l) => Math.min(l + PAGE_SIZE, 50))}>
                        {isFetching ? "Carregando..." : "Ver mais resultados"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
