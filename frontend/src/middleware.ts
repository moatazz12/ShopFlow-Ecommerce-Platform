import { NextRequest, NextResponse } from "next/server";

// Routes accessibles uniquement aux rôles spécifiques
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/seller": ["SELLER", "ADMIN"],
  "/checkout": ["CUSTOMER", "SELLER", "ADMIN"],
  "/orders": ["CUSTOMER", "SELLER", "ADMIN"],
  "/profile": ["CUSTOMER", "SELLER", "ADMIN"],
  "/cart": ["CUSTOMER", "SELLER", "ADMIN"],
};

// Pages publiques (pas de redirection même si non connecté)
const PUBLIC_ROUTES = ["/login", "/register", "/", "/products", "/product"];

function getTokenPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques et API routes Next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Récupérer le token depuis les cookies (plus sécurisé) ou header
  const tokenCookie = request.cookies.get("accessToken")?.value;

  // Vérifier si la route nécessite une authentification
  const protectedRoute = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    const [, allowedRoles] = protectedRoute;

    if (!tokenCookie) {
      // Non connecté → login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Décoder le JWT pour vérifier le rôle
    const payload = getTokenPayload(tokenCookie);

    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Vérifier expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token expiré — le refresh se fera côté client
      // On laisse passer, l'interceptor axios gérera le refresh
      return NextResponse.next();
    }

    // Extraire le rôle du token Spring Security
    const authorities: string[] = (payload as any).authorities || 
                                   (payload as any).roles || [];
    const userRole = authorities[0]?.replace("ROLE_", "") || (payload as any).role;

    if (!allowedRoles.includes(userRole)) {
      // Mauvais rôle → page d'accueil
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/cart/:path*",
  ],
};
