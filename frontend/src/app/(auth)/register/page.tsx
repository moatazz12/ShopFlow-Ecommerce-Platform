"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, Mail, Lock, User, Store, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Role } from "@/types";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Si on arrive sur la page register et qu'on est déjà connecté, on ferme la session
  // pour éviter les conflits et permettre un nouvel enregistrement propre.
  useEffect(() => {
    if (isAuthenticated) {
      logout("/register");
    }
  }, [isAuthenticated, logout]);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    shopName: "",
    shopDescription: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/[A-Z]/.test(pass)) return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/[0-9]/.test(pass)) return "Le mot de passe doit contenir au moins un chiffre.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation locale
    if (!validateEmail(formData.email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    const passError = validatePassword(formData.password);
    if (passError) {
      setError(passError);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      // Appel direct à l'API register sans auto-login
      await authService.register({ ...formData, role });
      // Redirection vers /login avec l'email prérempli et flag registered
      router.push(`/login?email=${encodeURIComponent(formData.email)}&registered=true`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Une erreur est survenue lors de l'inscription.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-border"
      >
        {/* Progress Sidebar (Desktop) */}
        <div className="hidden md:flex w-72 relative overflow-hidden flex-col justify-between text-white p-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=2070')" }}
          />
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-12 shadow-xl">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-8">
              <div className="flex gap-4 items-center group">
                <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all",
                    step >= 1 ? "bg-white text-primary border-white" : "border-white/30 text-white/30"
                )}>1</div>
                <span className={cn("font-medium", step >= 1 ? "text-white" : "text-white/30")}>Rôle</span>
              </div>
              <div className="flex gap-4 items-center group">
                <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all",
                    step >= 2 ? "bg-white text-primary border-white" : "border-white/30 text-white/30"
                )}>2</div>
                <span className={cn("font-medium", step >= 2 ? "text-white" : "text-white/30")}>Profil</span>
              </div>
              <div className="flex gap-4 items-center group">
                <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all",
                    step >= 3 ? "bg-white text-primary border-white" : "border-white/30 text-white/30"
                )}>3</div>
                <span className={cn("font-medium", step >= 3 ? "text-white" : "text-white/30")}>Sécurité</span>
              </div>
            </div>
          </div>
          <p className="relative z-10 text-white/40 text-[10px] font-bold uppercase tracking-widest">© 2026 ShopFlow Inc.</p>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-8 md:p-12">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">Rejoignez la communauté ShopFlow aujourd'hui.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground block">Je souhaite être :</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("CUSTOMER")}
                      className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                        role === "CUSTOMER" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <User className={cn("w-8 h-8 mb-3 transition-all", role === "CUSTOMER" ? "text-primary" : "text-muted-foreground")} />
                      <h3 className="font-bold">Acheteur</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">Pour parcourir et acheter des produits.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("SELLER")}
                      className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                        role === "SELLER" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <Store className={cn("w-8 h-8 mb-3 transition-all", role === "SELLER" ? "text-primary" : "text-muted-foreground")} />
                      <h3 className="font-bold">Vendeur</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">Pour vendre vos produits et gérer votre boutique.</p>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full mt-6 flex items-center justify-center h-12 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-xl font-bold hover:scale-[1.02] transition-all active:scale-95"
                  >
                    Continuer
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Prénom</label>
                        <input name="prenom" required value={formData.prenom} onChange={handleChange} placeholder="Jean" className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nom</label>
                        <input name="nom" required value={formData.nom} onChange={handleChange} placeholder="Dupont" className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium" />
                      </div>
                  </div>
                  {role === "SELLER" && (
                    <div className="space-y-4 pt-2 border-t border-border">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nom de la boutique</label>
                          <input name="shopName" required value={formData.shopName} onChange={handleChange} placeholder="Ma Boutique Premium" className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-primary" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <textarea name="shopDescription" value={formData.shopDescription} onChange={handleChange} placeholder="Décrivez votre univers en quelques mots..." className="flex min-h-20 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium resize-none" />
                        </div>
                    </div>
                  )}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 h-12 border border-border rounded-xl font-bold hover:bg-zinc-100 transition-colors">Retour</button>
                    <button type="button" onClick={() => setStep(3)} className="flex-1 h-12 bg-zinc-900 text-white rounded-xl font-bold hover:scale-[1.02] transition-all">Suivant</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="jean.dupont@exemple.com" className="pl-10 flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="pl-10 flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium italic px-1">
                      Min. 8 caractères, une majuscule et un chiffre.
                    </p>
                  </div>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center gap-4 text-red-700 shadow-md"
                      >
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-sm font-bold tracking-tight leading-tight">{error}</p>
                      </motion.div>
                    )}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 h-12 border border-border rounded-xl font-bold hover:bg-zinc-100 transition-colors">Retour</button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center h-12 bg-primary text-white rounded-xl font-bold hover:shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <span>Terminer</span>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            Déjà un compte ? <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4 ml-1">Connectez-vous</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
