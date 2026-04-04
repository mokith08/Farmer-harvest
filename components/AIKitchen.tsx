import React, { useState } from 'react';
import { Sparkles, UtensilsCrossed, ShoppingBasket, Loader2, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { getRecipeIdeas, getMarketAssistantResponse } from '../services/groq';

interface AIKitchenProps {
  availableProducts: string[];
}

const AIKitchen: React.FC<AIKitchenProps> = ({ availableProducts }) => {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenerateRecipe = async () => {
    setLoading(true);
    try {
      const result = await getRecipeIdeas(availableProducts.slice(0, 5));
      setRecipe(result);
    } catch (error) {
      console.error("Error generating recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await getMarketAssistantResponse(
        `Suggest an Indian style recipe for: ${customPrompt}`,
        `User is in the AI Kitchen. Available products in market: ${availableProducts.join(', ')}`
      );
      setRecipe(result);
    } catch (error) {
      console.error("Error generating custom recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-emerald-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800/50 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-700">
            <Sparkles className="w-4 h-4" />
            AI Powered Cooking
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            What's for dinner? <br />
            <span className="text-emerald-400 italic">Let AI decide.</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-8 leading-relaxed">
            Our AI Kitchen suggests delicious Indian recipes based on what's fresh in the Market today. 
            No more "what should I cook" stress!
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleGenerateRecipe}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-950/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UtensilsCrossed className="w-5 h-5" />}
              Get Indian Style Recipe
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              Recipe Ideas
            </h2>
            
            {recipe ? (
              <div className="prose prose-stone max-w-none">
                <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 relative">
                  <button 
                    onClick={() => setRecipe(null)}
                    className="absolute top-4 right-4 p-2 hover:bg-stone-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                  <Markdown>{recipe}</Markdown>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-stone-100 rounded-3xl">
                <UtensilsCrossed className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400 font-medium">Click the button above or ask for a specific dish below!</p>
              </div>
            )}
          </div>

          <form onSubmit={handleCustomPrompt} className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm flex gap-4">
            <input 
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask for a specific dish (e.g. 'Paneer Butter Masala')"
              className="flex-1 px-6 py-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button 
              type="submit"
              disabled={loading || !customPrompt.trim()}
              className="px-6 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Ask AI
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <ShoppingBasket className="w-5 h-5 text-emerald-600" />
              In Season Now
            </h3>
            <p className="text-sm text-stone-500 mb-6">These items are fresh in the Market and great for recipes!</p>
            <div className="space-y-3">
              {availableProducts.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="font-medium text-stone-700">{item}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Fresh</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
            <h3 className="font-bold text-emerald-900 mb-2">Sustainability Tip</h3>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Buying seasonal produce in India like Mangoes in summer or Carrots in winter reduces transport emissions and supports local farmers!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIKitchen;
