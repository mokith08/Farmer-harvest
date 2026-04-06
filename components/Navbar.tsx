import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Sprout, LogOut, User as UserIcon, ShoppingBasket, RefreshCw, Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface NavbarProps {
  profile: UserProfile;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const [isSwitching, setIsSwitching] = useState(false);

  const toggleRole = async () => {
    if (!profile.uid || isSwitching) return;
    const isGuest = profile.uid.startsWith('guest');

    setIsSwitching(true);
    const newRole: UserRole = profile.role === 'buyer' ? 'seller' : 'buyer';
    
    if (isGuest) {
      // Mock switch for Guest
      window.location.reload(); // Quick reset for guest
      return;
    }

    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        role: newRole
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSignOut = () => {
    const isGuest = profile.uid?.startsWith('guest');
    if (isGuest) {
      window.location.reload();
      return;
    }
    signOut(auth);
  };

  return (
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">HarvestHub</span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={toggleRole}
            disabled={isSwitching}
            className="hidden md:flex items-center gap-2 text-stone-500 hover:text-emerald-600 transition-colors group px-3 py-1.5 hover:bg-emerald-50 rounded-xl"
            title={`Switch to ${profile.role === 'buyer' ? 'Seller' : 'Buyer'} Portal`}
          >
            {isSwitching ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : profile.role === 'buyer' ? (
              <ShoppingBasket className="w-4 h-4 group-hover:scale-110 transition-transform" />
            ) : (
              <Sprout className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm font-bold capitalize">{profile.role} Portal</span>
            <RefreshCw className={`w-3 h-3 text-stone-300 group-hover:text-emerald-500 transition-all ${isSwitching ? 'animate-spin' : ''}`} />
          </button>

          <div className="h-8 w-[1px] bg-stone-100 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-stone-900 leading-none">{profile.displayName}</p>
              <p className="text-xs text-stone-400 mt-1">{profile.email}</p>
            </div>
            {auth.currentUser?.photoURL ? (
              <img 
                src={auth.currentUser.photoURL} 
                alt={profile.displayName} 
                className="w-10 h-10 rounded-full border border-stone-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <div className="relative">
              <button 
                onClick={handleSignOut}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
