"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Star, ShieldCheck, Truck,
  RotateCcw, ChevronRight, Minus, Plus,
  MessageSquare, User, Calendar, Loader2,
  Heart, CheckCircle2, Send, AlertCircle, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { productService } from "@/services/product.service";
import { ProductCard } from "@/components/product/product-card";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { ProductVariantDTO } from "@/types";
import { useWishlist } from "@/hooks/use-wishlist";
import { BackButton } from "@/components/ui/back-button";

export default function ProductDetailsPage() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const isFavorite = isInWishlist(Number(id));

  // UI state
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "add-review">("description");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDTO | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(Number(id)),
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.categoryNames[0]],
    queryFn: () => productService.getProducts({ category: product?.categoryNames[0], size: 4 }),
    enabled: !!product,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const submitReviewMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/reviews", {
        productId: Number(id),
        rating: reviewRating,
        comment: reviewComment,
      }),
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir les données partout instantanément
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["popular-products"] });

      toast.success("Avis soumis avec succès !", {
        icon: <CheckCircle2 className="w-5 h-5 text-amber-500" />,
        description: "Votre avis est en attente de modération par notre équipe et sera publié sous peu. Merci !"
      });
      setReviewComment("");
      setReviewRating(5);
      setActiveTab("reviews");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Erreur lors de la soumission de l'avis.";
      toast.error(message);
    }
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const computedPrice = () => {
    const base = product?.prixPromo && product.prixPromo < product.prix
      ? product.prixPromo
      : product?.prix ?? 0;
    return base + (selectedVariant?.prixSupplementaire ?? 0);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(Number(id), quantity, selectedVariant?.id);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="aspect-[4/5] bg-muted animate-pulse rounded-[2rem]" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-6 bg-muted animate-pulse rounded-xl w-32" />
              <div className="h-14 bg-muted animate-pulse rounded-2xl" />
              <div className="h-10 bg-muted animate-pulse rounded-xl w-48" />
              <div className="h-20 bg-muted animate-pulse rounded-2xl" />
              <div className="h-16 bg-muted animate-pulse rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Produit introuvable</h2>
        <p className="text-muted-foreground">Ce produit semble avoir disparu de nos rayons.</p>
        <Link href="/products" className="text-primary font-bold hover:underline">
          Retourner au catalogue
        </Link>
      </div>
    );
  }

  const hasPromo = product.prixPromo && product.prixPromo < product.prix;

  // Group variants by attribute (taille / couleur)
  const tailleVariants = product.variants?.filter(v => v.taille) ?? [];
  const couleurVariants = product.variants?.filter(v => v.couleur && !v.taille) ?? [];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Breadcrumb & Back */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        <BackButton
          href={from === "seller" ? "/seller/products" : "/products"}
          label={from === "seller" ? "Retour à mon inventaire" : "Retour au catalogue"}
        />
        <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={from === "seller" ? "/seller/dashboard" : "/products"}
            className="hover:text-primary transition-colors"
          >
            {from === "seller" ? "Dashboard" : "Catalogue"}
          </Link>
          {from === "seller" && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href="/seller/products" className="hover:text-primary transition-colors">Mon Inventaire</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-[200px]">{product.nom}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">

          {/* ── Gallery ─────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="aspect-[4/5] relative rounded-[2rem] overflow-hidden bg-muted border border-border shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={product.images[selectedImage] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"}
                    alt={product.nom}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
                    }}
                  />
                </motion.div>
              </AnimatePresence>
              {hasPromo && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-red-500 text-white font-black rounded-xl shadow-lg">
                  -{product.discountPercentage?.toFixed(0)}%
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "aspect-square relative rounded-2xl overflow-hidden border-2 transition-all",
                      selectedImage === idx ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-border"
                    )}
                  >
                    <Image src={img} alt={product.nom} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Details ─────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center space-y-8">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
              <ShoppingBag className="w-3 h-3" />
              <span>Boutique : {product.sellerName}</span>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight mb-4">{product.nom}</h1>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-4 h-4", s <= Math.round(product.averageRating) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                  ))}
                  <span className="font-black">{product.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({product.reviewCount} avis)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", product.stock > 0 ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {product.stock > 0 ? `${product.stock} en stock` : "Rupture de stock"}
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="pb-8 border-b border-border">
              {hasPromo ? (
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black text-primary tracking-tighter">{computedPrice().toFixed(2)}€</span>
                  <span className="text-xl text-muted-foreground line-through">{product.prix.toFixed(2)}€</span>
                </div>
              ) : (
                <span className="text-5xl font-black tracking-tighter">{computedPrice().toFixed(2)}€</span>
              )}
              {selectedVariant && selectedVariant.prixSupplementaire > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{selectedVariant.prixSupplementaire.toFixed(2)}€ pour cette variante
                </p>
              )}
            </div>

            {/* ── Variant Selection ─────────────────────────────────────────── */}
            {tailleVariants.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
                  Taille
                  {selectedVariant && <span className="text-primary ml-2">— {selectedVariant.taille}</span>}
                </p>
                <div className="flex flex-wrap gap-3">
                  {tailleVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(selectedVariant?.id === variant.id ? null : variant)}
                      disabled={variant.stock === 0}
                      className={cn(
                        "min-w-[48px] h-12 px-4 rounded-xl font-black text-sm border-2 transition-all relative",
                        variant.stock === 0
                          ? "opacity-40 cursor-not-allowed border-border text-muted-foreground line-through"
                          : selectedVariant?.id === variant.id
                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                            : "border-border hover:border-primary"
                      )}
                    >
                      {variant.taille}
                      {variant.stock === 0 && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-px bg-muted-foreground rotate-45 absolute" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {couleurVariants.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
                  Couleur
                  {selectedVariant && <span className="text-primary ml-2">— {selectedVariant.couleur}</span>}
                </p>
                <div className="flex flex-wrap gap-3">
                  {couleurVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(selectedVariant?.id === variant.id ? null : variant)}
                      title={variant.couleur || ""}
                      disabled={variant.stock === 0}
                      className={cn(
                        "px-5 py-2 rounded-xl font-bold text-sm border-2 transition-all",
                        variant.stock === 0 ? "opacity-40 cursor-not-allowed" : "",
                        selectedVariant?.id === variant.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary text-muted-foreground"
                      )}
                    >
                      {variant.couleur}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Quantity & Actions ───────────────────────────────────────── */}
            <div className="flex items-center gap-8">
              <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Quantité</span>
              <div className="flex items-center p-1 bg-muted rounded-2xl border border-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-xl transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-black text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdding || ((tailleVariants.length > 0 || couleurVariants.length > 0) && !selectedVariant)}
                className={cn(
                  "flex-1 h-16 rounded-[1.25rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50",
                  addSuccess
                    ? "bg-green-500 shadow-green-500/30 scale-[1.02]"
                    : "bg-primary text-white shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                )}
              >
                {isAdding ? <Loader2 className="animate-spin" /> : addSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-6 h-6" />
                    Ajouter au panier
                  </>
                )}
              </button>
              <button
                onClick={() => toggleWishlist(product!)}
                className={cn(
                  "h-16 w-16 bg-background border-2 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-95",
                  isFavorite
                    ? "border-red-500 text-red-500 bg-red-50 shadow-lg shadow-red-500/10"
                    : "border-border hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                )}
              >
                <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
              </button>
            </div>

            {/* USP */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border">
              {[
                { icon: Truck, label: "Livraison Express" },
                { icon: RotateCcw, label: "Retours 30 jours" },
                { icon: ShieldCheck, label: "Garanti ShopFlow" },
                { icon: MessageSquare, label: "Support 24/7" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex border-b border-border mb-12 overflow-x-auto no-scrollbar">
            {[
              { key: "description", label: "Description" },
              { key: "reviews", label: `Avis Clients (${product.reviewCount})` },
              ...(isAuthenticated && user?.role === "CUSTOMER"
                ? [{ key: "add-review", label: "✍️ Laisser un avis" }]
                : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "px-8 py-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl">
            <AnimatePresence mode="wait">

              {/* Description Tab */}
              {activeTab === "description" && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {product.description || "Aucune description disponible."}
                  </p>
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-12">
                      <h3 className="text-xl font-black uppercase tracking-tight mb-6 italic">
                        Variantes <span className="text-primary">disponibles</span>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b-2 border-border">
                              <th className="text-left py-3 px-4 font-black uppercase tracking-wider text-xs text-muted-foreground">Taille</th>
                              <th className="text-left py-3 px-4 font-black uppercase tracking-wider text-xs text-muted-foreground">Couleur</th>
                              <th className="text-left py-3 px-4 font-black uppercase tracking-wider text-xs text-muted-foreground">Stock</th>
                              <th className="text-right py-3 px-4 font-black uppercase tracking-wider text-xs text-muted-foreground">Supp.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((v) => (
                              <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-bold">{v.taille || "—"}</td>
                                <td className="py-3 px-4 font-bold">{v.couleur || "—"}</td>
                                <td className="py-3 px-4">
                                  <span className={cn(
                                    "text-xs font-black uppercase px-2 py-0.5 rounded",
                                    v.stock === 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                  )}>
                                    {v.stock === 0 ? "Épuisé" : v.stock}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-primary">
                                  {v.prixSupplementaire > 0 ? `+${v.prixSupplementaire.toFixed(2)}€` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <motion.div
                  key="rev"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {product.reviews.length > 0 ? (
                    product.reviews.map((review) => (
                      <div key={review.id} className="p-8 bg-muted/30 rounded-[2rem] border border-border">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold">{review.customerEmail.split("@")[0]}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border border-border">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed italic">"{review.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-bold text-lg mb-2">Aucun avis pour le moment</p>
                      <p className="text-sm text-muted-foreground">
                        Achetez ce produit et soyez le premier à donner votre avis !
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Add Review Tab */}
              {activeTab === "add-review" && (
                <motion.div
                  key="add-rev"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-10 bg-white dark:bg-zinc-900 border border-border rounded-[3rem] shadow-xl space-y-8 max-w-2xl"
                >
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                    Votre <span className="text-primary">Avis</span>
                  </h2>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Seuls les achats vérifiés peuvent soumettre un avis. Votre avis sera examiné avant publication.
                  </p>

                  {/* Star Rating */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 block">
                      Note globale
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "w-10 h-10 transition-colors",
                              star <= (hoverRating || reviewRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted fill-muted"
                            )}
                          />
                        </button>
                      ))}
                      <span className="ml-3 font-black text-lg text-amber-500">
                        {["", "Mauvais", "Médiocre", "Correct", "Bien", "Excellent"][reviewRating]}
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 block">
                      Votre commentaire
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={5}
                      placeholder="Décrivez votre expérience avec ce produit... qualité, livraison, conformité..."
                      className="w-full p-5 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition-all resize-none font-medium text-sm leading-relaxed"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold text-right">
                      {reviewComment.length} / 500 caractères
                    </p>
                  </div>

                  {submitReviewMutation.isError && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-bold">
                        {(submitReviewMutation.error as any)?.response?.data?.message || "Erreur lors de la soumission de l'avis."}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => submitReviewMutation.mutate()}
                    disabled={submitReviewMutation.isPending || !reviewComment.trim() || reviewComment.length < 10}
                    className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitReviewMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Soumettre mon avis
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.content.filter(p => p.id !== product.id).length > 0 && (
          <div className="mt-32">
            <h2 className="text-3xl font-black tracking-tighter mb-12 uppercase italic">
              Produits <span className="text-primary italic">Similaires</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.content
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
