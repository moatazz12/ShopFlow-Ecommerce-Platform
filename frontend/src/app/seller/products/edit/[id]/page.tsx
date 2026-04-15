"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, Save, Trash2,
  Image as ImageIcon, Loader2, Tag,
  Layers, Info, Sparkles, Eye, EyeOff, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import apiClient from "@/lib/api-client";

const productSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description est trop courte"),
  prix: z.number().positive("Le prix doit être positif"),
  prixPromo: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative("Le stock ne peut pas être négatif"),
  categoryNames: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie"),
  images: z.array(z.string()).min(1, "Ajoutez au moins une URL d'image"),
  actif: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: () => productService.getProductById(Number(id)),
    enabled: !!id,
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } =
    useForm<ProductFormValues>({
      resolver: zodResolver(productSchema),
      defaultValues: {
        nom: "",
        description: "",
        prix: 0,
        stock: 0,
        categoryNames: [],
        images: [],
        actif: true,
      },
    });

  // Pre-fill the form once product data is loaded
  useEffect(() => {
    if (product && !isLoaded) {
      reset({
        nom: product.nom,
        description: product.description,
        prix: product.prix,
        prixPromo: product.prixPromo,
        stock: product.stock,
        categoryNames: product.categoryNames,
        images: Array.from(new Set(product.images)), // Éviter les doublons au chargement
        actif: product.actif,
      });
      setIsLoaded(true);
    }
  }, [product, isLoaded, reset]);

  const images = watch("images");
  const selectedCategories = watch("categoryNames");
  const actif = watch("actif");

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormValues) =>
      apiClient.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      router.push("/seller/products");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      router.push("/seller/products");
    },
  });

  const addImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      setValue("images", [...images, newImageUrl], { shouldDirty: true });
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const currentImages = watch("images");
    setValue("images", currentImages.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const toggleCategory = (catName: string) => {
    const current = selectedCategories;
    if (current.includes(catName)) {
      setValue("categoryNames", current.filter((c) => c !== catName), { shouldDirty: true });
    } else {
      setValue("categoryNames", [...current, catName], { shouldDirty: true });
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    // Nettoyage final avant envoi pour s'assurer que les prix vides sont null
    const cleanData = {
      ...data,
      prixPromo: (data.prixPromo === undefined || data.prixPromo === null || isNaN(Number(data.prixPromo))) ? null : data.prixPromo,
    };
    updateMutation.mutate(cleanData as any);
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="h-10 bg-muted animate-pulse rounded-2xl w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-80 bg-muted animate-pulse rounded-[3rem]" />
              <div className="h-64 bg-muted animate-pulse rounded-[3rem]" />
            </div>
            <div className="space-y-8">
              <div className="h-64 bg-muted animate-pulse rounded-[3rem]" />
              <div className="h-48 bg-muted animate-pulse rounded-[3rem]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <BackButton href="/seller/products" label="Mes produits" />
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                Modifier <span className="text-primary">{product?.nom}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Produit #{id} · {isDirty ? "Modifications non sauvegardées" : "À jour"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/product/${id}?from=seller`}
              className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirm(!deleteConfirm)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                  deleteConfirm
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                )}
              >
                <Trash2 className="w-4 h-4" />
                {deleteConfirm ? "Annuler" : "Supprimer"}
              </button>

              <AnimatePresence>
                {deleteConfirm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -10 }}
                    onClick={() => deleteMutation.mutate()}
                    className="px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 flex items-center gap-2"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmer
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Status toggle banner */}
        <motion.div
          animate={{ backgroundColor: actif ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)" }}
          className={cn(
            "mb-8 p-5 rounded-2xl border flex items-center justify-between",
            actif ? "border-green-500/20" : "border-red-500/20"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", actif ? "bg-green-500" : "bg-red-500")} />
            <p className="font-bold text-sm">
              {actif ? "Produit visible sur le catalogue" : "Produit masqué (brouillon)"}
            </p>
          </div>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={async () => {
              const newActif = !actif;
              setValue("actif", newActif, { shouldDirty: true });
              // Sauvegarde automatique du nouveau statut
              const currentValues = watch();
              updateMutation.mutate({ ...currentValues, actif: newActif });
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm",
              actif
                ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                : "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20"
            )}
          >
            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (
              actif ? <><EyeOff className="w-3 h-3" /> Masquer</> : <><Eye className="w-3 h-3" /> Publier</>
            )}
          </button>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Left: Info + Images ───────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* General Info */}
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Info className="w-6 h-6 text-primary" />
                Informations Générales
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Nom du produit
                  </label>
                  <input
                    {...register("nom")}
                    className={cn(
                      "w-full p-4 bg-muted/50 border-2 rounded-2xl outline-none focus:border-primary transition-all font-medium",
                      errors.nom ? "border-red-500" : "border-transparent"
                    )}
                  />
                  {errors.nom && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.nom.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Description détaillée
                  </label>
                  <textarea
                    {...register("description")}
                    rows={6}
                    className={cn(
                      "w-full p-4 bg-muted/50 border-2 rounded-2xl outline-none focus:border-primary transition-all font-medium resize-none",
                      errors.description ? "border-red-500" : "border-transparent"
                    )}
                  />
                  {errors.description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.description.message}</p>}
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-primary" />
                  Images du produit
                </h2>
                <label className="cursor-pointer px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;

                      for (let i = 0; i < files.length; i++) {
                        const formData = new FormData();
                        formData.append("file", files[i]);

                        try {
                          const res = await apiClient.post("/upload", formData, {
                            headers: { "Content-Type": "multipart/form-data" }
                          });
                          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095/api").replace(/\/api$/, "");
                          const url = `${baseUrl}${res.data.url}`;

                          const currentImages = watch("images");
                          if (!currentImages.includes(url)) {
                            setValue("images", [...currentImages, url], { shouldDirty: true });
                          }
                        } catch (err) {
                          console.error("Upload failed", err);
                        }
                      }
                    }}
                  />
                  Importer des photos
                </label>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border group shadow-sm">
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-lg">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty state / Add more placeholder */}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-muted-foreground cursor-pointer group">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const res = await apiClient.post("/upload", formData, {
                            headers: { "Content-Type": "multipart/form-data" }
                          });
                          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095/api").replace(/\/api$/, "");
                          const url = `${baseUrl}${res.data.url}`;
                          const currentImages = watch("images");
                          if (!currentImages.includes(url)) {
                            setValue("images", [...currentImages, url], { shouldDirty: true });
                          }
                        } catch (err) { console.error(err); }
                      }}
                    />
                    <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Ajouter</span>
                  </label>
                </div>
                {errors.images && <p className="text-red-500 text-[10px] font-bold">{errors.images.message}</p>}
              </div>
            </section>
          </div>

          {/* ── Right: Price, Stock, Categories, Submit ───────────────────── */}
          <div className="space-y-8">

            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Tag className="w-6 h-6 text-primary" />
                Tarification & Stock
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Prix de vente (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("prix", { valueAsNumber: true })}
                    className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-black text-2xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Prix Promo (€) — Optionnel
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("prixPromo", {
                      setValueAs: (val) => (val === "" || val === undefined || isNaN(Number(val)) ? null : Number(val))
                    })}
                    className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-bold text-lg text-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    Stock
                  </label>
                  <input
                    type="number"
                    {...register("stock", { valueAsNumber: true })}
                    className="w-full p-4 bg-muted/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>
            </section>

            <section className="p-10 bg-background border border-border rounded-[3rem] shadow-xl space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" />
                Catégories
              </h2>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.nom)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2",
                      selectedCategories.includes(cat.nom)
                        ? "bg-primary border-primary text-white"
                        : "border-border text-muted-foreground hover:border-primary"
                    )}
                  >
                    {cat.nom}
                  </button>
                ))}
              </div>
              {errors.categoryNames && (
                <p className="text-red-500 text-[10px] font-bold">{errors.categoryNames.message}</p>
              )}
            </section>

            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className={cn(
                "w-full h-16 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3",
                isDirty
                  ? "bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {updateMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  {isDirty ? "Sauvegarder les modifications" : "Aucune modification"}
                </>
              )}
            </button>

            {updateMutation.isSuccess && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-green-500 font-bold text-sm"
              >
                ✅ Produit mis à jour avec succès !
              </motion.p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
