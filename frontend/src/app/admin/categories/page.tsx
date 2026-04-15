"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Edit, Trash2, FolderTree, 
  ChevronRight, Save, X, Loader2, AlertTriangle,
  CheckCircle2, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";

function CategoryDropdown({ 
  categories, 
  value, 
  onChange, 
  excludeId 
}: { 
  categories: any[], 
  value?: number, 
  onChange: (id?: number) => void,
  excludeId?: number | null
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  const selectedCategory = categories.find(c => c.id === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full p-4 bg-muted/50 rounded-2xl outline-none border-2 transition-all font-bold flex items-center justify-between",
          isOpen ? "border-primary bg-background shadow-lg" : "border-transparent"
        )}
      >
        <div className="flex items-center gap-3">
          <FolderTree className={cn("w-5 h-5", selectedCategory ? "text-primary" : "text-muted-foreground")} />
          <span className={cn(selectedCategory ? "text-foreground" : "text-muted-foreground")}>
            {selectedCategory ? selectedCategory.nom : "Catégorie Parente (Optionnel)"}
          </span>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 left-0 top-full mt-2 w-full bg-background border border-border rounded-2xl shadow-2xl overflow-hidden p-2 backdrop-blur-xl max-h-[300px] overflow-y-auto"
          >
            <button
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all mb-1 text-muted-foreground"
            >
              Aucun parent
            </button>
            {categories.filter(c => c.id !== excludeId && !c.parentId).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                  value === cat.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-muted text-foreground"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", value === cat.id ? "bg-white/20" : "bg-primary/10 text-primary")}>
                   <FolderTree className="w-4 h-4" />
                </div>
                {cat.nom}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: number, nom: string} | null>(null);
  const [newCat, setNewCat] = useState({ nom: "", description: "", parentId: undefined as number | undefined });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
        const res = await apiClient.get("/categories");
        return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      toast.success("Catégorie créée !", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        description: "La nouvelle catégorie a été ajoutée avec succès."
      });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiClient.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      toast.success("Catégorie mise à jour !", {
        icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
        description: "Les modifications ont été enregistrées."
      });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      toast.success("Catégorie supprimée", {
        icon: <Trash2 className="w-5 h-5 text-red-500" />,
        description: "La catégorie a été retirée définitivement."
      });
      setCategoryToDelete(null);
    }
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingCatId(null);
    setNewCat({ nom: "", description: "", parentId: undefined });
  };

  const handleEdit = (cat: any) => {
    setEditingCatId(cat.id);
    setNewCat({ 
      nom: cat.nom, 
      description: cat.description || "", 
      parentId: cat.parentId 
    });
    setIsAdding(true);
    // Animation de défilement fluide vers le haut pour voir le formulaire
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    if (editingCatId) {
      updateMutation.mutate({ id: editingCatId, data: newCat });
    } else {
      createMutation.mutate(newCat);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Organisation des catégories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 relative">
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="mb-8">
          <BackButton href="/admin/dashboard" label="Dashboard" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Gestion <span className="text-primary italic">Catégories</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Structurez l'offre de produits de ShopFlow.</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter une catégorie
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 bg-background border-2 border-primary/20 rounded-[2.5rem] shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                   <h2 className="text-xl font-bold italic uppercase tracking-tight">
                     {editingCatId ? `Modifier la catégorie` : `Nouvelle Catégorie`}
                   </h2>
                   <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <input 
                      placeholder="Nom de la catégorie" 
                      className="w-full p-4 bg-muted/50 rounded-2xl outline-none focus:border-primary border-2 border-transparent transition-all font-bold"
                      value={newCat.nom}
                      onChange={(e) => setNewCat({...newCat, nom: e.target.value})}
                   />
                   <CategoryDropdown 
                      categories={categories || []}
                      value={newCat.parentId}
                      onChange={(id) => setNewCat({...newCat, parentId: id})}
                      excludeId={editingCatId}
                   />
                </div>
                <textarea 
                  placeholder="Description..." 
                  className="w-full p-4 bg-muted/50 rounded-2xl outline-none border-2 border-transparent focus:border-primary transition-all h-24 resize-none font-medium"
                  value={newCat.description}
                  onChange={(e) => setNewCat({...newCat, description: e.target.value})}
                />
                <button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending || !newCat.nom}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                >
                   {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin" /> : (
                     <>
                        <Save className="w-5 h-5" />
                        {editingCatId ? "Enregistrer les modifications" : "Enregistrer la catégorie"}
                     </>
                   )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {categories?.length === 0 && !isAdding && (
            <div className="py-24 bg-background border-2 border-dashed border-border rounded-[3rem] text-center">
              <FolderTree className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-black text-xl mb-2">Aucune catégorie existante</p>
              <p className="text-muted-foreground">Créez votre première catégorie pour commencer à structurer votre catalogue.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {categories?.filter((c: any) => !c.parentId).map((parent: any) => (
              <React.Fragment key={parent.id}>
                {/* Parent Category Card */}
                <motion.div
                  layout
                  className="p-6 bg-background border border-border rounded-[2rem] flex items-center justify-between group hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner">
                      <FolderTree className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg leading-none">{parent.nom}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-md">Parent</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">{parent.description || "Aucune description"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleEdit(parent)}
                        className="p-2 hover:bg-muted rounded-xl transition-colors"
                    >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setCategoryToDelete({id: parent.id, nom: parent.nom})}
                      className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-2" />
                  </div>
                </motion.div>

                {/* Sub-categories of this parent */}
                {categories?.filter((sub: any) => sub.parentId === parent.id).map((sub: any) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-12 p-5 bg-background/50 border border-border/60 rounded-[1.8rem] flex items-center justify-between group hover:shadow-md transition-all relative"
                  >
                    {/* Connecting line */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-border" />
                    
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-base leading-none">{sub.nom}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-2 py-0.5 rounded-md">Sous-cat</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">{sub.description || "Aucune description"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                          onClick={() => handleEdit(sub)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => setCategoryToDelete({id: sub.id, nom: sub.nom})}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </React.Fragment>
            ))}

            {/* Orphan categories (if any parentId is set to an ID that no longer exists or logic issue) */}
            {categories?.filter((c: any) => c.parentId && !categories.some((p: any) => p.id === c.parentId)).map((orphan: any) => (
                <motion.div
                  key={orphan.id}
                  layout
                  className="p-6 bg-red-50/50 border border-red-100 rounded-[2rem] flex items-center justify-between group hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-1 text-red-600">{orphan.nom} (Orpheline)</h3>
                      <p className="text-xs text-red-500/70">Attention : Le parent de cette catégorie n'existe plus.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleEdit(orphan)} className="p-2 hover:bg-red-100 rounded-xl transition-colors"><Edit className="w-4 h-4 text-red-500" /></button>
                    <button onClick={() => setCategoryToDelete({id: orphan.id, nom: orphan.nom})} className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Styled Delete Modal */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setCategoryToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-background border border-border rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Êtes-vous sûr ?</h3>
              <p className="text-muted-foreground font-medium mb-8">
                Vous êtes sur le point de supprimer la catégorie <span className="text-foreground font-bold italic">"{categoryToDelete.nom}"</span>. Cette action est irréversible.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCategoryToDelete(null)}
                  className="flex-1 py-4 bg-muted text-muted-foreground font-bold rounded-2xl hover:bg-muted/80 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(categoryToDelete.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex justify-center items-center"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Supprimer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
