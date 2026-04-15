"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { productService } from "@/services/product.service";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { 
  Filter, Search, SlidersHorizontal, 
  ChevronDown, X, LayoutGrid, List, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("q") || "";
  const initialPromo = searchParams.get("promo") === "true";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [promotionOnly, setPromotionOnly] = useState(initialPromo);
  const [sortBy, setSortBy] = useState("newest");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", keyword, selectedCategory, minPrice, maxPrice, sortBy, promotionOnly, page],
    queryFn: () => productService.getProducts({ 
      q: keyword, 
      category: selectedCategory, 
      minPrice, 
      maxPrice, 
      sortBy,
      promotionOnly,
      page,
      size: 12 
    }),
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Search */}
      <section className="bg-muted/30 py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <BackButton href="/" label="Accueil" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-8">NOTRE <span className="text-primary italic">CATALOGUE</span></h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Que recherchez-vous aujourd'hui ?"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full h-14 bg-background border-2 border-border rounded-2xl pl-12 pr-4 focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar / Filters (Desktop) */}
          <aside className="hidden lg:block w-64 space-y-10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Catégories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    !selectedCategory ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-muted"
                  )}
                >
                  Tous les produits
                </button>
                {categories?.filter(c => !c.parentId).map((parent) => (
                  <div key={parent.id} className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(parent.nom)}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        selectedCategory === parent.nom 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {parent.nom}
                    </button>
                    
                    {/* Sub-categories */}
                    <div className="ml-4 pl-3 border-l border-border/60 space-y-1">
                      {categories?.filter(sub => sub.parentId === parent.id).map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedCategory(sub.nom)}
                          className={cn(
                            "w-full text-left px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                            selectedCategory === sub.nom 
                              ? "text-primary bg-primary/5" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          {sub.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Prix</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  onChange={(e) => setMinPrice(Number(e.target.value) || undefined)}
                  className="w-full p-3 bg-muted/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="number"
                  placeholder="Max"
                  onChange={(e) => setMaxPrice(Number(e.target.value) || undefined)}
                  className="w-full p-3 bg-muted/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground font-medium">
                {productsData?.totalElements || 0} résultats trouvés
              </span>
              <div className="flex items-center gap-4">
                <div className="relative group flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="relative">
                    <button
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      className="flex items-center gap-4 bg-muted/50 border border-border rounded-xl pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:border-primary/50 hover:bg-background transition-all min-w-[200px] text-left"
                    >
                      {sortBy === "newest" && "Les plus récents"}
                      {sortBy === "priceAsc" && "Prix croissant"}
                      {sortBy === "priceDesc" && "Prix décroissant"}
                      <ChevronDown className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform", isSortOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isSortOpen && (
                        <>
                          {/* Backdrop to close */}
                          <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-full min-w-[200px] bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="p-2">
                              {[
                                { id: "newest", label: "Les plus récents" },
                                { id: "priceAsc", label: "Prix croissant" },
                                { id: "priceDesc", label: "Prix décroissant" }
                              ].map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => {
                                    setSortBy(option.id);
                                    setIsSortOpen(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                    sortBy === option.id 
                                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <ProductGridSkeleton count={9} />
            ) : productsData?.content.length === 0 ? (
              <div className="text-center py-32 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
                <p className="text-lg font-bold">Aucun produit ne correspond à ces critères.</p>
                <button 
                  onClick={() => {
                    setKeyword("");
                    setSelectedCategory(undefined);
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                  }}
                  className="mt-4 text-primary font-bold hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-8",
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {productsData?.content.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    layout={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination Placeholder */}
            {productsData && productsData.totalPages > 1 && (
              <div className="mt-16 flex justify-center gap-2">
                {Array.from({ length: productsData.totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setPage(i);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl font-bold transition-all",
                      i === page ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted hover:bg-border"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
