export type ProductFeedback = {
  id: string;
  product_id: string;
  customer_name: string;
  phone: string;
  email: string;
  province: string;
  comment: string;
  rating: number;
  created_at: string;
};

export type NewProductFeedbackInput = {
  productId: string;
  name: string;
  phone: string;
  email: string;
  province: string;
  comment: string;
  rating: number;
};
