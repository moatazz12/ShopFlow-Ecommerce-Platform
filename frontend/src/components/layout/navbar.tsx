"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, User, Users, LogOut,
  Menu, X, Bell, ShoppingCart, Package, Heart,
  Loader2, ArrowRight, Star, LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { productService } from "@/services/product.service";
import { ProductDTO } from "@/types";
import Image from "next/image";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await productService.getProducts({ q: searchQuery, size: 5 });
          setSearchResults(res.content);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-primary/20">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter hidden sm:block">
            SHOP<span className="text-primary italic">FLOW</span>
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md relative group" ref={searchRef}>
          <div className={cn(
            "absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 transition-opacity",
            isSearchFocused && "opacity-100"
          )} />
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => {
                setIsSearchFocused(true);
                if (searchResults.length > 0) setShowResults(true);
              }}
              className="w-full h-10 bg-muted/50 border border-transparent rounded-full pl-10 pr-4 text-sm focus:bg-background focus:border-primary outline-none transition-all"
            />

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                >
                  {isSearching ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recherche en cours...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            router.push(`/product/${product.id}`);
                            setShowResults(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-xl transition-all group text-left"
                        >
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200"}
                              alt={product.nom}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{product.nom}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{product.sellerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm text-primary">{product.prixPromo || product.prix}€</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {product.averageRating.toFixed(1)}
                            </p>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
                          setShowResults(false);
                        }}
                        className="w-full mt-2 p-3 bg-muted/50 hover:bg-primary/10 hover:text-primary text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Voir tous les résultats
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">
                      Aucun produit trouvé pour "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {(!user || user.role === "CUSTOMER") && (
            <>
              {/* Favorites Icon */}
              <Link href="/favorites" className="relative p-2 hover:bg-muted rounded-full transition-colors group">
                <motion.div
                  key={wishlistItems.length}
                  initial={{ scale: 1 }}
                  animate={wishlistItems.length > 0 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn(
                    "w-6 h-6 transition-colors",
                    wishlistItems.length > 0 ? "text-red-500 fill-red-500" : "text-foreground group-hover:text-red-500"
                  )} />
                </motion.div>
                <AnimatePresence>
                  {wishlistItems.length > 0 && (
                    <motion.span
                      key="wishlist-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/40"
                    >
                      {wishlistItems.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Cart Icon */}
              <Link href="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors group">
                <motion.div
                  key={itemCount}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <ShoppingCart className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                </motion.div>
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, y: -5 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </>
          )}

          <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

          {/* User Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-4 rounded-full border border-border hover:border-primary transition-all bg-muted/30"
              >
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold leading-none">{user?.prenom}</span>
                  <span className="text-[10px] text-muted-foreground">Mon compte</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-2xl shadow-xl p-2"
                  >
                    <div className="p-3 border-b border-border mb-2">
                      <p className="font-bold text-sm">{user?.prenom} {user?.nom}</p>
                      <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {user?.role}
                      </span>
                    </div>
                    {/* --- MENU ADMIN --- */}
                    {user?.role === "ADMIN" && (
                      <>
                        <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Console Admin</div>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/admin/dashboard" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/admin/dashboard" ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-sm font-medium")}>
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/admin/users" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/admin/users" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <Users className="w-4 h-4" /> Utilisateurs
                        </Link>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/admin/categories" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/admin/categories" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <Package className="w-4 h-4" /> Catégories
                        </Link>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/admin/orders" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/admin/orders" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <ShoppingCart className="w-4 h-4" /> Commandes
                        </Link>
                      </>
                    )}

                    {/* --- MENU SELLER --- */}
                    {user?.role === "SELLER" && (
                      <>
                        <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ma Boutique</div>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/seller/dashboard" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/seller/dashboard" ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-sm font-medium")}>
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/seller/products" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/seller/products" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <Package className="w-4 h-4" /> Mes Produits
                        </Link>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/seller/orders" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/seller/orders" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <ShoppingCart className="w-4 h-4" /> Ventes
                        </Link>
                      </>
                    )}

                    {/* --- MENU CUSTOMER --- */}
                    {user?.role === "CUSTOMER" && (
                      <>
                        <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Espace Client</div>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/orders" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/orders" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <ShoppingBag className="w-4 h-4" /> Mes commandes
                        </Link>
                        <Link onClick={() => setIsUserMenuOpen(false)} href="/profile/reviews" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/profile/reviews" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                          <Star className="w-4 h-4" /> Mes avis
                        </Link>
                      </>
                    )}

                    <div className="border-t border-border mt-2 pt-2">
                      <Link onClick={() => setIsUserMenuOpen(false)} href="/profile" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/profile" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-sm font-medium")}>
                        <User className="w-4 h-4" /> Mon profil
                      </Link>
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500 text-sm font-bold transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-sm font-bold hover:text-primary transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all"
              >
                S'inscrire
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="container mx-auto p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full h-11 bg-muted rounded-xl pl-10 pr-4 text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/products" className="p-3 font-bold hover:text-primary transition-colors">Catégories</Link>
                <Link href="/products?promo=true" className="p-3 font-bold hover:text-primary transition-colors">Promotions</Link>
                {/* Auth specific mobile links */}
                {!isAuthenticated && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Link href="/login" className="flex items-center justify-center p-3 font-bold border border-border rounded-xl">Connexion</Link>
                    <Link href="/register" className="flex items-center justify-center p-3 font-bold bg-primary text-white rounded-xl">S'inscrire</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
