"use client";

import React from "react";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard } from "@/components/product/product-card";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export default function FavoritesPage() {
  const { items, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <section className="bg-muted/30 py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <BackButton href="/products" label="Retour au catalogue" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                Mes <span className="text-primary">Favoris</span>
              </h1>
              <p className="text-muted-foreground mt-2 font-medium">
                Retrouvez ici tous les produits que vous avez aimés.
              </p>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 bg-background border border-border rounded-2xl shadow-sm">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <span className="font-black text-lg">{items.length} Articles</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
              <Heart className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Votre liste est <span className="text-primary italic">vide</span></h2>
            <p className="text-muted-foreground max-w-md mb-10 font-medium">
              Explorez notre catalogue et cliquez sur le cœur pour ajouter des produits à vos favoris.
            </p>
            <Link 
              href="/products" 
              className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              Découvrir les produits
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {items.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative group"
                >
                  <ProductCard product={product} />
                  {/* Quick Remove Button Overlay */}
                  <button 
                    onClick={() => removeFromWishlist(product.id!)}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-xl border border-red-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
