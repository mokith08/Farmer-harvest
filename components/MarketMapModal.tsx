import React from 'react';
import { X, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketMapModalProps {
  market: {
    name: string;
    location: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const MarketMapModal: React.FC<MarketMapModalProps> = ({ market, isOpen, onClose }) => {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(market.name + ' ' + market.location)}`;
  // Since we don't have a Google Maps API Key easily available in this environment without asking the user, 
  // I will use the standard search URL which doesn't require a key for simple embedding if we use the search interface, 
  // or better, a direct link to Google Maps if embedding is tricky without a key.
  
  // Actually, standard Google Maps embedding for "search" often requires an API key for the "embed" API.
  // But we can use the regular google maps URL in an iframe for some cases, or just provide a nice modal with a button.
  
  // Let's use a beautiful modal with a placeholder map image (or a generic map background) and a strong "Open in Google Maps" button.
  // Or use a non-API-key-required embed if possible (some open street maps could work too).
  
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(market.name + ' ' + market.location)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">{market.name}</h3>
                  <p className="text-sm text-stone-500">{market.location}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <div className="aspect-video w-full bg-stone-100 relative group">
              {/* Fallback for Map - using a beautiful satellite/map placeholder from Unsplash */}
              <img 
                src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200`}
                className="w-full h-full object-cover opacity-60"
                alt="Map Preview"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-stone-900/10 transition-colors group-hover:bg-stone-900/5">
                <div className="bg-white/90 backdrop-blur p-6 rounded-3xl shadow-xl text-center max-w-sm">
                  <Navigation className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
                  <p className="text-stone-700 font-medium mb-6">
                    We'll open the precise location for <span className="font-bold">{market.name}</span> in external maps for live navigation.
                  </p>
                  <a 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/20"
                  >
                    Open in Google Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 bg-stone-50 flex items-center justify-between">
              <p className="text-xs text-stone-400 font-medium">
                Tip: Local markets often have varying entry points. Follow signs for APMC/Mandi gates.
              </p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MarketMapModal;
