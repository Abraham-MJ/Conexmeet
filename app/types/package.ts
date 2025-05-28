export interface Package {
  id: number;
  name: string;
  description: string;
  promotion: string;
  icon: string | null;
  image: string | null;
  points: number;
  chat_message: number;
  minutes: number;
  minutes_promo: number;
  price: number;
  type: string;
  is_active: number;
  product_stripe_id: string | null;
  price_stripe_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}
