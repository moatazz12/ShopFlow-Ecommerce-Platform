"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { motion } from "framer-motion";
import {
  TrendingUp, Package, AlertTriangle,
  ArrowUpRight, ShoppingBag, Plus,
  Settings, DollarSign
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import { DashboardStatsSkeleton } from "@/components/ui/skeleton";

export default function SellerDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["seller-stats"],
    queryFn: () => dashboardService.getSellerStats(),
    refetchInterval: 5000, // Mise à jour automatique des revenus et alertes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="h-12 bg-muted animate-pulse rounded-2xl w-64 mb-12" />
          <DashboardStatsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <BackButton href="/" label="Accueil" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Mon Espace <span className="text-primary italic">Vendeur</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Bienvenue sur votre centre de pilotage ShopFlow.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/seller/products/new" className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouveau produit
            </Link>
            <Link
              href="/profile"
              className="p-3 bg-background border border-border rounded-xl hover:bg-muted hover:border-primary/50 transition-all group"
              title="Mon Profil"
            >
              <Settings className="w-5 h-5 text-muted-foreground group-hover:rotate-90 group-hover:text-primary transition-all duration-500" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-background border border-border rounded-[2.5rem] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black bg-green-500/10 text-green-500 px-2 py-1 rounded-lg flex items-center gap-1">
                +12% <TrendingUp className="w-3 h-3" />
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Chiffre d'affaires</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats?.revenue.toFixed(2)}€</h3>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-background border border-border rounded-[2.5rem] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <Link href="/seller/orders" className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                VOIR TOUT <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Commandes en attente</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats?.pendingOrders}</h3>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-background border border-border rounded-[2.5rem] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Alertes Stock</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats?.lowStockAlerts.length}</h3>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Low Stock Alerts */}
          <section className="p-10 bg-white dark:bg-zinc-900 border border-border rounded-[3rem] shadow-xl">
            <h2 className="text-2xl font-black tracking-tighter mb-8 flex items-center gap-3 italic">
              STOCKS À <span className="text-amber-500 italic uppercase">Surveiller</span>
            </h2>
            <div className="space-y-4">
              {stats?.lowStockAlerts.length === 0 ? (
                <p className="text-muted-foreground italic">Aucune alerte de stock. Tout est sous contrôle !</p>
              ) : stats?.lowStockAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border/50 hover:border-amber-500/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-bold text-sm">{alert}</span>
                  </div>
                  <Link href="/seller/products" className="text-[10px] font-black text-primary hover:underline">RÉAPPROVISIONNER</Link>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <Link href="/seller/products" className="p-8 bg-primary text-white rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20">
                <Package className="w-10 h-10" />
                <span className="font-black uppercase text-xs tracking-widest">Gérer mes produits</span>
              </Link>
              <Link href="/seller/orders" className="p-8 bg-background border border-border rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 hover:scale-[1.02] transition-all">
                <ShoppingBag className="w-10 h-10 text-primary" />
                <span className="font-black uppercase text-xs tracking-widest">Commandes reçues</span>
              </Link>
            </div>

            <div className="p-10 bg-gradient-to-br from-primary/10 via-background to-background rounded-[3rem] border border-primary/10 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[50px] rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />

              <div className="relative z-10 flex flex-col gap-5">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-foreground uppercase italic mb-2">
                    Conseil <span className="text-primary italic">Expert</span>
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                    Optimisez vos ventes : des photos haute résolution et des descriptions détaillées augmentent votre taux de conversion de <span className="text-primary font-bold">35%</span>. Prenez le temps de soigner chaque fiche produit !
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 text-primary/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <ShoppingBag className="w-32 h-32" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
