"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import {
  Package, Box, Truck, CheckCircle2,
  Clock, ArrowLeft, Download, MapPin, CreditCard, Loader2
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/orders/InvoicePDF";
import { useEffect, useState } from "react";

const statusConfig: Record<string, { icon: any, color: string, label: string, progress: number }> = {
  "PENDING": { icon: Clock, color: "text-amber-500 bg-amber-500/10 border-amber-500", label: "En attente", progress: 25 },
  "CONFIRMED": { icon: Box, color: "text-primary bg-primary/10 border-primary", label: "Confirmée", progress: 50 },
  "SHIPPED": { icon: Truck, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500", label: "Expédiée", progress: 75 },
  "DELIVERED": { icon: CheckCircle2, color: "text-green-500 bg-green-500/10 border-green-500", label: "Livrée", progress: 100 },
  "CANCELLED": { icon: Package, color: "text-red-500 bg-red-500/10 border-red-500", label: "Annulée", progress: 0 },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Chargement des détails de la commande...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Package className="w-16 h-16 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-black mb-4">Commande introuvable</h1>
        <p className="text-muted-foreground mb-8">Nous n'avons pas pu charger les détails de cette commande.</p>
        <Link href="/orders" className="text-primary font-bold hover:underline">
          Retour à mes commandes
        </Link>
      </div>
    );
  }

  const config = statusConfig[order.status] || statusConfig["PENDING"];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="p-3 bg-muted rounded-full hover:bg-muted/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">Commande <span className="text-primary italic">#{order.id}</span></h1>
              <p className="text-sm font-medium text-muted-foreground">
                Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {isMounted && order && (
            <PDFDownloadLink
              document={<InvoicePDF order={order} />}
              fileName={`Facture_ShopFlow_${order.orderNumber || order.id}.pdf`}
            >
              {({ loading }) => (
                <button
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {loading ? "Génération..." : "Télécharger la facture"}
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>

        {/* Status Tracker */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-[2.5rem] p-8 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", config.color)}>
                <StatusIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">État actuel</h3>
                <span className={cn("text-xs font-black uppercase tracking-widest", config.color.split(" ")[0])}>
                  {config.label}
                </span>
              </div>
            </div>
            {order.status !== "CANCELLED" && (
              <div className="w-full sm:w-1/2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                  <span>Préparation</span>
                  <span>Livraison</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${config.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[2.5rem] p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Box className="w-6 h-6 text-primary" />
                Articles commandés
              </h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border border-dashed">
                    <div className="flex-1">
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Qté: {item.quantity} × {(item.unitPrice || 0).toFixed(2)}€</p>
                      {item.sellerName && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-2">Vendu par {item.sellerName}</p>
                      )}
                    </div>
                    <p className="font-black text-lg">{(item.subtotal || 0).toFixed(2)}€</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[2.5rem] p-8 shadow-xl mt-8">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Livraison
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p>N° de Commande : <span className="font-bold text-foreground">{order.orderNumber || order.id}</span></p>
                <p className="mt-4">Expédié à l'adresse sélectionnée lors du paiement.</p>
              </div>
            </div>
          </div>

          {/* Payment & Shipping Summary */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[2rem] p-8 shadow-xl">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Détails du paiement
              </h3>
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total</span>
                  <span className="font-bold text-foreground">{(order.subtotalAmount || 0).toFixed(2)}€</span>
                </div>
                {(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-500 font-medium">
                    <span>Réduction</span>
                    <span className="font-bold">-{(order.discountAmount || 0).toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Frais de livraison</span>
                  <span className="font-bold text-green-500 uppercase text-xs">
                    {(order.shippingFee || 0) > 0 ? `${order.shippingFee.toFixed(2)}€` : 'Gratuit'}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes (TVA)</span>
                  <span className="font-bold text-foreground">{(order.taxAmount || 0).toFixed(2)}€</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-end">
                  <span className="font-bold text-base">Total Payé</span>
                  <span className="text-2xl font-black text-primary tracking-tighter">{(order.totalAmount || 0).toFixed(2)}€</span>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl border border-border border-dashed text-xs text-muted-foreground flex items-center justify-center gap-2">
                Statut: <span className="font-black text-green-500">PAYÉ / {order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
