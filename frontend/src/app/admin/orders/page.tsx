"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, Loader2, Search,
  Package, Truck, CheckCircle, XCircle, AlertCircle, Clock, ChevronRight,
  ChevronDown, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { OrderDTO } from "@/types";
import { BackButton } from "@/components/ui/back-button";

const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
  "PENDING": { icon: Clock, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "En attente" },
  "PAID": { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "Payée" },
  "PROCESSING": { icon: Package, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "Confirmée" },
  "SHIPPED": { icon: Truck, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", label: "Expédiée" },
  "DELIVERED": { icon: CheckCircle2, color: "text-green-500 bg-green-500/10 border-green-500/20", label: "Livrée" },
  "CANCELLED": { icon: AlertCircle, color: "text-red-500 bg-red-500/10 border-red-500/20", label: "Annulée" },
};

function StatusDropdown({ currentStatus, onSelect, disabled }: { currentStatus: string, onSelect: (status: string) => void, disabled?: boolean }) {
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

  if (disabled) {
    return (
      <div className={cn("flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border-2 bg-muted opacity-50", config.color)}>
        <StatusIcon className="w-4 h-4" />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border-2 transition-all shadow-lg w-full bg-background",
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

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await apiClient.get<OrderDTO[]>("/orders");
      return res.data;
    },
    refetchInterval: 3000, // Rafraîchissement automatique Admin
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiClient.put(`/orders/${orderId}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Statut mis à jour : ${variables.status}`);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Chargement des commandes globales...</p>
      </div>
    );
  }

  const filteredOrders = orders?.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "PAID": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "PROCESSING": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "SHIPPED": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "DELIVERED": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "PENDING": return "En attente";
      case "PAID": return "Payée";
      case "PROCESSING": return "Confirmée";
      case "SHIPPED": return "Expédiée";
      case "DELIVERED": return "Livrée";
      case "CANCELLED": return "Annulée";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "PENDING": return <Clock className="w-4 h-4" />;
      case "PAID": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "PROCESSING": return <Package className="w-4 h-4 text-blue-500" />;
      case "SHIPPED": return <Truck className="w-4 h-4 text-indigo-500" />;
      case "DELIVERED": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "CANCELLED": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <BackButton href="/admin/dashboard" label="Admin Panel" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Gestion <span className="text-primary italic">Commandes</span>
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Surveillance et gestion de toutes les commandes ShopFlow.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-primary/10 text-primary px-6 py-3 rounded-2xl border border-primary/20">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-bold text-sm">{orders?.length || 0} commandes totales</span>
          </div>
        </div>

        <div className="relative mb-10 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Rechercher par N° de commande ou email client..." 
            className="w-full h-14 bg-background border-2 border-border rounded-2xl pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredOrders?.length === 0 ? (
          <div className="py-24 bg-background border border-border rounded-[3rem] flex flex-col items-center text-center px-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
              Aucune <span className="text-primary">Commande</span>
            </h3>
            <p className="text-muted-foreground max-w-sm">Aucune commande ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {filteredOrders?.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-8 bg-background border border-border rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-8 justify-between">
                    
                    {/* Infos Commande */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className="text-lg font-black tracking-widest bg-muted px-4 py-1 rounded-xl">
                          {order.orderNumber}
                        </span>
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm",
                          getStatusColor(order.status)
                        )}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client</p>
                          <p className="font-bold">{order.customerEmail}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                          <p className="font-bold">{new Date(order.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                          Articles ({order.items.length})
                        </p>
                        <div className="flex flex-col gap-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-medium">
                              <span>{item.quantity}x {item.productName}</span>
                              <span className="text-muted-foreground">{(item.unitPrice * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Total */}
                    <div className="lg:w-72 flex flex-col justify-between bg-muted/30 p-6 rounded-[2rem] border border-border/50">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-right">
                          Total Commande
                        </p>
                        <h3 className="text-4xl font-black tracking-tighter text-right">
                          {order.totalAmount.toFixed(2)}€
                        </h3>
                      </div>
                      
                      <div className="mt-8 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                          Modifier le statut
                        </p>
                        <div className="relative">
                          <StatusDropdown 
                            currentStatus={order.status}
                            onSelect={(status) => updateStatusMutation.mutate({ 
                              orderId: order.id!, 
                              status 
                            })}
                            disabled={
                              updateStatusMutation.isPending || 
                              order.status === "DELIVERED" || 
                              order.status === "CANCELLED"
                            }
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
