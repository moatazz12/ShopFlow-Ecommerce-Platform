"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, CheckCircle2, XCircle, 
  MessageSquare, Loader2, ShieldCheck, Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import { reviewService } from "@/services/review.service";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: () => reviewService.getPendingReviews(),
  });

  const approveMutation = useMutation({
    mutationFn: (reviewId: number) => reviewService.approveReview(reviewId),
    onSuccess: (_, reviewId) => {
      // Invalider les avis en attente ET les avis publiés (homepage + produit)
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["latest-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Avis approuvé !", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        description: "L'avis est maintenant visible publiquement."
      });
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation de l'avis.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Avis rejeté", {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        description: "L'avis a été supprimé définitivement."
      });
    },
    onError: () => {
      toast.error("Erreur lors du rejet de l'avis.");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-medium text-muted-foreground">Chargement des avis en attente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <BackButton href="/admin/dashboard" label="Dashboard" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Modération <span className="text-primary italic">Avis</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Validez ou rejetez les avis clients avant publication.</p>
          </div>
          <div className="flex items-center gap-4 bg-amber-500/10 text-amber-600 px-6 py-3 rounded-2xl border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold text-sm">{reviews?.length || 0} avis en attente</span>
          </div>
        </div>

        {reviews?.length === 0 ? (
          <div className="py-24 bg-background border border-border rounded-[3rem] flex flex-col items-center text-center px-4">
            <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-8">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">File d'attente <span className="text-green-500">Vide</span></h3>
            <p className="text-muted-foreground max-w-sm">Tous les avis ont été traités. La qualité du contenu ShopFlow est garantie !</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {reviews?.map((review) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 bg-background border border-border rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Quote decoration */}
                  <Quote className="absolute top-6 right-8 w-16 h-16 text-muted/20" />

                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-xl">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <span className="font-black text-sm uppercase tracking-widest text-primary">{review.productName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn("w-4 h-4", i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-muted-foreground">{review.rating}/5</span>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          review.approved
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {review.approved ? "Approuvé" : "En attente"}
                        </span>
                      </div>

                      <p className="text-base leading-relaxed text-foreground/80 italic bg-muted/30 p-5 rounded-2xl border-l-4 border-primary/30">
                        "{review.comment}"
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        <span>Par : <span className="text-foreground">{review.customerEmail}</span></span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                        <span>{review.createdAt ? new Date(review.createdAt as any).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-3 justify-center items-center md:items-stretch min-w-[160px]">
                      <button
                        onClick={() => approveMutation.mutate(review.id!)}
                        disabled={approveMutation.isPending || review.approved}
                        className="flex-1 px-6 py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Approuver
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(review.id!)}
                        disabled={rejectMutation.isPending}
                        className="flex-1 px-6 py-4 bg-red-500/10 text-red-500 border-2 border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Rejeter
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
