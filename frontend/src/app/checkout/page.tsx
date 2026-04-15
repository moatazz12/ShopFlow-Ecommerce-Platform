"use client";

import React, { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { addressService, AddressDTO } from "@/services/address.service";
import { orderService } from "@/services/order.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, MapPin, CheckCircle2, 
  ArrowLeft, Plus, ShieldCheck, Loader2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { BackButton } from "@/components/ui/back-button";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cart, clearCart } = useCart();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNewAddressFormOpen, setIsNewAddressFormOpen] = useState(false);
  
  // New Address State
  const [newAddress, setNewAddress] = useState<AddressDTO>({
    rue: "", ville: "", codePostal: "", pays: "", principal: false, type: "SHIPPING"
  });

  const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getMyAddresses(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (addressId: number) => orderService.checkout({ paymentSuccess: true, shippingAddressId: addressId }),
    onSuccess: () => {
      setIsSuccess(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: AddressDTO) => addressService.addAddress(data),
    onSuccess: (data) => {
      setSelectedAddressId(data.id || null);
      setIsNewAddressFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    }
  });

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      if (!isSuccess) {
        router.push("/cart");
      }
    }
  }, [cart, isSuccess, router]);

  // Sélection automatique de l'adresse principale
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const principal = addresses.find(a => a.principal);
      if (principal) {
        setSelectedAddressId(principal.id!);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0].id!);
      }
    }
  }, [addresses, selectedAddressId]);

  if (!cart || cart.items.length === 0) {
    if (isSuccess) return <SuccessState />;
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col gap-6 mb-12">
          <BackButton href="/cart" label="Retour au panier" />
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Finaliser ma <span className="text-primary">Commande</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left: Address Selection */}
          <div className="space-y-12">
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-primary" />
                  Adresse de livraison
                </h2>
                <button 
                  onClick={() => setIsNewAddressFormOpen(!isNewAddressFormOpen)}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Nouvelle adresse
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {isLoadingAddresses ? (
                  <div className="h-24 bg-muted animate-pulse rounded-2xl" />
                ) : addresses?.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id!)}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                      selectedAddressId === addr.id 
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                        : "border-border hover:border-border-foreground"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-lg mb-1">{addr.rue}</p>
                        <p className="text-muted-foreground text-sm">{addr.codePostal} {addr.ville}, {addr.pays}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* New Address Form */}
              <AnimatePresence>
                {isNewAddressFormOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-6"
                  >
                    <div className="p-8 bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem] border border-border space-y-6">
                      <h3 className="font-bold text-lg mb-2">Détails de la nouvelle adresse</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rue et numéro</label>
                          <input 
                            placeholder="Ex: 123 Avenue des Champs-Élysées" 
                            className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary focus:bg-background transition-all"
                            value={newAddress.rue}
                            onChange={(e) => setNewAddress({...newAddress, rue: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Code Postal</label>
                            <input 
                              placeholder="Ex: 75008" 
                              className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary focus:bg-background transition-all"
                              value={newAddress.codePostal}
                              onChange={(e) => setNewAddress({...newAddress, codePostal: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ville</label>
                            <input 
                              placeholder="Ex: Paris" 
                              className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary focus:bg-background transition-all"
                              value={newAddress.ville}
                              onChange={(e) => setNewAddress({...newAddress, ville: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pays</label>
                          <input 
                            placeholder="Ex: France, Belgique..." 
                            className="w-full p-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary focus:bg-background transition-all"
                            value={newAddress.pays}
                            onChange={(e) => setNewAddress({...newAddress, pays: e.target.value})}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => addAddressMutation.mutate(newAddress)}
                        disabled={addAddressMutation.isPending || !newAddress.rue || !newAddress.ville || !newAddress.codePostal || !newAddress.pays}
                        className="w-full h-14 mt-4 bg-foreground text-background font-black rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center shadow-lg shadow-foreground/10 disabled:opacity-50"
                      >
                        {addAddressMutation.isPending ? <Loader2 className="animate-spin" /> : "Enregistrer cette adresse"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
                <CreditCard className="w-6 h-6 text-primary" />
                Mode de paiement
              </h2>
              <div className="p-6 bg-zinc-900 text-white rounded-[2rem] border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center font-black italic text-[10px] text-zinc-500 border border-zinc-700">SHOPPAY</div>
                  <div>
                    <p className="font-bold sm:text-base text-xs">ShopFlow Pay (Simulé)</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Zéro frais de transaction</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </section>
          </div>

          {/* Right: Summary & Action */}
          <div>
            <div className="p-10 bg-white dark:bg-zinc-900 border border-border rounded-[2.5rem] shadow-2xl sticky top-24 space-y-8">
              <h3 className="text-2xl font-black tracking-tighter uppercase italic">Mon <span className="text-primary italic">Panier</span></h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div>
                      <p className="font-bold text-sm leading-none">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Qté: {item.quantity} × {(item.unitPrice || 0).toFixed(2)}€</p>
                    </div>
                    <p className="font-black text-primary">{(item.lineTotal || 0).toFixed(2)}€</p>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-border space-y-4">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Sous-total</span>
                  <span>{(cart.subtotalAmount || 0).toFixed(2)}€</span>
                </div>
                {(cart.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-500 font-medium">
                    <span>Réduction</span>
                    <span>-{(cart.discountAmount || 0).toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Livraison</span>
                  <span className="text-green-500 uppercase text-xs font-bold">{(cart.shippingFee || 0).toFixed(2)}€</span>
                </div>
                <div className="pt-4 flex justify-between items-end">
                  <span className="text-lg font-bold">Total Final</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">{(cart.totalAmount || 0).toFixed(2)}€</span>
                </div>
              </div>

              <button 
                onClick={() => selectedAddressId && checkoutMutation.mutate(selectedAddressId)}
                disabled={!selectedAddressId || checkoutMutation.isPending}
                className="w-full h-16 bg-primary text-white rounded-2xl font-black text-lg disabled:opacity-50 hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
              >
                {checkoutMutation.isPending ? <Loader2 className="animate-spin" /> : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    Confirmer la commande
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                <AlertCircle className="w-3 h-3" />
                <span>Paiement 100% sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-32 h-32 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-10 shadow-2xl shadow-green-500/20"
      >
        <CheckCircle2 className="w-16 h-16" />
      </motion.div>
      <h1 className="text-5xl font-black tracking-tighter mb-6 uppercase italic">
        MERCI POUR VOTRE <span className="text-primary italic">CONFIANCE</span>
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mb-12 leading-relaxed font-medium">
        Votre commande a été validée avec succès ! Nos équipes préparent déjà votre colis avec passion. Vous recevrez un mail de confirmation d'ici quelques instants.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/orders" className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          Suivre mes commandes
        </Link>
        <Link href="/" className="px-10 py-4 bg-muted text-foreground rounded-2xl font-black hover:bg-border transition-all">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
