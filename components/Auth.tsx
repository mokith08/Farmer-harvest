import React, { useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Sprout, LogIn, Loader2 } from 'lucide-react';

interface AuthProps {
  onRoleSelect: (role: 'buyer' | 'seller') => void;
}

const Auth: React.FC<AuthProps> = ({ onRoleSelect }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (role: 'buyer' | 'seller') => {
    setLoading(true);
    setError(null);
    onRoleSelect(role);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // App.tsx will handle the auth state change
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Farmer Login in Corner */}
      <div className="absolute top-8 right-8 z-20">
        <button 
          onClick={() => handleGoogleSignIn('seller')}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur rounded-2xl text-emerald-700 font-bold shadow-lg hover:bg-white transition-all active:scale-95 disabled:opacity-50"
        >
          <Sprout className="w-5 h-5" />
          Farmer Login
        </button>
      </div>

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" 
          alt="Indian Farm" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-[40px] shadow-2xl p-10 border border-white/20 z-10 mx-4"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-[32px] mb-6 shadow-inner">
            <Sprout className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-3 tracking-tight">HarvestHub</h1>
          <p className="text-stone-500 italic text-lg">Connecting local farmers with the community</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleGoogleSignIn('buyer')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-stone-900 text-white py-5 rounded-[24px] font-bold text-lg hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
            Continue with Google
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-100">
          <p className="text-center text-xs text-stone-400 leading-relaxed">
            By continuing, you agree to our <br />
            <span className="font-bold text-stone-600 cursor-pointer hover:underline">Terms of Service</span> and <span className="font-bold text-stone-600 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
