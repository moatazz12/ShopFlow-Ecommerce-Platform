"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Zap, ShieldCheck, ArrowRight, Loader2, Package, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { ProductCard } from "@/components/product/product-card";
import Link from "next/link";

export default function Home() {
  const { data: popularProducts, isLoading } = useQuery({
    queryKey: ["popular-products"],
    queryFn: () => productService.getProducts({ size: 8, sortBy: "popularity" }),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Background glow effects */}
          <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-primary/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />

          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">


              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl sm:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
              >
                L'excellence du <br /> <span className="text-primary italic">E-Commerce</span> réinventée.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed"
              >
                Découvrez une plateforme fluide, sécurisée et élégante. Achetez vos produits préférés avec l'expérience la plus premium du web.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-5"
              >
                <Link href="/products" className="px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-95">
                  Explorer le catalogue
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/register?role=SELLER" className="px-10 py-4 bg-background border-2 border-border text-foreground rounded-2xl font-bold hover:bg-accent transition-all active:scale-95">
                  Vendre sur ShopFlow
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Popular Products Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">LES PLUS <span className="text-primary italic">VENDUS</span></h2>
                <p className="text-muted-foreground mt-2">Découvrez les tendances du moment sélectionnés pour vous.</p>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-sm font-bold hover:text-primary transition-all">
                Tout voir <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Chargement des produits...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {popularProducts?.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-20 border-y border-border bg-muted/30 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
              <motion.div
                whileHover={{ y: -5 }}
                className="flex items-center gap-6"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center shadow-xl">
                  <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Achats sécurisés</h3>
                  <p className="text-muted-foreground">Paiements chiffrés et 100% garantis</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="flex items-center gap-6"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center shadow-xl">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Qualité vérifiée</h3>
                  <p className="text-muted-foreground">Vendeurs certifiés par nos experts</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="flex items-center gap-6"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center shadow-xl">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Livraison Éclair</h3>
                  <p className="text-muted-foreground">Expédition express sous 24 heures</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
