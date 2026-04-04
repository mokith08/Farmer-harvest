import React from 'react';
import { UserRole } from '../types';
import { motion } from 'framer-motion';
import { Sprout, ShoppingBasket } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
            <Sprout className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Welcome!</h1>
          <p className="text-stone-500">How would you like to use HarvestHub today?</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-stone-700 text-center uppercase tracking-wider">I want to...</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelect('buyer')}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 text-stone-500 hover:text-emerald-700 transition-all group"
            >
              <ShoppingBasket className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Buy Fresh</span>
            </button>
            <button
              onClick={() => onSelect('seller')}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 text-stone-500 hover:text-emerald-700 transition-all group"
            >
              <Sprout className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Sell Produce</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelection;
