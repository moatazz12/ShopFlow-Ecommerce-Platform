"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { ProductDTO } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductDTO;
  layout?: "grid" | "list";
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isList = layout === "list";
  const isFavorite = isInWishlist(product.id!);
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800");
  const hasPromo = product.prixPromo && product.prixPromo < product.prix;
  const discountPercent = hasPromo 
    ? Math.round(((product.prix - product.prixPromo!) / product.prix) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group relative bg-background border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all",
        isList ? "flex flex-col sm:flex-row h-auto sm:h-64" : "flex flex-col"
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {!!hasPromo && (
          <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-lg">
            -{discountPercent}%
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg shadow-lg">
            STOCK FAIBLE
          </span>
        )}
      </div>

      {/* Hero Image */}
      <Link 
        href={`/product/${product.id}`} 
        className={cn(
          "block relative overflow-hidden bg-muted flex-shrink-0",
          isList ? "w-full sm:w-64 h-64 sm:h-full" : "aspect-square"
        )}
      >
        <Image
          src={imgSrc}
          alt={product.nom}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgSrc("https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800")}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        
        {/* Quick Actions Hover */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product.id!, 1);
            }}
            className="p-3 bg-background border border-border rounded-xl shadow-xl hover:bg-primary hover:text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
            className={cn(
                "p-3 bg-background border border-border rounded-xl shadow-xl transition-all hover:scale-110",
                isFavorite ? "text-red-500 border-red-200 bg-red-50" : "hover:text-red-500"
            )}
          >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className={cn("p-5 flex flex-col justify-between flex-1", isList && "sm:p-8")}>
        <div>
          <div className="flex items-center gap-1 mb-2">
             <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
             <span className="text-[10px] font-bold text-muted-foreground">
               {product.averageRating.toFixed(1)} ({product.reviewCount})
             </span>
          </div>
          
          <Link href={`/product/${product.id}`} className="block">
            <h3 className={cn(
              "font-bold group-hover:text-primary transition-colors",
              isList ? "text-xl mb-2" : "text-sm line-clamp-1"
            )}>
              {product.nom}
            </h3>
          </Link>
          
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Vendu par <span className="font-bold text-foreground">{product.sellerName}</span>
          </p>

          {isList && (
            <p className="mt-4 text-sm text-muted-foreground line-clamp-2 max-w-xl">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-end gap-2">
            {hasPromo ? (
              <>
                <span className={cn("font-black text-primary", isList ? "text-3xl" : "text-lg")}>
                  {product.prixPromo?.toFixed(2)}€
                </span>
                <span className="text-xs text-muted-foreground line-through mb-1">
                  {product.prix.toFixed(2)}€
                </span>
              </>
            ) : (
              <span className={cn("font-black text-foreground", isList ? "text-3xl" : "text-lg")}>
                {product.prix.toFixed(2)}€
              </span>
            )}
          </div>

          {isList && (
            <Link href={`/product/${product.id}`} className="px-6 py-3 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg">
              Voir le produit
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
