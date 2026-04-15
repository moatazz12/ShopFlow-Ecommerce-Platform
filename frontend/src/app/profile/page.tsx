"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/services/address.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, MapPin, Plus, Trash2,
  Save, Loader2, CheckCircle2, Store,
  Home, Shield, Edit3, X, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { userService } from "@/services/user.service";

export default function ProfilePage() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, refreshUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    prenom: user?.prenom || "",
    nom: user?.nom || "",
    shopName: user?.shopName || "",
    shopDescription: user?.shopDescription || "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    rue: "", 
    ville: "", 
    codePostal: "", 
    pays: "",
    principal: false,
    type: "SHIPPING"
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { data: addresses, isLoading: isLoadingAddr } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => addressService.getMyAddresses(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/users/me", data),
    onSuccess: async () => {
      await refreshUser();
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: any) => addressService.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
      setIsAddingAddress(false);
      setNewAddress({ 
        rue: "", 
        ville: "", 
        codePostal: "", 
        pays: "",
        principal: false,
        type: "SHIPPING"
      });
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => userService.changePassword(data),
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (error: any) => {
      setPasswordError(error.response?.data?.message || "Erreur lors du changement de mot de passe");
    }
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit faire au moins 6 caractères");
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    CUSTOMER: { label: "Client", color: "bg-primary/10 text-primary" },
    SELLER: { label: "Vendeur", color: "bg-amber-500/10 text-amber-500" },
    ADMIN: { label: "Administrateur", color: "bg-primary/10 text-primary" },
  };
  const roleInfo = roleLabels[user.role] || roleLabels["CUSTOMER"];

  return (
    <div className="min-h-screen bg-muted/30 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <BackButton href="/" label="Accueil" />
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-12">
          Mon <span className="text-primary italic">Profil</span>
        </h1>

        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            Profil mis à jour avec succès !
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* ── Sidebar Avatar ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="p-8 bg-background border border-border rounded-[2.5rem] shadow-xl text-center space-y-6 sticky top-24">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{user.prenom} {user.nom}</h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </p>
              </div>
              <span className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block", roleInfo.color)}>
                {roleInfo.label}
              </span>
              
              <div className="border-t border-border pt-6 space-y-2">
                {/* --- NAVIGATION ADMIN --- */}
                {user.role === "ADMIN" && (
                  <>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-4 text-left">Pilotage Plateforme</div>
                    <Link href="/admin/dashboard" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", pathname === "/admin/dashboard" ? "bg-primary text-white shadow-lg" : "bg-primary/5 text-primary hover:bg-primary/10")}>
                      Dashboard Admin
                    </Link>
                    <Link href="/admin/users" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all", pathname === "/admin/users" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      Gestion Utilisateurs
                    </Link>
                    <Link href="/admin/categories" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all", pathname === "/admin/categories" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      Gestion Catégories
                    </Link>
                    <Link href="/admin/orders" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all", pathname === "/admin/orders" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      Gestion Commandes
                    </Link>
                  </>
                )}

                {/* --- NAVIGATION SELLER --- */}
                {user.role === "SELLER" && (
                  <>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-4 text-left">Espace Business</div>
                    <Link href="/seller/dashboard" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", pathname === "/seller/dashboard" ? "bg-primary text-white shadow-lg" : "bg-primary/5 text-primary hover:bg-primary/10")}>
                      Dashboard Vendeur
                    </Link>
                    <Link href="/seller/products" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all", pathname === "/seller/products" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      Mes Produits
                    </Link>
                    <Link href="/seller/orders" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all", pathname === "/seller/orders" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      Commandes Reçues
                    </Link>
                  </>
                )}

                {/* --- NAVIGATION CUSTOMER --- */}
                {user.role === "CUSTOMER" && (
                  <>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-4 text-left">Mes Activités</div>
                    <Link href="/orders" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", pathname === "/orders" ? "bg-primary text-white shadow-lg" : "bg-primary/5 text-primary hover:bg-primary/10")}>
                      Suivi Commandes
                    </Link>
                    <Link href="/profile/reviews" className={cn("block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all", pathname === "/profile/reviews" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      Mes Avis & Notes
                    </Link>
                  </>
                )}
                
                <div className="border-t border-border mt-6 pt-4">
                   <button 
                    onClick={() => { logout(); }}
                    className="block w-full text-left px-5 py-3.5 text-red-500 hover:bg-red-500/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                   >
                     Déconnexion
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Content ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Informations Personnelles */}
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" />
                  Informations Personnelles
                </h2>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setEditForm({
                      prenom: user.prenom,
                      nom: user.nom,
                      shopName: user.shopName || "",
                      shopDescription: user.shopDescription || "",
                    });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    isEditing ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                  )}
                >
                  {isEditing ? <><X className="w-3 h-3" /> Annuler</> : <><Edit3 className="w-3 h-3" /> Modifier</>}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Prénom</label>
                        <input
                          value={editForm.prenom}
                          onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                          className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-medium transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nom</label>
                        <input
                          value={editForm.nom}
                          onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                          className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-medium transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Email</label>
                      <input
                        value={user.email}
                        disabled
                        className="w-full p-4 bg-muted/30 rounded-2xl text-muted-foreground font-medium cursor-not-allowed border-2 border-transparent"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold">L'email ne peut pas être modifié.</p>
                    </div>

                    {user.role === "SELLER" && (
                      <>
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <Store className="w-3 h-3" />
                            Informations boutique
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nom de la boutique</label>
                          <input
                            value={editForm.shopName}
                            onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                            className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-medium transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Description boutique</label>
                          <textarea
                            value={editForm.shopDescription}
                            onChange={(e) => setEditForm({ ...editForm, shopDescription: e.target.value })}
                            rows={3}
                            className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-medium transition-all resize-none"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => updateProfileMutation.mutate(editForm)}
                      disabled={updateProfileMutation.isPending}
                      className="w-full h-14 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <><Save className="w-5 h-5" /> Sauvegarder les modifications</>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {[
                      { label: "Prénom", value: user.prenom },
                      { label: "Nom", value: user.nom },
                      { label: "Email", value: user.email },
                      ...(user.role === "SELLER" ? [
                        { label: "Boutique", value: user.shopName || "—" },
                        { label: "Description", value: user.shopDescription || "—" },
                      ] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                        <span className="font-bold text-right max-w-[60%] truncate">{value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Adresses */}
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-primary" />
                  Mes Adresses
                </h2>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter
                </button>
              </div>

              <AnimatePresence>
                {isAddingAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="p-8 bg-muted/50 rounded-2xl border border-border space-y-4">
                      <input
                        placeholder="Rue et numéro"
                        value={newAddress.rue}
                        onChange={(e) => setNewAddress({ ...newAddress, rue: e.target.value })}
                        className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary font-medium transition-all"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          placeholder="Ville"
                          value={newAddress.ville}
                          onChange={(e) => setNewAddress({ ...newAddress, ville: e.target.value })}
                          className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary font-medium"
                        />
                        <input
                          placeholder="Code Postal"
                          value={newAddress.codePostal}
                          onChange={(e) => setNewAddress({ ...newAddress, codePostal: e.target.value })}
                          className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary font-medium"
                        />
                      </div>
                      <input
                        placeholder="Pays (ex: France, Belgique...)"
                        value={newAddress.pays}
                        onChange={(e) => setNewAddress({ ...newAddress, pays: e.target.value })}
                        className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary font-medium"
                      />
                      <button
                        onClick={() => addAddressMutation.mutate(newAddress)}
                        disabled={addAddressMutation.isPending || !newAddress.rue || !newAddress.ville || !newAddress.codePostal || !newAddress.pays}
                        className="w-full h-12 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {addAddressMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><Plus className="w-4 h-4" /> Enregistrer</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoadingAddr ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : addresses?.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                  <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-bold">Aucune adresse enregistrée</p>
                  <p className="text-sm text-muted-foreground mt-1">Ajoutez une adresse pour accélérer vos commandes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {addresses?.map((addr) => (
                      <motion.div
                        key={addr.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border border-border hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold">{addr.rue}</p>
                            <p className="text-sm text-muted-foreground">{addr.codePostal} {addr.ville}, {addr.pays}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAddressMutation.mutate(addr.id!)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Sécurité */}
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
                <Shield className="w-6 h-6 text-primary" />
                Sécurité
              </h2>
              
              <div className="p-8 bg-muted/30 rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-bold text-lg">Mot de passe</p>
                    <p className="text-sm text-muted-foreground mt-1">Protégez votre compte avec un mot de passe robuste</p>
                  </div>
                  {!isChangingPassword && (
                    <button 
                      onClick={() => setIsChangingPassword(true)}
                      className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foreground/80 transition-all shadow-sm"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {isChangingPassword && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handlePasswordChange}
                      className="space-y-4 pt-4 border-t border-border"
                    >
                      {passwordError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                          <X className="w-4 h-4" /> {passwordError}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Ancien mot de passe</label>
                          <input
                            type="password"
                            required
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nouveau mot de passe</label>
                          <input
                            type="password"
                            required
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all font-medium"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Confirmer le nouveau mot de passe</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={changePasswordMutation.isPending}
                          className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                          {changePasswordMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : "Enregistrer le mot de passe"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsChangingPassword(false); setPasswordError(""); }}
                          className="px-6 h-12 bg-muted text-foreground font-bold rounded-xl hover:bg-muted/80 transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {passwordSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-xs font-bold flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Mot de passe mis à jour avec succès !
                  </motion.div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
