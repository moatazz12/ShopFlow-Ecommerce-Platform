"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Save, Plus, Trash2, 
  Image as ImageIcon, Loader2, Tag, 
  Layers, Info, Sparkles, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";

const productSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description est trop courte"),
  prix: z.number().positive("Le prix doit être positif"),
  prixPromo: z.any().optional(),
  stock: z.number().int().nonnegative("Le stock ne peut pas être négatif"),
  categoryNames: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie"),
  images: z.array(z.string()).min(1, "Ajoutez au moins une URL d'image"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nom: "",
      description: "",
      prix: 0,
      stock: 0,
      categoryNames: [],
      images: [],
    }
  });

  const images = watch("images");
  const selectedCategories = watch("categoryNames");

  const createMutation = useMutation({
    mutationFn: (data: ProductFormValues) => productService.saveProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      router.push("/seller/products");
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        
        // Utilisation de apiClient pour gérer l'auth automatiquement
        const response = await apiClient.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        if (response.status === 200 || response.status === 201) {
          // On construit l'URL complète pour l'affichage
          const serverUrl = "http://localhost:8095";
          const fullUrl = `${serverUrl}${response.data.url}`;
          uploadedUrls.push(fullUrl);
        }
      }
      setValue("images", uploadedUrls);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setValue("images", images.filter(img => img !== url));
  };

  const setMainImage = (url: string) => {
    const otherImages = images.filter(img => img !== url);
    setValue("images", [url, ...otherImages]);
  };

  const toggleCategory = (catName: string) => {
    const current = selectedCategories;
    if (current.includes(catName)) {
      setValue("categoryNames", current.filter(c => c !== catName));
    } else {
      setValue("categoryNames", [...current, catName]);
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    // Nettoyage intelligent : si c'est vide, NaN, ou 0, on envoie null (pas de promo)
    const valPromo = parseFloat(data.prixPromo as any);
    const cleanedData = {
      ...data,
      prixPromo: (isNaN(valPromo) || valPromo <= 0) ? null : valPromo
    };
    createMutation.mutate(cleanedData as any);
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/seller/products" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Ajouter un <span className="text-primary">Produit</span></h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Info className="w-6 h-6 text-primary" />
                Informations Générales
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nom du produit</label>
                  <input 
                    {...register("nom")}
                    className={cn(
                      "w-full p-4 bg-muted/50 border rounded-2xl outline-none focus:border-primary transition-all font-medium",
                      errors.nom ? "border-red-500" : "border-transparent"
                    )}
                    placeholder="Ex: Robot Mixeur Ultra Premium"
                  />
                  {errors.nom && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.nom.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Description détaillée</label>
                  <textarea 
                    {...register("description")}
                    rows={6}
                    className={cn(
                      "w-full p-4 bg-muted/50 border rounded-2xl outline-none focus:border-primary transition-all font-medium resize-none",
                      errors.description ? "border-red-500" : "border-transparent"
                    )}
                    placeholder="Décrivez les fonctionnalités, les avantages et les caractéristiques techniques..."
                  />
                  {errors.description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.description.message}</p>}
                </div>
              </div>
            </section>

            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-primary" />
                  Images du produit
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {images.length} / 8 Photos
                </span>
              </div>
              
              <div className="space-y-6">
                {/* Custom Upload Zone */}
                <div className="relative group">
                  <input 
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <div className={cn(
                    "p-12 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-500",
                    isUploading ? "bg-muted/50 border-primary animate-pulse" : "bg-muted/30 border-border group-hover:border-primary group-hover:bg-primary/5"
                  )}>
                    <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      {isUploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Plus className="w-8 h-8 text-primary" />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black uppercase tracking-widest">
                        {isUploading ? "Importation en cours..." : "Cliquez ou glissez vos photos ici"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-1">PNG, JPG ou WEBP jusqu'à 10 Mo</p>
                    </div>
                  </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {images.map((url, idx) => (
                      <motion.div 
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        key={url} 
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden border-2 group",
                          idx === 0 ? "border-primary shadow-lg shadow-primary/20" : "border-border"
                        )}
                      >
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          {idx !== 0 && (
                            <button 
                              type="button"
                              onClick={() => setMainImage(url)}
                              className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase rounded-full hover:scale-105 transition-transform"
                            >
                              Mettre en principal
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => removeImage(url)}
                            className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {idx === 0 && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                            Principal
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {errors.images && <p className="text-red-500 text-[10px] font-bold">{errors.images.message}</p>}
              </div>
            </section>
          </div>

          {/* Right: Price, Stock, Category */}
          <div className="space-y-8">
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Tag className="w-6 h-6 text-primary" />
                Tarification & Stock
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Prix de vente (€)</label>
                  <input 
                    type="number"
                    step="0.01"
                    {...register("prix", { valueAsNumber: true })}
                    className={cn(
                      "w-full p-4 bg-muted/50 border-2 rounded-2xl outline-none focus:border-primary font-black text-2xl transition-all",
                      errors.prix ? "border-red-500" : "border-transparent"
                    )}
                  />
                  {errors.prix && <p className="text-red-500 text-[10px] mt-2 font-bold flex items-center gap-1 uppercase tracking-wider italic">
                    <Info className="w-3 h-3" /> {errors.prix.message}
                  </p>}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Prix Promotionnel (€) - Optionnel</label>
                  <input 
                    type="number"
                    step="0.01"
                    {...register("prixPromo")}
                    placeholder="Laisser vide si pas de promo"
                    className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-bold text-lg text-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Quantité en Stock</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <Layers className="w-5 h-5 text-muted-foreground" />
                      <input 
                        type="number"
                        {...register("stock", { valueAsNumber: true })}
                        className={cn(
                          "w-full p-4 bg-muted/50 border-2 rounded-2xl outline-none focus:border-primary font-bold transition-all",
                          errors.stock ? "border-red-500" : "border-transparent"
                        )}
                      />
                    </div>
                    {errors.stock && <p className="text-red-500 text-[10px] font-bold italic flex items-center gap-1 uppercase tracking-wider">
                      <Info className="w-3 h-3" /> {errors.stock.message}
                    </p>}
                  </div>
                </div>
              </div>
            </section>

            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" />
                Catégories
              </h2>
              <div className="space-y-6">
                {categories?.filter(c => !c.parentId).map((parent) => (
                  <div key={parent.id} className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-2">{parent.nom}</p>
                    <div className="flex flex-wrap gap-2">
                      {/* Le parent lui-même */}
                      <button
                        key={parent.id}
                        type="button"
                        onClick={() => toggleCategory(parent.nom)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2",
                          selectedCategories.includes(parent.nom) 
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                            : "border-border text-muted-foreground hover:border-primary"
                        )}
                      >
                        {parent.nom}
                      </button>
                      {/* Ses enfants */}
                      {categories.filter(sub => sub.parentId === parent.id).map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleCategory(sub.nom)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[11px] font-medium transition-all border-2",
                            selectedCategories.includes(sub.nom) 
                              ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20" 
                              : "border-border/40 text-muted-foreground hover:border-amber-500/50"
                          )}
                        >
                          {sub.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {errors.categoryNames && <p className="text-red-500 text-[10px] font-bold italic flex items-center gap-1 uppercase tracking-wider">
                   <Info className="w-3 h-3" /> {errors.categoryNames.message}
                </p>}
              </div>
            </section>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={createMutation.isPending}
                className="w-full h-16 bg-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : (
                  <>
                    <Save className="w-6 h-6" />
                    Mettre en vente
                  </>
                )}
              </button>

              {createMutation.isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600 font-bold text-sm"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Produit créé avec succès ! Redirection...
                </motion.div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
