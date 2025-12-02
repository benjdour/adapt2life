export const STRIPE_PRICES = {
  MOMENTUM_MONTHLY: "price_1SZudFLvv1wWqNXvPquR6KQx",
  MOMENTUM_YEARLY: "price_1SZuVKLvv1wWqNXvZAIkgxLO",
  PEAK_MONTHLY: "price_1SZuUVLvv1wWqNXv2JeQ0H5P",
  PEAK_YEARLY: "price_1SZudaLvv1wWqNXv61LB9zhf",
  ELITE_MONTHLY: "price_1SZuViLvv1wWqNXvIsJ3gvZN",
  ELITE_YEARLY: "price_1SZuZiLvv1wWqNXv4NUZfeQH",
} as const;

type StripePrices = typeof STRIPE_PRICES;
export type StripePriceKey = keyof StripePrices;
