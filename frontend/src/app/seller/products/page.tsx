"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Trash2, Eye, EyeOff,
  Search, Loader2, PackageOpen, Tag,
  Layers, BarChart3
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

export default function SellerProductsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["seller-products", user?.id],
    queryFn: () => productService.getProducts({ sellerId: user?.id, size: 50 }),
    enabled: !!user?.id,
    refetchInterval: 3000, // Rafraîchissement automatique pour les stocks et la visibilité
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      setDeleteId(null);
    }
  });

  const filteredProducts = productsData?.content.filter(p =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Chargement de votre inventaire...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <BackButton href="/seller/dashboard" label="Tableau de bord" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Mon <span className="text-primary">Inventaire</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Gérez vos articles et suivez vos stocks en temps réel.</p>
          </div>
          <Link href="/seller/products/new" className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            <Plus className="w-6 h-6" />
            Ajouter un produit
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher dans mes produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 bg-background border-2 border-border rounded-2xl pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4 px-6 bg-background border border-border rounded-2xl">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-sm">{filteredProducts?.length || 0} Articles</span>
          </div>
        </div>

        {/* Products Table/Grid */}
        {filteredProducts?.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center bg-background border border-border rounded-[3rem] text-center px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <PackageOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Aucun produit <span className="text-primary italic">trouvé</span></h3>
            <p className="text-muted-foreground max-w-sm mb-8">Votre inventaire est vide ou la recherche ne retourne aucun résultat.</p>
            <Link href="/seller/products/new" className="text-primary font-black uppercase text-xs tracking-widest hover:underline">Créer mon premier produit maintenant</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredProducts?.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-background border border-border/60 rounded-[1.8rem] p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition-all group"
                >
                  <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                    <Image
                      src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"}
                      alt={product.nom}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      {product.categoryNames.map((cat, idx) => (
                        <span key={`${cat}-${idx}`} className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                          {cat}
                        </span>
                      ))}
                      {!product.actif && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-500/5 px-2.5 py-0.5 rounded-full border border-red-500/10 flex items-center gap-1">
                          <EyeOff className="w-2 h-2" /> Masqué
                        </span>
                      )}
                      {product.actif && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-green-500 bg-green-500/5 px-2.5 py-0.5 rounded-full border border-green-500/10 flex items-center gap-1">
                          <Eye className="w-2 h-2" /> Visible
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black tracking-tight uppercase leading-none">{product.nom}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-6 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary/70" />
                        <span className="text-base font-black text-foreground">{product.prix.toFixed(2)}€</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span className={cn(
                          "text-[11px] font-black uppercase tracking-tighter",
                          product.stock <= 5 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          Stock : {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/product/${product.id}?from=seller`}
                      className="p-3 bg-muted/50 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm group/btn"
                      title="Voir sur le site"
                    >
                      <Eye className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                    </Link>
                    <Link
                      href={`/seller/products/edit/${product.id}`}
                      className="p-3 bg-muted/50 hover:bg-foreground hover:text-background rounded-xl transition-all shadow-sm group/btn"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                    </Link>
                    <button
                      onClick={() => setDeleteId(product.id)}
                      className="p-3 bg-muted/50 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modern Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-background/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-background border border-border p-8 rounded-[2.5rem] shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black tracking-tight uppercase">Supprimer ?</h3>
                <p className="text-muted-foreground font-medium text-sm">
                  Cette action est définitive. Le produit sera retiré de votre catalogue.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "OUI, SUPPRIMER"
                  )}
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="w-full py-4 bg-muted text-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-border transition-all"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
