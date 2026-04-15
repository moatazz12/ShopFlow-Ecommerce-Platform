"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Trash2, Minus, Plus,
  ArrowRight, Tag, Loader2, ArchiveX, CheckCircle2, XCircle, X, Truck
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { cartService } from "@/services/cart.service";
import { BackButton } from "@/components/ui/back-button";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode("");
      toast.success("Code promo appliqué !", {
        icon: <Tag className="w-5 h-5 text-green-500" />,
        description: "Votre réduction a été calculée sur le total."
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Code promo invalide", {
        icon: <XCircle className="w-5 h-5 text-red-500" />
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success("Code promo retiré");
    } catch (err) {
      toast.error("Erreur lors de la suppression du coupon");
    }
  };

  if (!isMounted) {
    return null; // Évite les erreurs d'hydratation (SSR / Client divergence)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Récupération de votre panier...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-12">
            <BackButton href="/products" label="Continuer mes achats" />
          </div>
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
              <ArchiveX className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-4">VOTRE PANIER EST <span className="text-primary italic">VIDE</span></h1>
            <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
              Il semblerait que vous n'ayez pas encore craqué pour nos pépites. Explorez notre catalogue et trouvez votre bonheur !
            </p>
            <Link href="/products" className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Découvrir nos produits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-6 mb-12">
          <BackButton href="/products" label="Continuer mes achats" />
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Mon <span className="text-primary italic">Panier</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence>
              {cart.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-border shadow-sm group hover:shadow-xl transition-all"
                >
                  <div className="w-32 h-32 relative rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={item.productImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 className="text-lg font-bold line-clamp-1">{item.productName}</h3>
                    {item.variantLabel && (
                      <p className="text-xs font-bold text-primary mb-1">
                        Variante : {item.variantLabel}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">{(item.unitPrice || 0).toFixed(2)}€ / unité</p>

                    <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
                      <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-lg transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-lg transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-primary">{(item.lineTotal || 0).toFixed(2)}€</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={clearCart}
              className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-red-500 transition-colors"
            >
              Vider le panier
            </button>
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            {/* Free Shipping Progress */}
            <div className="mb-6 p-6 bg-white dark:bg-zinc-900 border border-border rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Livraison offerte
                </span>
                <span className="text-sm font-bold text-primary">
                  {cart.subtotalAmount >= 50 ? (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest"
                    >
                      <Truck className="w-3 h-3" />
                      Offerte
                    </motion.span>
                  ) : (
                    <span className="font-black text-primary italic">{(50 - cart.subtotalAmount).toFixed(2)}€ restants</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((cart.subtotalAmount / 50) * 100, 100)}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    cart.subtotalAmount >= 50 ? "bg-green-500" : "bg-primary"
                  )}
                />
              </div>
              <p className="mt-3 text-[10px] font-bold text-muted-foreground leading-relaxed">
                {cart.subtotalAmount >= 50
                  ? "Félicitations ! Vous bénéficiez de la livraison gratuite sur cette commande."
                  : "Ajoutez encore quelques articles pour débloquer la livraison gratuite dès 50€ d'achat !"}
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-zinc-900 border border-border text-foreground rounded-[2.5rem] shadow-xl sticky top-24">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                Récapitulatif
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total HT</span>
                  <span className="font-bold text-foreground">{(cart.subtotalAmount || 0).toFixed(2)}€</span>
                </div>
                {(cart.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Réduction</span>
                    <span className="font-bold font-mono">-{(cart.discountAmount || 0).toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Livraison</span>
                  <span className="font-bold text-green-500 uppercase text-xs">{(cart.shippingFee || 0).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>TVA (20%)</span>
                  <span className="font-bold text-foreground">{(cart.taxAmount || 0).toFixed(2)}€</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-end">
                  <span className="text-lg font-bold">Total TTC</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{(cart.totalAmount || 0).toFixed(2)}€</span>
                </div>
              </div>

              {/* Coupon Form */}
              <div className="mb-8">
                {(cart.discountAmount || 0) > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 leading-none mb-1">Coupon Appliqué</p>
                        <p className="font-bold text-sm text-green-700">Réduction active</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-2 hover:bg-green-500/20 rounded-xl transition-colors text-green-600"
                      title="Retirer le coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleApplyCoupon}>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Code Promo"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full h-12 bg-muted/50 border-2 border-transparent rounded-2xl pl-11 pr-20 text-sm font-bold focus:border-primary focus:bg-background outline-none transition-all"
                      />
                      <button
                        disabled={isApplyingCoupon || !couponCode}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isApplyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Appliquer"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <Link
                href="/checkout"
                className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                Payer maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="mt-8 text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold">
                Paiement 100% sécurisé via ShopFlow Pay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
