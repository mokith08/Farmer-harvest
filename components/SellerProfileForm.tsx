import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, FileText, CheckCircle2 } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface SellerProfileFormProps {
  profile: UserProfile;
  onComplete: () => void;
}

const SellerProfileForm: React.FC<SellerProfileFormProps> = ({ profile, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmName: '',
    address: '',
    phone: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isGuest = profile.uid.startsWith('guest');
    
    console.log("Updating seller profile for:", profile.uid, formData);
    
    if (isGuest) {
      console.log("Guest Mode - Skipping Firestore Profile Update");
      await new Promise(r => setTimeout(r, 800)); // Simulate work
      onComplete();
      setLoading(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        sellerProfile: formData
      });
      console.log("Seller profile updated successfully");
      onComplete();
    } catch (error) {
      console.error("Error updating seller profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-stone-100"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-[32px] flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <Store className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-stone-900 mb-2">Complete Your Farmer Profile</h2>
          <p className="text-stone-500">Tell buyers about your farm and how to reach you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Store className="w-3 h-3" /> Farm Name
            </label>
            <input
              required
              type="text"
              value={formData.farmName}
              onChange={(e) => setFormData({...formData, farmName: e.target.value})}
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="e.g. Green Valley Organic Farm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Farm Address
            </label>
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="123 Country Road, Farmville"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Phone className="w-3 h-3" /> Contact Phone
            </label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> About Your Farm
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-32 resize-none"
              placeholder="Describe your farming practices, what you grow, and your story..."
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Start Selling
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SellerProfileForm;
