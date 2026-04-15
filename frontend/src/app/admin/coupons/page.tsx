"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, Plus, Edit, Trash2, BadgePercent,
  DollarSign, Calendar, RefreshCw, CheckCircle2,
  XCircle, Loader2, Save, X, AlertCircle, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";

interface CouponDTO {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  dateExpiration: string;
  usagesMax: number;
  usagesActuels: number;
  active: boolean;
  valid: boolean;
}

interface CouponRequest {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  dateExpiration: string;
  usagesMax: number;
}

const EMPTY_FORM: CouponRequest = {
  code: "",
  discountType: "PERCENTAGE",
  value: 10,
  dateExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  usagesMax: 100,
};

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDTO | null>(null);
  const [form, setForm] = useState<CouponRequest>(EMPTY_FORM);
  const [copied, setCopied] = useState<number | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<CouponDTO | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await apiClient.get<CouponDTO[]>("/coupons");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CouponRequest) => apiClient.post("/coupons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success("Coupon créé avec succès !");
    },
    onError: () => {
      toast.error("Erreur lors de la création du coupon.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CouponRequest }) =>
      apiClient.put(`/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditingCoupon(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Coupon mis à jour !");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon supprimé.");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression.");
    }
  });

  const handleEdit = (coupon: CouponDTO) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      dateExpiration: new Date(coupon.dateExpiration).toISOString().slice(0, 16),
      usagesMax: coupon.usagesMax,
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = () => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm({ ...form, code });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Chargement des coupons...</p>
      </div>
    );
  }

  const activeCoupons = coupons?.filter(c => c.active && c.valid) ?? [];
  const expiredCoupons = coupons?.filter(c => !c.valid || !c.active) ?? [];

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <BackButton href="/admin/dashboard" label="Dashboard" />
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Gestion <span className="text-primary italic">Coupons</span>
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {activeCoupons.length} code(s) actif(s) · {coupons?.length || 0} au total
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer un coupon
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total", value: coupons?.length || 0, icon: Ticket, color: "text-primary bg-primary/10" },
            { label: "Actifs", value: activeCoupons.length, icon: CheckCircle2, color: "text-green-500 bg-green-500/10" },
            { label: "Expirés", value: expiredCoupons.length, icon: XCircle, color: "text-red-500 bg-red-500/10" },
            { label: "Utilisations", value: coupons?.reduce((sum, c) => sum + c.usagesActuels, 0) || 0, icon: RefreshCw, color: "text-amber-500 bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-6 bg-background border border-border rounded-[2rem] flex items-center gap-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{value}</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className={cn(
                "p-6 md:p-8 bg-background border-2 rounded-[3rem] shadow-2xl mb-10 space-y-6 relative overflow-hidden transition-colors duration-500 scroll-mt-24",
                editingCoupon ? "border-primary shadow-primary/10 ring-4 ring-primary/5" : "border-primary/20"
              )}
            >
              {/* Background Glow when editing */}
              {editingCoupon && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none"
                />
              )}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase italic tracking-tight">
                  {editingCoupon ? <>Modifier <span className="text-primary">{editingCoupon.code}</span></> : <>Nouveau <span className="text-primary">Coupon</span></>}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingCoupon(null); }}>
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Code */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Code Promo</label>
                  <div className="flex gap-3">
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="EX: SUMMER25"
                      className="flex-1 p-3 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-black text-lg tracking-widest transition-all"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      title="Générer un code aléatoire"
                      className="px-4 bg-muted border border-border rounded-2xl hover:bg-border transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Type de réduction</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-2xl">
                    {[
                      { value: "PERCENTAGE", label: "Pourcentage (%)", icon: BadgePercent },
                      { value: "FIXED", label: "Montant fixe (€)", icon: DollarSign },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, discountType: value as "PERCENTAGE" | "FIXED" })}
                        className={cn(
                          "flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all",
                          form.discountType === value
                            ? "bg-background shadow text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Valeur {form.discountType === "PERCENTAGE" ? "(0–100 %)" : "(€)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                    step={form.discountType === "PERCENTAGE" ? 1 : 0.01}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full p-3 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-black text-2xl transition-all"
                  />
                </div>

                {/* Expiry */}
                <div className="md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Date d'expiration
                  </label>
                  <input
                    type="datetime-local"
                    value={form.dateExpiration}
                    onChange={(e) => setForm({ ...form, dateExpiration: e.target.value })}
                    className="w-full p-3 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-bold transition-all text-sm"
                  />
                </div>

                {/* Usages */}
                <div className="md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">Utilisations maximum</label>
                  <input
                    type="number"
                    min={1}
                    value={form.usagesMax}
                    onChange={(e) => setForm({ ...form, usagesMax: Number(e.target.value) })}
                    className="w-full p-3 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-bold text-lg transition-all"
                  />
                </div>
              </div>

              {/* Preview Badge */}
              {form.code && (
                <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    {form.discountType === "PERCENTAGE" ? (
                      <BadgePercent className="w-6 h-6 text-white" />
                    ) : (
                      <DollarSign className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Aperçu du coupon</p>
                    <p className="text-xl font-black tracking-widest text-primary leading-tight">{form.code}</p>
                    <p className="font-bold text-xs text-muted-foreground">
                    {form.discountType === "PERCENTAGE" ? `−${form.value}%` : `−${form.value.toFixed(2)}€`} · Max {form.usagesMax} utilisations
                    </p>
                  </div>
                </div>
              )}

              {!form.code && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">Le code promo est obligatoire. Utilisez le bouton 🔄 pour en générer un automatiquement.</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={(createMutation.isPending || updateMutation.isPending) || !form.code}
                className="w-full h-12 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingCoupon ? "Mettre à jour" : "Créer le coupon"}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coupon List */}
        {coupons?.length === 0 ? (
          <div className="py-24 bg-background border-2 border-dashed border-border rounded-[3rem] text-center">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="font-black text-xl mb-2">Aucun coupon créé</p>
            <p className="text-muted-foreground">Créez votre premier code promo pour booster vos ventes !</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {coupons?.map((coupon) => {
                const usagePercent = (coupon.usagesActuels / coupon.usagesMax) * 100;
                const isExpired = !coupon.valid || !coupon.active;

                return (
                  <motion.div
                    key={coupon.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={cn(
                      "p-8 bg-background border rounded-[2.5rem] hover:shadow-lg transition-all group",
                      isExpired ? "border-border opacity-60" : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-8 justify-between">
                      
                      {/* Code + Type */}
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0",
                          isExpired ? "bg-muted" : "bg-primary/10"
                        )}>
                          {coupon.discountType === "PERCENTAGE" ? (
                            <BadgePercent className={cn("w-7 h-7", isExpired ? "text-muted-foreground" : "text-primary")} />
                          ) : (
                            <DollarSign className={cn("w-7 h-7", isExpired ? "text-muted-foreground" : "text-primary")} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => handleCopy(coupon.code, coupon.id)}
                              className="font-black text-2xl tracking-widest hover:text-primary transition-colors flex items-center gap-2 group/code"
                            >
                              {coupon.code}
                              {copied === coupon.id ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 opacity-0 group-hover/code:opacity-100 text-muted-foreground transition-opacity" />
                              )}
                            </button>
                            <span className={cn(
                              "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                              isExpired ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                            )}>
                              {isExpired ? "Expiré/Inactif" : "Actif"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-bold">
                            {coupon.discountType === "PERCENTAGE" ? `−${coupon.value}%` : `−${coupon.value.toFixed(2)}€`}
                            {" · "}Expire le {new Date(coupon.dateExpiration).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div className="flex-1 min-w-[180px] max-w-xs">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                          <span>Utilisation</span>
                          <span>{coupon.usagesActuels} / {coupon.usagesMax}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              usagePercent >= 90 ? "bg-red-500" : usagePercent >= 60 ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 hover:bg-muted rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setCouponToDelete(coupon)}
                          className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {couponToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCouponToDelete(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-background border border-border rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Supprimer le <span className="text-red-500">Coupon</span> ?</h3>
                <p className="text-muted-foreground font-medium">
                  Êtes-vous sûr de vouloir supprimer le code <span className="font-bold text-foreground">"{couponToDelete.code}"</span> ? Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setCouponToDelete(null)}
                  className="flex-1 px-6 py-4 bg-muted border border-border rounded-2xl font-bold hover:bg-border transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(couponToDelete.id);
                    setCouponToDelete(null);
                  }}
                  className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95 text-xs"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
