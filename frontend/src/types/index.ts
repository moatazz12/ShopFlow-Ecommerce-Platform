export type Role = "ADMIN" | "SELLER" | "CUSTOMER";

export interface UserDTO {
  id?: number;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  shopName?: string;
  shopLogo?: string;
  shopDescription?: string;
  actif?: boolean;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: Role;
  shopName?: string;
  shopLogo?: string;
  shopDescription?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface CategoryDTO {
  id: number;
  nom: string;
  description: string;
  parentId?: number;
  subCategories: CategoryDTO[];
}

export interface ReviewDTO {
  id: number;
  productId: number;
  productName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export interface ProductVariantDTO {
  id: number;
  taille?: string;
  couleur?: string;
  stock: number;
  prixSupplementaire: number;
}

export interface ProductDTO {
  id: number;
  nom: string;
  description: string;
  prix: number;
  prixPromo?: number | null;
  discountPercentage?: number;
  stock: number;
  actif: boolean;
  images: string[];
  categoryNames: string[];
  sellerName?: string;
  variants?: ProductVariantDTO[];
  averageRating: number;
  reviewCount: number;
  reviews: ReviewDTO[];
}

export interface CartItemDTO {
  id: number;
  productId: number;
  variantId?: number;
  productName: string;
  variantLabel?: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartDTO {
  id: number;
  customerEmail: string;
  items: CartItemDTO[];
  totalItems: number;
  subtotalAmount: number;
  discountAmount?: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  promoCode?: string;
}

export interface CartItemRequest {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface CheckoutRequest {
  paymentSuccess: boolean;
  shippingAddressId: number;
}

export interface OrderItemDTO {
  productId: number;
  productName: string;
  variantId?: number;
  variantLabel?: string;
  sellerName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDTO {
  id: number;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  orderNumber: string;
  paymentReference?: string;
  shippingAddressId?: number;
  isNew: boolean;
  refunded: boolean;
  createdAt: string;
  items: OrderItemDTO[];
}

export interface SellerDashboardDTO {
  revenue: number;
  pendingOrders: number;
  lowStockAlerts: string[];
}

export interface AdminDashboardDTO {
  globalRevenue: number;
  topProducts: string[];
  topSellers: string[];
  recentOrders: string[];
  pendingReviewsCount: number;
}
