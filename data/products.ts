export type FitType = "narrow" | "normal" | "wide";
export type ActivityType = "running" | "casual" | "sport" | "hiking" | "formal" | "streetwear";
export type StyleType = "sporty" | "elegant" | "minimalist" | "streetwear" | "outdoor" | "eco_lifestyle";
export type MaterialType = "recycled" | "vegan" | "leather" | "knit";
export type CushioningType = "soft" | "medium" | "hard" | "firm";
export type ComfortLevel = "low" | "medium" | "high";

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: any;
  images: any[];
  category: string;
  description: string;
  sizes: number[];
  fit_type: FitType;
  recommended_for: FitType[];
  avoid_for: FitType[];
  comfort_level: ComfortLevel;
  activity_type: ActivityType;
  eco_friendly: boolean;
  eco_discount?: number;
  material_type: MaterialType;
  style_type: StyleType;
  cushioning: CushioningType;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface SellerStore {
  id: string;
  ownerUserId: string;
  name: string;
  username: string;
  ownerName: string;
  address: string;
  city: string;
  description: string;
  category: string;
  brandStyle: string;
  contact: string;
  instagram?: string;
  isEcoCertified: boolean;
  logoUri?: string;
  bannerUri?: string;
  createdAt: string;
  totalProducts: number;
  totalSales: number;
  rating: number;
}

export interface SellerProduct extends Product {
  sellerId: string;
  storeId: string;
  isSellerProduct: true;
  imageUri?: string;
}

const shoe1 = require("../assets/images/shoe1.png");
const shoe2 = require("../assets/images/shoe2.png");
const shoe3 = require("../assets/images/shoe3.png");

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "AeroFlex Comfort",
    brand: "AeroFlex",
    price: 120,
    originalPrice: 150,
    rating: 4.8,
    reviewCount: 1243,
    image: shoe1,
    images: [shoe1, shoe2],
    category: "Running",
    description:
      "The AeroFlex Comfort is engineered for wide-footed runners who demand maximum comfort during long sessions. Recycled upper mesh with premium cushioning.",
    sizes: [38, 39, 40, 41, 42, 43, 44, 45],
    fit_type: "wide",
    recommended_for: ["wide", "normal"],
    avoid_for: ["narrow"],
    comfort_level: "high",
    activity_type: "running",
    eco_friendly: true,
    eco_discount: 15,
    material_type: "recycled",
    style_type: "sporty",
    cushioning: "soft",
    isFeatured: true,
    isNew: false,
  },
  {
    id: "2",
    name: "LocalStride Daily",
    brand: "LocalStride",
    price: 89,
    rating: 4.6,
    reviewCount: 876,
    image: shoe2,
    images: [shoe2, shoe3],
    category: "Casual",
    description:
      "Crafted by local artisans with sustainable materials. The LocalStride Daily combines UMKM craftsmanship with modern streetwear aesthetics.",
    sizes: [38, 39, 40, 41, 42, 43, 44],
    fit_type: "normal",
    recommended_for: ["narrow", "normal"],
    avoid_for: ["wide"],
    comfort_level: "medium",
    activity_type: "casual",
    eco_friendly: true,
    eco_discount: 12,
    material_type: "vegan",
    style_type: "streetwear",
    cushioning: "medium",
    isFeatured: true,
    isNew: false,
  },
  {
    id: "3",
    name: "VoltStep Slim",
    brand: "VoltStep",
    price: 135,
    originalPrice: 160,
    rating: 4.7,
    reviewCount: 2012,
    image: shoe3,
    images: [shoe3, shoe1],
    category: "Sport",
    description:
      "Elite performance shoe for narrow-footed athletes. Carbon fiber plate technology meets precision fit engineering for peak sport performance.",
    sizes: [39, 40, 41, 42, 43, 44],
    fit_type: "narrow",
    recommended_for: ["narrow"],
    avoid_for: ["wide", "normal"],
    comfort_level: "high",
    activity_type: "sport",
    eco_friendly: false,
    material_type: "knit",
    style_type: "sporty",
    cushioning: "hard",
    isNew: true,
    isFeatured: true,
  },
  {
    id: "4",
    name: "UrbanKicks Neo",
    brand: "UrbanKicks",
    price: 145,
    rating: 4.5,
    reviewCount: 934,
    image: shoe1,
    images: [shoe1],
    category: "Streetwear",
    description:
      "The UrbanKicks Neo brings the streets to life. A premium streetwear silhouette with chunky sole and neon accents for the bold urban explorer.",
    sizes: [38, 39, 40, 41, 42, 43, 44, 45, 46],
    fit_type: "normal",
    recommended_for: ["normal", "wide"],
    avoid_for: [],
    comfort_level: "medium",
    activity_type: "casual",
    eco_friendly: false,
    material_type: "leather",
    style_type: "streetwear",
    cushioning: "medium",
    isNew: true,
    isFeatured: false,
  },
  {
    id: "5",
    name: "SneakPeak Air Trail",
    brand: "SneakPeak",
    price: 175,
    originalPrice: 200,
    rating: 4.9,
    reviewCount: 3210,
    image: shoe2,
    images: [shoe2, shoe1],
    category: "Hiking",
    description:
      "Conquer any terrain with the SneakPeak Air Trail. Wide toe box design provides natural foot movement on challenging trails.",
    sizes: [39, 40, 41, 42, 43, 44, 45],
    fit_type: "wide",
    recommended_for: ["wide", "normal"],
    avoid_for: ["narrow"],
    comfort_level: "high",
    activity_type: "hiking",
    eco_friendly: true,
    eco_discount: 10,
    material_type: "recycled",
    style_type: "sporty",
    cushioning: "soft",
    isNew: false,
    isFeatured: true,
  },
  {
    id: "6",
    name: "VoltStep Formal",
    brand: "VoltStep",
    price: 195,
    rating: 4.4,
    reviewCount: 567,
    image: shoe3,
    images: [shoe3],
    category: "Formal",
    description:
      "VoltStep Formal delivers boardroom confidence in narrow precision-fit silhouette. Premium full-grain leather meets modern minimalist design.",
    sizes: [39, 40, 41, 42, 43, 44],
    fit_type: "narrow",
    recommended_for: ["narrow", "normal"],
    avoid_for: ["wide"],
    comfort_level: "medium",
    activity_type: "formal",
    eco_friendly: false,
    material_type: "leather",
    style_type: "elegant",
    cushioning: "medium",
    isNew: false,
    isFeatured: false,
  },
  {
    id: "7",
    name: "AeroFlex EcoRun",
    brand: "AeroFlex",
    price: 110,
    originalPrice: 130,
    rating: 4.7,
    reviewCount: 1890,
    image: shoe3,
    images: [shoe3, shoe2],
    category: "Running",
    description:
      "100% recycled materials meet SmartFit technology. The AeroFlex EcoRun is our most sustainable shoe yet, with zero compromise on performance.",
    sizes: [38, 39, 40, 41, 42, 43, 44, 45],
    fit_type: "normal",
    recommended_for: ["narrow", "normal"],
    avoid_for: [],
    comfort_level: "high",
    activity_type: "running",
    eco_friendly: true,
    eco_discount: 20,
    material_type: "recycled",
    style_type: "sporty",
    cushioning: "soft",
    isNew: false,
    isFeatured: false,
  },
  {
    id: "8",
    name: "LocalStride Weave",
    brand: "LocalStride",
    price: 95,
    rating: 4.3,
    reviewCount: 423,
    image: shoe1,
    images: [shoe1, shoe3],
    category: "Casual",
    description:
      "Hand-woven upper by local craftspeople using natural fibers. Eco-certified and built for all-day comfort in urban environments.",
    sizes: [38, 39, 40, 41, 42, 43],
    fit_type: "wide",
    recommended_for: ["wide", "normal"],
    avoid_for: [],
    comfort_level: "high",
    activity_type: "casual",
    eco_friendly: true,
    eco_discount: 18,
    material_type: "vegan",
    style_type: "minimalist",
    cushioning: "soft",
    isNew: false,
    isFeatured: false,
  },
  {
    id: "9",
    name: "UrbanKicks Boost",
    brand: "UrbanKicks",
    price: 160,
    rating: 4.6,
    reviewCount: 1120,
    image: shoe2,
    images: [shoe2],
    category: "Sport",
    description:
      "Boost energy-return foam in a clean urban silhouette. Perfect balance of sport performance and street style.",
    sizes: [39, 40, 41, 42, 43, 44, 45],
    fit_type: "normal",
    recommended_for: ["narrow", "normal", "wide"],
    avoid_for: [],
    comfort_level: "high",
    activity_type: "sport",
    eco_friendly: false,
    material_type: "knit",
    style_type: "sporty",
    cushioning: "soft",
    isNew: true,
    isFeatured: false,
  },
  {
    id: "10",
    name: "SneakPeak Zero-G",
    brand: "SneakPeak",
    price: 220,
    originalPrice: 260,
    rating: 4.9,
    reviewCount: 4502,
    image: shoe1,
    images: [shoe1, shoe2, shoe3],
    category: "Running",
    description:
      "Next generation lightweight running shoe with adaptive fit technology. Under 200g total weight with responsive cushioning for every footstrike.",
    sizes: [38, 39, 40, 41, 42, 43, 44, 45, 46],
    fit_type: "narrow",
    recommended_for: ["narrow", "normal"],
    avoid_for: ["wide"],
    comfort_level: "high",
    activity_type: "running",
    eco_friendly: true,
    eco_discount: 10,
    material_type: "recycled",
    style_type: "minimalist",
    cushioning: "soft",
    isNew: true,
    isFeatured: true,
  },
  {
    id: "11",
    name: "AeroFlex Trail Eco",
    brand: "AeroFlex",
    price: 130,
    rating: 4.5,
    reviewCount: 780,
    image: shoe3,
    images: [shoe3, shoe1],
    category: "Hiking",
    description:
      "Sustainable trail running shoe using ocean-recovered plastics. Gripped outsole with adaptive support for off-road adventures.",
    sizes: [39, 40, 41, 42, 43, 44, 45],
    fit_type: "wide",
    recommended_for: ["wide", "normal"],
    avoid_for: [],
    comfort_level: "high",
    activity_type: "hiking",
    eco_friendly: true,
    eco_discount: 14,
    material_type: "recycled",
    style_type: "sporty",
    cushioning: "medium",
    isNew: false,
    isFeatured: false,
  },
  {
    id: "12",
    name: "VoltStep Knit Racer",
    brand: "VoltStep",
    price: 155,
    originalPrice: 180,
    rating: 4.7,
    reviewCount: 1450,
    image: shoe2,
    images: [shoe2, shoe3],
    category: "Sport",
    description:
      "Precision-engineered knit racer for competitive sport performance. Dynamic fit system adapts to foot movement during high-intensity activities.",
    sizes: [39, 40, 41, 42, 43, 44],
    fit_type: "narrow",
    recommended_for: ["narrow"],
    avoid_for: ["wide"],
    comfort_level: "high",
    activity_type: "sport",
    eco_friendly: false,
    material_type: "knit",
    style_type: "sporty",
    cushioning: "hard",
    isNew: false,
    isFeatured: false,
  },
];

export const CATEGORIES = ["All", "Running", "Casual", "Sport", "Hiking", "Formal", "Streetwear"];

export const BRANDS = ["UrbanKicks", "VoltStep", "AeroFlex", "SneakPeak", "LocalStride"];

export function getSmartFitScore(
  product: Product,
  footType: FitType | null,
  prefersEco: boolean,
  preferredActivity: ActivityType | null
): number {
  if (!footType) return 70;
  let score = 50;
  if (product.fit_type === footType) score += 30;
  if (product.recommended_for.includes(footType)) score += 20;
  if (product.avoid_for.includes(footType)) score -= 60;
  if (prefersEco && product.eco_friendly) score += 15;
  if (preferredActivity && product.activity_type === preferredActivity) score += 15;
  if (product.comfort_level === "high") score += 5;
  return Math.max(0, Math.min(100, score));
}

export function getEcoProducts(sellerProducts: SellerProduct[] = []): Product[] {
  const allProducts = getAllProducts(sellerProducts);
  return allProducts.filter((p) => p.eco_friendly);
}

export function getFootTypeLabel(type: FitType): string {
  return { narrow: "Narrow Foot", normal: "Normal Foot", wide: "Wide Foot" }[type];
}

// Helper functions for merging seller data with static data
// These will be called with seller data from AppContext
export function getAllProducts(sellerProducts: SellerProduct[] = []): Product[] {
  return [...PRODUCTS, ...sellerProducts];
}

export function getAllBrands(sellerStores: SellerStore[] = []): string[] {
  const staticBrands = [...BRANDS];
  const sellerBrandNames = sellerStores.map((store) => store.name);
  return [...staticBrands, ...sellerBrandNames];
}
