"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, MessageSquare, Calendar, 
  CheckCircle2, Clock, ShoppingBag,
  Loader2, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { ReviewDTO } from "@/types";
import Link from "next/link";

export default function MyReviewsPage() {
  const { user } = useAuth();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const res = await apiClient.get<ReviewDTO[]>(`/reviews/customer/${user?.email}`);
      return res.data;
    },
    enabled: !!user?.email,
  });

  const approvedReviews = reviews?.filter(r => r.approved) ?? [];
  const pendingReviews = reviews?.filter(r => !r.approved) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Chargement de vos avis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <div className="flex items-center gap-6 mb-12">
          <Link
            href="/profile"
            className="p-3 bg-background border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Mes <span className="text-primary italic">Avis</span>
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              {reviews?.length || 0} avis soumis · {approvedReviews.length} publiés
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total soumis", value: reviews?.length || 0, icon: MessageSquare, color: "text-primary bg-primary/10" },
            { label: "Publiés", value: approvedReviews.length, icon: CheckCircle2, color: "text-green-500 bg-green-500/10" },
            { label: "En attente", value: pendingReviews.length, icon: Clock, color: "text-amber-500 bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-6 bg-background border border-border rounded-[2rem] text-center">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4", color)}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black mb-1">{value}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {reviews?.length === 0 ? (
          <div className="py-24 bg-background border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center text-center px-4">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Aucun avis</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Achetez des produits et partagez votre expérience pour aider la communauté ShopFlow.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20"
            >
              <ShoppingBag className="w-5 h-5" />
              Découvrir le catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingReviews.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  En attente de modération ({pendingReviews.length})
                </p>
                <div className="space-y-4">
                  <AnimatePresence>
                    {pendingReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} isPending />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {approvedReviews.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-green-500 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Publiés ({approvedReviews.length})
                </p>
                <div className="space-y-4">
                  <AnimatePresence>
                    {approvedReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, isPending = false }: { review: ReviewDTO; isPending?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "p-8 bg-background border rounded-[2.5rem] transition-all hover:shadow-lg",
        isPending ? "border-amber-500/20 bg-amber-500/5" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <Link href={`/product/${review.productId}`} className="font-black text-lg hover:text-primary transition-colors">
          {review.productName}
        </Link>
        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              En modération
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Publié
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn("w-4 h-4", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted")}
          />
        ))}
        <span className="ml-2 font-black text-sm text-amber-500">{review.rating}/5</span>
      </div>

      <p className="text-muted-foreground leading-relaxed italic mb-4">
        "{review.comment}"
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
        <Calendar className="w-3 h-3" />
        {new Date(review.createdAt).toLocaleDateString("fr-FR", {
          year: "numeric", month: "long", day: "numeric"
        })}
      </div>
    </motion.div>
  );
}
