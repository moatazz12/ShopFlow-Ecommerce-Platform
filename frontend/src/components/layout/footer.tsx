"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Share2, Globe, MessageSquare, Mail } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage) return null;

  return (
    <footer className="bg-muted/50 border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter">
                SHOP<span className="text-primary italic">FLOW</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La plateforme e-commerce nouvelle génération offrant une expérience d'achat fluide et premium pour tous.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="p-2 bg-background border border-border rounded-lg hover:text-primary transition-all shadow-sm"><Globe className="w-4 h-4" /></Link>
              <Link href="#" className="p-2 bg-background border border-border rounded-lg hover:text-primary transition-all shadow-sm"><MessageSquare className="w-4 h-4" /></Link>
              <Link href="#" className="p-2 bg-background border border-border rounded-lg hover:text-primary transition-all shadow-sm"><Share2 className="w-4 h-4" /></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6 border-b border-primary/20 pb-2 inline-block">Boutique</h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">Toutes les catégories</Link></li>
              <li><Link href="/products?promo=true" className="hover:text-primary transition-colors">Promotions</Link></li>
              <li><Link href="/products?sortBy=newest" className="hover:text-primary transition-colors">Nouveautés</Link></li>
              <li><Link href="/products?sortBy=popularity" className="hover:text-primary transition-colors">Meilleures ventes</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6 border-b border-primary/20 pb-2 inline-block">Assistance</h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Nous contacter</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Livraison & Retours</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Conditions Générales</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest mb-4 border-b border-primary/20 pb-2 inline-block">Newsletter</h4>
            <p className="text-sm text-muted-foreground">Inscrivez-vous pour recevoir nos meilleures offres.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Votre email"
                  className="w-full h-10 bg-background border border-border rounded-lg pl-10 pr-4 text-sm outline-none focus:border-primary transition-all"
                />
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all">OK</button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 ShopFlow. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
            <Link href="#" className="hover:text-primary transition-colors">Mentions Légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
