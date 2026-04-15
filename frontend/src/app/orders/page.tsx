"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { motion } from "framer-motion";
import { 
  Package, Box, Truck, CheckCircle2, 
  Clock, ChevronRight, ShoppingBag, Loader2, XCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
  "PENDING": { icon: Clock, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "En attente" },
  "PAID": { icon: CheckCircle2, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "Payée" },
  "PROCESSING": { icon: Package, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", label: "Confirmée" },
  "SHIPPED": { icon: Truck, color: "text-purple-500 bg-purple-500/10 border-purple-500/20", label: "Expédiée" },
  "DELIVERED": { icon: CheckCircle2, color: "text-green-500 bg-green-500/10 border-green-500/20", label: "Livrée" },
  "CANCELLED": { icon: XCircle, color: "text-red-500 bg-red-500/10 border-red-500/20", label: "Annulée" },
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.getMyOrders(),
    refetchInterval: 3000, // Rafraîchit toutes les 3 secondes pour le temps réel client
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Récupération de vos commandes...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-4">AUCUNE COMMANDE <span className="text-primary italic">TROUVÉE</span></h1>
        <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
          Vous n'avez pas encore passé de commande. C'est le moment idéal pour commencer votre shopping !
        </p>
        <Link href="/products" className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          Parcourir les produits
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-black tracking-tighter mb-12 uppercase italic">Mes <span className="text-primary italic">Commandes</span></h1>

        <div className="space-y-6">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig["PENDING"];
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-zinc-900 border border-border rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", config.color)}>
                    <StatusIcon className="w-8 h-8" />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2 justify-center sm:justify-start">
                      <h3 className="text-xl font-bold">Commande #{order.id}</h3>
                      <span className="text-sm text-muted-foreground font-medium">du {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                      <span className={cn("px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm", config.color)}>
                        {config.label}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        {order.items.length} {order.items.length > 1 ? "articles" : "article"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-center sm:items-end gap-3">
                    <p className="text-2xl font-black text-foreground tracking-tighter">{(order.totalAmount || 0).toFixed(2)}€</p>
                    <Link 
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline group-hover:gap-3 transition-all"
                    >
                      Détails de la commande
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                
                {/* Micro preview items */}
                <div className="px-8 py-4 bg-muted/30 border-t border-border flex items-center gap-4 overflow-x-auto no-scrollbar">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter shrink-0">Articles :</p>
                    {order.items.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-background border border-border rounded-lg text-xs font-bold whitespace-nowrap">
                        {item.productName} (x{item.quantity})
                      </span>
                    ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
