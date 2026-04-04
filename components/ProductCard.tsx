import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Tag, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onBuy?: (product: Product) => void;
  isSeller?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy, isSeller, onDelete, onEdit }) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden hover:shadow-xl transition-all group">
      <div className="aspect-square relative overflow-hidden bg-stone-100">
        <img 
          src={product.imageUrl || `https://picsum.photos/seed/${product.name}/400/400`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://picsum.photos/seed/${product.name}-fallback/400/400`;
          }}
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-600 shadow-sm">
            {product.category}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-stone-900 leading-tight">{product.name}</h3>
          <p className="text-emerald-600 font-bold text-lg">
            ₹{product.price}
            <span className="text-xs text-stone-400 font-normal ml-1">/{product.unit}</span>
          </p>
        </div>
        
        <p className="text-stone-500 text-sm line-clamp-2 mb-4 h-10">
          {product.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-stone-400 mb-6">
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>{product.stock} {product.unit} left</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Fresh Pick</span>
          </div>
        </div>

        {isSeller ? (
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => onEdit?.(product)}
              className="w-full py-3 rounded-2xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition-colors"
            >
              Edit Listing
            </button>
            <button 
              onClick={() => onDelete?.(product.id)}
              className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
            >
              Remove Listing
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onBuy?.(product)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
