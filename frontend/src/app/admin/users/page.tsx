"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, Shield, UserX, 
  Search, Loader2, ShieldCheck, 
  Trash2, Mail, BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import apiClient from "@/lib/api-client";
import { UserDTO, Role } from "@/types";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
        const res = await apiClient.get<UserDTO[]>("/users");
        return res.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/users/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number, role: Role }) => 
      apiClient.put(`/users/${id}/role?role=${role}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Synchronisation de l'annuaire...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <BackButton href="/admin/dashboard" label="Admin Panel" />
        </div>
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Membres <span className="text-primary">ShopFlow</span></h1>
          <p className="text-muted-foreground mt-2 font-medium">Contrôlez les accès et gérez les comptes de la plateforme.</p>
        </div>

        <div className="relative mb-10 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Rechercher par email ou nom..." 
            className="w-full h-14 bg-background border-2 border-border rounded-2xl pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredUsers?.length === 0 && (
          <div className="py-16 text-center text-muted-foreground font-medium">
            Aucun utilisateur trouvé pour « {searchTerm} ».
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredUsers?.map((u) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-8 bg-background border rounded-[2.5rem] shadow-sm flex flex-col items-center text-center transition-all group hover:shadow-xl",
                !u.actif ? "opacity-60 border-red-500/20 grayscale" : "border-border"
              )}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform">
                 <Users className="w-10 h-10 text-primary" />
                 {!u.actif && <div className="absolute inset-0 flex items-center justify-center text-red-500"><UserX className="w-8 h-8" /></div>}
              </div>
              
              <h3 className="text-xl font-bold mb-1 truncate w-full">{u.prenom} {u.nom}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
                 <Mail className="w-3 h-3" />
                 {u.email}
              </div>

              <div className="w-full space-y-3 pt-6 border-t border-border">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rôle actuel</span>
                    <div className="relative">
                       <select 
                          value={u.role}
                          onChange={(e) => updateRoleMutation.mutate({ id: u.id!, role: e.target.value as Role })}
                          className="appearance-none bg-background border-2 border-border px-4 py-1.5 pr-8 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary hover:border-primary/50 cursor-pointer shadow-sm transition-all"
                       >
                          <option value="CUSTOMER">Client</option>
                          <option value="SELLER">Vendeur</option>
                          <option value="ADMIN">Admin</option>
                       </select>
                       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">État Compte</span>
                    <button 
                       onClick={() => toggleStatusMutation.mutate(u.id!)}
                       className={cn(
                          "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          u.actif ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-green-500 text-white shadow-lg shadow-green-500/20"
                       )}
                    >
                       {u.actif ? "Désactiver" : "Réactiver"}
                    </button>
                 </div>
              </div>
              
              {u.role === "SELLER" && (
                <div className="mt-6 w-full p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                   <BadgeCheck className="w-5 h-5 text-primary" />
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Boutique certifiée</p>
                      <p className="text-xs font-bold truncate max-w-[150px]">{u.shopName || "Sans nom"}</p>
                   </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
