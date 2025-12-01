export const STRIPE_PRICES = {
  MOMENTUM_MONTHLY: "price_1SZeoHLG4SxgTGk36af6QkRM",
  MOMENTUM_YEARLY: "price_1SZepJLG4SxgTGk3pkfPeXsH",
  PEAK_MONTHLY: "price_1SZeqHLG4SxgTGk3seRjlWTV",
  PEAK_YEARLY: "price_1SZerOLG4SxgTGk3Z4WMD5S7",
  ELITE_MONTHLY: "price_1SZesHLG4SxgTGk31xMA9jcH",
  ELITE_YEARLY: "price_1SZeskLG4SxgTGk31fpwyNp6",
} as const;

type StripePrices = typeof STRIPE_PRICES;
export type StripePriceKey = keyof StripePrices;
