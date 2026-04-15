"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, Package, Truck, 
  CheckCircle2, Clock, 
  Loader2, Filter, AlertCircle,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
  "PENDING": { icon: Clock, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "En attente" },
  "PAID": { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "Payée" },
  "PROCESSING": { icon: Package, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "Confirmée" },
  "SHIPPED": { icon: Truck, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", label: "Expédiée" },
  "DELIVERED": { icon: CheckCircle2, color: "text-green-500 bg-green-500/10 border-green-500/20", label: "Livrée" },
  "CANCELLED": { icon: AlertCircle, color: "text-red-500 bg-red-500/10 border-red-500/20", label: "Annulée" },
};

function StatusDropdown({ currentStatus, onSelect }: { currentStatus: string, onSelect: (status: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const config = statusConfig[currentStatus] || statusConfig["PENDING"];
  const StatusIcon = config.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border-2 transition-all shadow-lg min-w-[220px] bg-background",
          config.color,
          isOpen ? "border-current ring-4 ring-current/10 scale-95" : "border-current/20 hover:border-current"
        )}
      >
        <div className="flex items-center gap-2">
           <StatusIcon className="w-4 h-4" />
           <span>{config.label}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 right-0 top-full mt-2 w-full min-w-[240px] bg-background border border-border rounded-[2.5rem] shadow-2xl overflow-hidden p-2 backdrop-blur-xl"
          >
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isSelected = key === currentStatus;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onSelect(key);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                    isSelected ? cfg.color : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isSelected ? "bg-background/20" : cfg.color)}>
                     <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left">{cfg.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SellerOrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => orderService.getReceivedOrders(),
    refetchInterval: 3000, // Rafraîchit toutes les 3 secondes pour le temps réel
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) =>
      orderService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Chargement de vos ventes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <BackButton href="/seller/dashboard" label="Tableau de bord" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Commandes <span className="text-primary italic">Reçues</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Gérez vos expéditions et suivez vos performances de vente.</p>
          </div>
          <div className="flex items-center gap-4 bg-background border border-border px-6 py-3 rounded-2xl shadow-sm">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-sm">{orders?.length || 0} Ventes au total</span>
          </div>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="py-24 text-center bg-background/50 backdrop-blur-xl border border-border rounded-[3rem] px-4 shadow-2xl">
             <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Aucune vente <span className="text-primary italic">reçue</span></h3>
             <p className="text-muted-foreground max-w-sm mx-auto font-medium">Votre boutique attend ses premiers clients. Ajoutez des produits pour booster vos chances !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence>
              {orders.map((order) => {
                const config = statusConfig[order.status] || statusConfig["PENDING"];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-background border border-border/60 rounded-[3rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                  >
                    <div className="p-8 md:p-10">
                      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                        {/* Status Badge Icon */}
                        <div className={cn(
                          "w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110 duration-500", 
                          config.color
                        )}>
                          <StatusIcon className="w-10 h-10" />
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                             <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-black uppercase tracking-widest">
                               REF: {order.orderNumber || `ORD-${order.id}`}
                             </span>
                             <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 opacity-60">
                               <Clock className="w-3.5 h-3.5" />
                               {order.createdAt ? new Date(order.createdAt).toLocaleDateString("fr-FR") : "Récente"}
                             </span>
                          </div>
                          <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                            Commande du <span className="text-primary">{order.customerEmail.split('@')[0]}</span>
                          </h3>
                        </div>

                        {/* Price & Action */}
                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 bg-muted/30 p-6 rounded-[2.5rem] border border-border/50">
                          <div className="text-center sm:text-right lg:text-center xl:text-right min-w-[120px]">
                             <p className="text-3xl font-black text-foreground tracking-tighter leading-none mb-1">
                               {(order.totalAmount || 0).toFixed(2)}€
                             </p>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70 italic">Montant Total</p>
                          </div>
                          
                          <div className="h-10 w-px bg-border/50 hidden sm:block lg:hidden xl:block" />

                        {/* Modern Custom Dropdown Replacement */}
                        <div className="relative group/dropdown">
                          <StatusDropdown 
                            currentStatus={order.status} 
                            onSelect={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                          />
                        </div>
                      </div>
                    </div>

                      {/* Items Grid */}
                      <div className="mt-10 pt-8 border-t border-dashed border-border/60">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                           <ShoppingBag className="w-3 h-3" />
                           Articles de la commande ({order.items.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {order.items.map((item, idx) => (
                               <div key={idx} className="flex items-center gap-5 p-4 bg-background border border-border/40 rounded-2xl hover:border-primary/30 transition-colors group/item">
                                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center border border-border group-hover/item:rotate-6 transition-transform">
                                     <Package className="w-6 h-6 text-primary" />
                                  </div>
                                  <div className="overflow-hidden">
                                     <p className="text-sm font-black truncate uppercase tracking-tight">{item.productName}</p>
                                     <p className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-2">
                                       <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">Qté: {item.quantity}</span>
                                       <span>× {(item.unitPrice || 0).toFixed(2)}€</span>
                                     </p>
                                  </div>
                               </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
