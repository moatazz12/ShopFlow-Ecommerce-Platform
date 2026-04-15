"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartDTO, CartItemRequest, ProductDTO } from "@/types";
import { cartService } from "@/services/cart.service";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

interface CartContextType {
  cart: CartDTO | null;
  loading: boolean;
  addToCart: (productId: number, quantity: number, variantId?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  // Seuls les CUSTOMER ont accès au panier
  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";

  const fetchCart = async () => {
    if (isCustomer) {
      try {
        const data = await cartService.getCart();
        setCart(data);
      } catch (error: any) {
        // Si c'est un 403 ou 401, on ne pollue pas la console, c'est probablement un changement de session
        if (error.response?.status !== 403 && error.response?.status !== 401) {
          console.error("Failed to fetch cart", error);
        }
        setCart(null);
      }
    } else {
      setCart(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer]);

  const addToCart = async (productId: number, quantity: number, variantId?: number) => {
    if (isCustomer) {
      try {
        const updatedCart = await cartService.addItem({ productId, quantity, variantId });
        setCart(updatedCart);
        
        // Notification moderne et cohérente
        toast("Produit ajouté au panier", {
          icon: <ShoppingBag className="w-5 h-5 text-primary" />,
          description: `Quantité : ${quantity}`,
          position: "top-center",
        });
      } catch (error) {
        toast.error("Erreur lors de l'ajout au panier");
      }
    } else {
      console.warn("Cart only available for CUSTOMER accounts");
      toast.error("Veuillez vous connecter en tant qu'acheteur");
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (isCustomer) {
      const updatedCart = await cartService.updateQuantity(itemId, quantity);
      setCart(updatedCart);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (isCustomer) {
      await cartService.removeItem(itemId);
      await fetchCart();
    }
  };

  const clearCart = async () => {
    if (isCustomer) {
      await cartService.clearCart();
      setCart(null);
    }
  };

  const applyCoupon = async (code: string) => {
    if (isCustomer) {
      const updatedCart = await cartService.applyCoupon(code);
      setCart(updatedCart);
    }
  };

  const removeCoupon = async () => {
    if (isCustomer) {
      const updatedCart = await cartService.removeCoupon();
      setCart(updatedCart);
    }
  };

  const itemCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ 
      cart, loading, addToCart, updateQuantity, 
      removeFromCart, clearCart, applyCoupon, removeCoupon,
      itemCount 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
