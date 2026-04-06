import React, { useState } from 'react';
import { MapPin, Clock, Phone, ShoppingBag, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketMapModal from './MarketMapModal';

interface MarketCardProps {
  market: {
    name: string;
    location: string;
    timing: string;
    contact: string;
    rating: number;
    image: string;
    description: string;
  };
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="bg-white rounded-[32px] border border-stone-100 overflow-hidden hover:shadow-xl transition-all group">
      <div className="h-48 relative overflow-hidden">
        <img 
          src={market.image || `https://picsum.photos/seed/${market.name}-vegetables/600/400`} 
          alt={market.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-stone-700">{market.rating}</span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-stone-900 mb-2">{market.name}</h3>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{market.location}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{market.timing}</span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                {market.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-6">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{market.contact}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 py-3 rounded-2xl bg-stone-50 text-stone-600 text-sm font-bold hover:bg-stone-100 transition-colors"
          >
            {isExpanded ? 'Show Less' : 'View Details'}
          </button>
          <button 
            onClick={() => setIsMapOpen(true)}
            className="px-4 py-3 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MarketMapModal 
        market={market} 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
      />
    </div>
  );
};

export default MarketCard;
