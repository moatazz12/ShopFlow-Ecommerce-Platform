"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ProductDTO } from "@/types";
import { toast } from "sonner";

interface WishlistContextType {
  items: ProductDTO[];
  addToWishlist: (product: ProductDTO) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: ProductDTO) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ProductDTO[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("shopflow_wishlist");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("shopflow_wishlist", JSON.stringify(items));
  }, [items]);

  const addToWishlist = (product: ProductDTO) => {
    if (!items.find((i) => i.id === product.id)) {
      setItems([...items, product]);
      toast.success(`${product.nom} ajouté à vos favoris !`, {
        icon: "❤️",
      });
    }
  };

  const removeFromWishlist = (productId: number) => {
    const product = items.find(i => i.id === productId);
    setItems(items.filter((i) => i.id !== productId));
    if (product) {
        toast.info(`${product.nom} retiré de vos favoris.`);
    }
  };

  const isInWishlist = (productId: number) => {
    return items.some((i) => i.id === productId);
  };

  const toggleWishlist = (product: ProductDTO) => {
    if (isInWishlist(product.id!)) {
      removeFromWishlist(product.id!);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{ items, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
