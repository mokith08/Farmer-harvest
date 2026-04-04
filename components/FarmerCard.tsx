import React, { useState } from 'react';
import { User, MapPin, Award, MessageSquare, ChevronRight, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FarmerCardProps {
  farmer: {
    name: string;
    farm: string;
    location: string;
    specialty: string;
    bio: string;
    image: string;
    experience: string;
  };
}

const FarmerCard: React.FC<FarmerCardProps> = ({ farmer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white rounded-[32px] border border-stone-100 overflow-hidden hover:shadow-xl transition-all group">
      <div className="h-48 relative overflow-hidden">
        <img 
          src={farmer.image || `https://picsum.photos/seed/${farmer.name}-produce/600/400`} 
          alt={farmer.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-stone-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
        </button>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-stone-900">{farmer.name}</h3>
            <p className="text-emerald-600 font-bold text-sm">{farmer.farm}</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden -mt-12 bg-white">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${farmer.name}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{farmer.location}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>{farmer.experience} Experience</span>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Specialty</span>
          <div className="flex flex-wrap gap-2">
            {(farmer.specialty || '').split(',').map((s, i) => (
              <span key={i} className="px-3 py-1 bg-stone-50 rounded-full text-xs font-bold text-stone-600 border border-stone-100">
                {s.trim()}
              </span>
            ))}
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
              <p className="text-sm text-stone-500 mb-6 leading-relaxed italic">
                "{farmer.bio}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 py-3 rounded-2xl bg-stone-50 text-stone-600 text-sm font-bold hover:bg-stone-100 transition-colors"
          >
            {isExpanded ? 'Hide Story' : "View Farmer's Story"}
          </button>
          <button 
            onClick={() => alert(`Chatting with ${farmer.name}...`)}
            className="px-4 py-3 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerCard;
