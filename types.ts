export type UserRole = 'buyer' | 'seller';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  sellerProfile?: {
    farmName: string;
    address: string;
    phone: string;
    description: string;
  };
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  stock: number;
  imageUrl: string;
  upiId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerEmail: string;
  buyerUpiId?: string;
  sellerId: string;
  sellerUpiId?: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentId?: string;
  deliveryAddress?: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
