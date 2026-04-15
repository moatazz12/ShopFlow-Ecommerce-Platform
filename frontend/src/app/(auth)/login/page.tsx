"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, Mail, Lock, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const registeredEmail = searchParams.get("email") || "";
  const justRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || "Identifiants invalides. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side: Illustration / Branding */}
      <div className="hidden lg:flex relative bg-zinc-950 items-center justify-center overflow-hidden">
        {/* Background Image - Modern E-commerce / Digital Retail */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070')" }}
        />

        {/* Modern Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/40 to-primary/20" />

        {/* Glassmorphism Panel */}
        <div className="relative z-10 text-white p-12 max-w-lg text-center backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl shadow-2xl mx-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-xl"
          >
            <ShoppingBag className="w-8 h-8 text-primary" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-6"
          >
            Ravi de vous revoir sur ShopFlow.
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-lg leading-relaxed"
          >
            Accédez à vos commandes, gérez vos favoris et découvrez des produits sélectionnés spécialement pour vous.
          </motion.p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-col bg-background items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:hidden flex items-center justify-center mb-6"
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Connexion
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Entrez vos identifiants pour accéder à votre compte.
            </p>
          </div>

          {/* Bandeau de succès après inscription */}
          {justRegistered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center gap-4 text-green-700 shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Compte créé avec succès ! </p>
                <p className="text-xs text-green-600 mt-0.5">Votre email a été prérempli. Entrez votre mot de passe pour vous connecter.</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    placeholder="exemple@shopflow.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    Mot de passe
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
                  />
                </div>
              </div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-muted-foreground text-sm font-medium">
              Vous n'avez pas encore de compte ?{" "}
            </span>
            <Link
              href="/register"
              className="text-sm font-bold text-primary hover:underline underline-offset-4"
            >
              Inscrivez-vous gratuitement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
