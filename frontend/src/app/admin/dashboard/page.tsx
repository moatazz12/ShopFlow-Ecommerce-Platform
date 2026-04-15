"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { motion } from "framer-motion";
import {
  Globe, TrendingUp, Users,
  ShoppingBag, Star, ArrowUpRight,
  Activity, Loader2, DollarSign
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => dashboardService.getAdminStats(),
    refetchInterval: 5000, // Surveillance en temps réel du CA et des commandes
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Agrégation des statistiques globales...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="font-bold text-red-500">Erreur lors du chargement des statistiques.</p>
        <p className="text-muted-foreground text-sm">Vérifiez que le backend est démarré sur le port 8095.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <BackButton href="/" label="Accueil" />
        </div>
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control <span className="text-primary italic">Center</span></h1>
          <p className="text-muted-foreground mt-2 font-medium">Surveillance globale de l'écosystème ShopFlow.</p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 bg-primary text-white rounded-[3rem] shadow-2xl shadow-primary/30 relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col gap-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">Chiffre d'affaires Global</p>
                <h3 className="text-4xl font-black tracking-tighter">{(stats?.globalRevenue ?? 0).toFixed(2)}€</h3>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-10 bg-background border border-border rounded-[3rem] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Activité intense</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Commandes Récentes</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats?.recentOrders?.length ?? 0}</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-10 bg-background border border-border rounded-[3rem] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Top Produits</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats?.topProducts?.length ?? 0}</h3>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Top Sellers */}
          <section className="p-12 bg-white dark:bg-zinc-900 border border-border rounded-[3.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black tracking-tighter italic uppercase underline decoration-primary decoration-4 underline-offset-8">Top <span className="text-primary italic underline-none">Vendeurs</span></h2>
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {(stats?.topSellers ?? []).length === 0 ? (
                <p className="text-muted-foreground italic text-sm">Aucune donnée de vente disponible.</p>
              ) : (stats?.topSellers ?? []).map((seller, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border/50 group hover:border-primary transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center font-black text-sm border border-border shadow-sm group-hover:scale-110 transition-transform">
                      #{idx + 1}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{seller}</span>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </section>

          {/* Top Products */}
          <section className="p-12 bg-white dark:bg-zinc-900 border border-border rounded-[3.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black tracking-tighter italic uppercase underline decoration-primary decoration-4 underline-offset-8">Produits <span className="text-primary italic">Stars</span></h2>
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {(stats?.topProducts ?? []).length === 0 ? (
                <p className="text-muted-foreground italic text-sm">Aucun produit vendu pour le moment.</p>
              ) : (stats?.topProducts ?? []).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border/50 group hover:border-primary transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{product}</span>
                  </div>
                  <Link href="/products" className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">Voir l'article</Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Orders */}
        {(stats?.recentOrders ?? []).length > 0 && (
          <section className="mt-12 p-12 bg-white dark:bg-zinc-900 border border-border rounded-[3.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black tracking-tighter italic uppercase underline decoration-primary decoration-4 underline-offset-8">
                Commandes <span className="text-primary italic">Récentes</span>
              </h2>
              <Link href="/admin/orders" className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline flex items-center gap-1">
                TOUT VOIR <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {(stats?.recentOrders ?? []).map((orderStr, idx) => {
                // Fonction de traduction locale pour les chaînes du backend
                const translateStatus = (str: string) => {
                  return str
                    .replace(/PENDING/g, "EN ATTENTE")
                    .replace(/PAID/g, "PAYÉE")
                    .replace(/PROCESSING/g, "CONFIRMÉE")
                    .replace(/SHIPPED/g, "EXPÉDIÉE")
                    .replace(/DELIVERED/g, "LIVRÉE")
                    .replace(/CANCELLED/g, "ANNULÉE");
                };

                const translatedOrder = translateStatus(orderStr);
                const isConfirmed = translatedOrder.includes("CONFIRMÉE");
                const isShipped = translatedOrder.includes("EXPÉDIÉE");
                const isDelivered = translatedOrder.includes("LIVRÉE");

                return (
                  <div key={idx} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border/50 group hover:border-primary transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        isDelivered ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                        isShipped ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" :
                        isConfirmed ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-primary animate-pulse"
                      )} />
                      <span className="font-bold text-sm tracking-tight uppercase">{translatedOrder}</span>
                    </div>
                    <Link href="/admin/orders" className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">Détails</Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
          <Link href="/admin/users" className="p-8 bg-background border border-border rounded-[2rem] flex flex-col items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all text-center group">
            <Users className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-black text-[11px] uppercase tracking-widest leading-none">Utilisateurs</span>
          </Link>
          <Link href="/admin/categories" className="p-8 bg-background border border-border rounded-[2rem] flex flex-col items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all text-center group">
            <Globe className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-black text-[11px] uppercase tracking-widest leading-none">Catégories</span>
          </Link>
          <Link href="/admin/reviews" className="p-8 bg-background border border-border rounded-[2rem] flex flex-col items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all text-center group">
            <Star className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-black text-[11px] uppercase tracking-widest leading-none">Avis</span>
          </Link>
          <Link href="/admin/coupons" className="p-8 bg-background border border-border rounded-[2rem] flex flex-col items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all text-center group">
            <TrendingUp className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-black text-[11px] uppercase tracking-widest leading-none">Coupons</span>
          </Link>
          <Link href="/admin/orders" className="p-8 bg-background border border-border rounded-[2rem] flex flex-col items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all text-center group">
            <ShoppingBag className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-black text-[11px] uppercase tracking-widest leading-none">Commandes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
