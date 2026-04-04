import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';
import Auth from './components/Auth';
import RoleSelection from './components/RoleSelection';
import BuyerDashboard from './components/BuyerDashboard';
import SellerDashboard from './components/SellerDashboard';
import Navbar from './components/Navbar';
import { Loader2, AlertCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from './utils/firestoreError';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Test Firestore Connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection successful");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
          setError("Database connection failed. Please check your internet or Firebase setup.");
        }
      }
    };
    testConnection();

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setLoading(true); // Ensure loading is true while fetching profile
        const docRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const existingProfile = docSnap.data() as UserProfile;
            console.log("Profile loaded:", existingProfile.role);
            
            // If we have a pending role from Auth and it's different, update it
            if (pendingRole && existingProfile.role !== pendingRole) {
              console.log("Updating role to match login intent:", pendingRole);
              handleAuthSuccess(pendingRole, firebaseUser);
            } else {
              setProfile(existingProfile);
              setLoading(false);
            }
          } else {
            console.log("No profile found for user");
            // If we have a pending role from Auth, create the profile automatically
            if (pendingRole) {
              handleAuthSuccess(pendingRole, firebaseUser);
            } else {
              setProfile(null);
              setLoading(false);
            }
          }
        }, (err) => {
          console.error("Profile listener error:", err);
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [pendingRole]);

  const handleAuthSuccess = async (role: UserRole, firebaseUser?: User) => {
    const currentUser = firebaseUser || auth.currentUser;
    if (currentUser) {
      try {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'User',
          role,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', currentUser.uid), newProfile);
        setPendingRole(null);
        // Profile will be updated by the onSnapshot listener
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user && !profile) {
    return <Auth onRoleSelect={(role) => {
      // Create a Guest Session immediately
      const guestProfile: UserProfile = {
        uid: 'guest-' + Math.random().toString(36).substr(2, 9),
        email: 'guest@harvesthub.demo',
        displayName: 'Guest ' + role.charAt(0).toUpperCase() + role.slice(1),
        role,
        createdAt: new Date().toISOString(),
      };
      setProfile(guestProfile);
      setPendingRole(null);
    }} />;
  }

  if (!profile) {
    return <RoleSelection onSelect={(role) => handleAuthSuccess(role)} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      <Navbar profile={profile} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {profile.role === 'buyer' ? (
          <BuyerDashboard profile={profile} />
        ) : (
          <SellerDashboard profile={profile} />
        )}
      </main>
    </div>
  );
};

export default App;
