import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore';
import { Product, UserProfile, Order } from '../types';
import ProductCard from './ProductCard';
import AIChat from './AIChat';
import { Search, Filter, ShoppingBasket, CheckCircle2, Clock, FileText, Download, Truck, CreditCard, X, Package, Sparkles, UtensilsCrossed, Loader2, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import Markdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import { getRecipeIdeas, getProperMarketData, getSeasonalAdvice, getNearbyMarkets } from '../services/groq';
import { generateMarketImage } from '../services/imageGen';

import ImpactStats from './ImpactStats';
import AIKitchen from './AIKitchen';
import MarketCard from './MarketCard';
import FarmerCard from './FarmerCard';

interface BuyerDashboardProps {
  profile: UserProfile;
}

const MOCK_MARKETS = [
  {
    name: "Janta Sabzi Market",
    location: "Sector 15, Chandigarh",
    timing: "6:00 AM - 11:00 AM",
    contact: "+91 98765 43210",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=800",
    description: "The oldest and most trusted market in the city. Famous for fresh organic vegetables and local fruits."
  },
  {
    name: "Kisan Bazaar",
    location: "Phase 7, Mohali",
    timing: "7:00 AM - 1:00 PM",
    contact: "+91 98765 43211",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    description: "A modern farmer's market where you can meet the growers directly. Great for dairy and honey."
  }
];

const MOCK_FARMERS = [
  {
    name: "Rajesh Kumar",
    farm: "Green Earth Farms",
    location: "Zirakpur, Punjab",
    specialty: "Organic Tomatoes, Bell Peppers",
    bio: "I've been farming for 20 years using traditional methods. My goal is to provide chemical-free food to my community.",
    image: "https://images.unsplash.com/photo-1595273670150-db0a3d39074f?auto=format&fit=crop&q=80&w=800",
    experience: "20 Years"
  },
  {
    name: "Sunita Devi",
    farm: "Sunita's Dairy & Honey",
    location: "Panchkula, Haryana",
    specialty: "Pure Desi Ghee, Raw Honey",
    bio: "We focus on ethical dairy farming and natural beekeeping. Our products are as pure as nature intended.",
    image: "https://images.unsplash.com/photo-1592919016382-746073d48de0?auto=format&fit=crop&q=80&w=800",
    experience: "12 Years"
  }
];

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ profile }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'market' | 'orders' | 'cooking' | 'progress' | 'markets_farmers'>('market');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSuccess, setShowSuccess] = useState(false);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerUpiId, setBuyerUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [cookingAdvice, setCookingAdvice] = useState<string | null>(null);
  const [loadingCooking, setLoadingCooking] = useState(false);

  // AI Generated Data
  const [markets, setMarkets] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Fetch initial Market data only if not already loaded
    const fetchMarketData = async () => {
      if (markets.length > 0) return;
      setLoadingMarketData(true);
      try {
        const data = await getProperMarketData();
        if (data) {
          // Generate images for each market and farmer
          const marketsWithImages = await Promise.all((data.mandis || []).map(async (m: any) => ({
            ...m,
            image: await generateMarketImage(m.imagePrompt) || `https://picsum.photos/seed/${m.name}/600/400`
          })));
          const farmersWithImages = await Promise.all((data.farmers || []).map(async (f: any) => ({
            ...f,
            image: await generateMarketImage(f.imagePrompt) || `https://picsum.photos/seed/${f.name}/600/400`
          })));
          setMarkets(marketsWithImages);
          setFarmers(farmersWithImages);
        }
      } catch (err) {
        console.error("Failed to fetch market data:", err);
      } finally {
        setLoadingMarketData(false);
      }
    };

    const fetchHeroImage = async () => {
      if (heroImage) return;
      try {
        const img = await generateMarketImage("A vibrant close-up of fresh Indian vegetables and fruits like tomatoes, mangoes, and greens, arranged beautifully in a market setting");
        if (img) setHeroImage(img);
      } catch (err) {
        console.error("Failed to fetch hero image:", err);
      }
    };

    fetchMarketData();
    fetchHeroImage();
    // 1. Determine if we are in Guest Mode
    const isGuest = profile.uid.startsWith('guest');

    // 2. Handle Data Fetching
    if (isGuest) {
      // Mock data for Guest mode
      setProducts([
        { id: 'demo-p1', name: 'Fresh Organic Tomatoes', description: 'Sun-ripened, organic tomatoes from local farms.', price: 40, unit: 'kg', category: 'Vegetables', stock: 50, sellerId: 'demo-s1', imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400', createdAt: new Date().toISOString() },
        { id: 'demo-p2', name: 'Raw Forest Honey', description: 'Pure, unprocessed honey collected from wild hives.', price: 350, unit: '500g', category: 'Honey', stock: 20, sellerId: 'demo-s2', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400', createdAt: new Date().toISOString() },
        { id: 'demo-p3', name: 'Golden Basmati Rice', description: 'Long-grain aged aromatic basmati rice.', price: 120, unit: 'kg', category: 'Grains', stock: 100, sellerId: 'demo-s1', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', createdAt: new Date().toISOString() },
      ]);
      setOrders([
        {
          id: 'demo-order-1',
          buyerId: profile.uid,
          buyerEmail: profile.email,
          sellerId: 'demo-s1',
          productId: 'demo-p1',
          productName: 'Organic Carrots',
          quantity: 2,
          totalPrice: 200,
          status: 'paid',
          deliveryAddress: 'Guest Chennai Office',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setLoadingMarketData(false);
    } else {
      // Real Firestore Listeners (only for logged-in users)
      const qProds = query(collection(db, 'products'));
      const unsubProds = onSnapshot(qProds, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      });

      const qOrders = query(collection(db, 'orders'), where('buyerId', '==', profile.uid));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      });

      return () => {
        unsubProds();
        unsubOrders();
      };
    }
  }, [profile.uid, profile.email]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Show a small toast or feedback here if needed
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const validateUpi = (id: string) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(id)) {
      setUpiError('Invalid UPI ID format (e.g. name@okaxis)');
      return false;
    }
    setUpiError('');
    return true;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    
    // 1. Success Finalizer
    const finalizePurchase = async (paymentId: string) => {
      try {
        const isGuest = profile.uid.startsWith('guest');
        
        if (isGuest) {
          // Local State Update for Guest
          const newOrders = cart.map(item => ({
            id: 'guest-order-' + Math.random().toString(36).substr(2, 5),
            buyerId: profile.uid,
            buyerEmail: profile.email,
            sellerId: item.product.sellerId,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            totalPrice: item.product.price * item.quantity,
            status: 'paid' as const,
            paymentId,
            deliveryAddress,
            createdAt: new Date().toISOString(),
          }));
          setOrders(prev => [...newOrders, ...prev]);
        } else {
          // Real Firestore Update
          const orderPromises = cart.map(async (item) => {
            const orderData: Omit<Order, 'id'> = {
              buyerId: profile.uid,
              buyerEmail: profile.email,
              sellerId: item.product.sellerId,
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              totalPrice: item.product.price * item.quantity,
              status: 'paid',
              paymentId,
              deliveryAddress,
              createdAt: new Date().toISOString(),
            };
            const docRef = await addDoc(collection(db, 'orders'), orderData);
            
            await fetch('/api/send-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: profile.email,
                orderId: docRef.id,
                items: [{ name: item.product.name, quantity: item.quantity, price: item.product.price }],
                total: item.product.price * item.quantity
              })
            });
          });
          await Promise.all(orderPromises);
        }
        
        setShowSuccess(true);
        setCart([]);
        setDeliveryAddress('');
        setIsCheckingOut(false);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        console.error("Failed to finalize order:", err);
      }
    };

    try {
      const isGuest = profile.uid.startsWith('guest');

      // 2. Skip Backend API if Guest
      if (isGuest) {
        await new Promise(r => setTimeout(r, 1000));
        await finalizePurchase(`GUEST_PAY_${Date.now()}`);
        return;
      }
      // 1. Create Real Razorpay Order
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            buyerId: profile.uid,
            buyerEmail: profile.email
          }
        })
      });

      const razorOrder = await orderRes.json();

      if (!razorOrder.id) throw new Error("Failed to create Razorpay order");
      // 3. Razorpay Trigger (Skip if mock)
      if (razorOrder.id.includes('mock')) {
        console.log("Mock Order detected - Skipping Razorpay popup for demo");
        await new Promise(r => setTimeout(r, 1000)); // Simulate delay
        await finalizePurchase(`MOCK_PAY_${Date.now()}`);
      } else {
        const options = {
          key: (process.env as any).RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: razorOrder.amount,
          currency: razorOrder.currency,
          name: "HarvestHub",
          description: "Fresh Farm Produce",
          order_id: razorOrder.id,
          handler: (res: any) => finalizePurchase(res.razorpay_payment_id),
          prefill: { name: profile.displayName, email: profile.email },
          theme: { color: "#059669" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }

    } catch (error) {
      console.error("Checkout error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvoice = (order: Order) => {
    const doc = new jsPDF();
    
    // 1. Header Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(30, 30, 30);
    doc.text('HarvestHub Invoice', 20, 25);
    
    // 2. Details Section
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    let y = 50;
    const leftCol = 20;
    const valCol = 60;
    
    doc.setFont("helvetica", "normal");
    doc.text('Order ID:', leftCol, y);
    doc.setFont("helvetica", "bold");
    doc.text(order.id, valCol, y);
    y += 10;
    
    doc.setFont("helvetica", "normal");
    doc.text('Date:', leftCol, y);
    doc.setFont("helvetica", "bold");
    doc.text(new Date(order.createdAt).toLocaleDateString(), valCol, y);
    y += 10;
    
    doc.setFont("helvetica", "normal");
    doc.text('Buyer:', leftCol, y);
    doc.setFont("helvetica", "bold");
    doc.text(`${profile.displayName} (${profile.email})`, valCol, y);
    y += 10;
    
    doc.setFont("helvetica", "normal");
    doc.text('Delivery Address:', leftCol, y);
    doc.setFont("helvetica", "bold");
    const splitAddress = doc.splitTextToSize(order.deliveryAddress || 'N/A', 130);
    doc.text(splitAddress, valCol, y);
    y += (splitAddress.length * 6) + 15;

    // 3. Table Headers
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y - 6, 190, y - 6);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text('Item', 20, y);
    doc.text('Qty', 100, y, { align: 'center' });
    doc.text('Price', 140, y, { align: 'right' });
    doc.text('Total', 185, y, { align: 'right' });
    
    doc.line(20, y + 4, 190, y + 4);
    
    // 4. Table Content
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(order.productName, 20, y);
    doc.text(order.quantity.toString(), 100, y, { align: 'center' });
    doc.text(`Rs. ${(order.totalPrice / order.quantity).toFixed(2)}`, 140, y, { align: 'right' });
    doc.text(`Rs. ${order.totalPrice.toFixed(2)}`, 185, y, { align: 'right' });
    
    doc.line(20, y + 6, 190, y + 6);
    
    // 5. Total Section
    y += 30;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`Grand Total: Rs. ${order.totalPrice.toFixed(2)}`, 185, y, { align: 'right' });
    
    // 6. Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for purchasing fresh produce from HarvestHub!', 105, 280, { align: 'center' });

    doc.save(`HarvestHub_Invoice_${order.id.slice(0, 8)}.pdf`);
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Honey', 'Others'];

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLoadingMarketData(true);
        try {
          const nearby = await getNearbyMarkets(latitude, longitude);
          if (nearby && nearby.length > 0) {
            setMarkets(nearby);
          }
        } catch (error) {
          console.error("Error getting nearby markets:", error);
        } finally {
          setLoadingMarketData(false);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location. Please check your browser permissions.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleCookUp = async () => {
    setIsCooking(true);
    setLoadingCooking(true);
    try {
      const productNames = products.slice(0, 10).map(p => p.name);
      const advice = await getRecipeIdeas(productNames);
      setCookingAdvice(advice);
    } catch (error) {
      console.error("Error getting recipe ideas:", error);
    } finally {
      setLoadingCooking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex flex-wrap gap-4 bg-white p-2 rounded-[24px] border border-stone-100 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('market')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'market' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          Marketplace
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          My Orders
        </button>
        <button 
          onClick={() => setActiveTab('cooking')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'cooking' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          Cooking Help
        </button>
        <button 
          onClick={() => setActiveTab('progress')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'progress' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          My Progress
        </button>
        <button 
          onClick={() => setActiveTab('markets_farmers')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'markets_farmers' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          Markets & Farmers
        </button>
      </div>

      {activeTab === 'market' ? (
        <>
          {/* Hero Section */}
          <section className="relative h-64 rounded-[40px] overflow-hidden bg-emerald-900 flex items-center px-12">
            <div className="absolute inset-0 opacity-40">
              <img 
                src={heroImage || "https://images.unsplash.com/photo-1488459711635-0c8a2fe99622?auto=format&fit=crop&q=80&w=2000"} 
                alt="Indian Market" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://picsum.photos/seed/market/1920/1080";
                }}
              />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Fresh from the farm, <br />
                <span className="text-emerald-400 italic">straight to your table.</span>
              </h1>
              <p className="text-emerald-100 text-lg mb-6">Support local farmers and enjoy the best seasonal produce.</p>
              <button 
                onClick={() => setActiveTab('cooking')}
                className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-950/20 group"
              >
                <UtensilsCrossed className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Cook Up Ideas with AI
              </button>
            </div>
          </section>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search fresh produce..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                      : 'bg-white text-stone-500 border border-stone-100 hover:border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onBuy={() => addToCart(product)} 
              />
            ))}
          </div>

          {/* Floating Cart Button */}
          {cart.length > 0 && (
            <motion.button
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={() => setShowCart(true)}
              className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-emerald-700 transition-all group"
            >
              <div className="relative">
                <ShoppingBasket className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-emerald-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-600">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <span className="font-bold pr-2">View Cart • ₹{cartTotal.toFixed(2)}</span>
            </motion.button>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-100 rounded-full mb-4">
                <ShoppingBasket className="w-10 h-10 text-stone-300" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">No products found</h3>
              <p className="text-stone-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </>
      ) : activeTab === 'orders' ? (
        /* Orders History Tab */
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Order History
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-[32px] border-2 border-dashed border-stone-200 p-20 text-center">
              <ShoppingBasket className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 font-medium">You haven't made any purchases yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-stone-400" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{order.productName}</p>
                      <p className="text-sm text-stone-500">Qty: {order.quantity} • Total: ₹{order.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-stone-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                      order.status === 'paid' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'shipped' ? 'bg-amber-100 text-amber-600' :
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <Truck className="w-3 h-3 animate-pulse" />}
                      {order.status}
                    </div>

                    {order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered' ? (
                      <button 
                        onClick={() => generateInvoice(order)}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-600 rounded-xl hover:bg-stone-100 transition-colors text-sm font-bold"
                      >
                        <Download className="w-4 h-4" />
                        Invoice
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-300 rounded-xl text-sm font-bold cursor-not-allowed">
                        <Clock className="w-4 h-4" />
                        Pending Payment
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'cooking' ? (
        <AIKitchen availableProducts={products.map(p => p.name)} />
      ) : activeTab === 'progress' ? (
        <ImpactStats />
      ) : (
        /* Markets & Farmers Tab */
        <div className="space-y-12">
          {loadingMarketData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <p className="text-stone-500 font-medium animate-pulse">AI is finding the best local Markets and Farmers for you...</p>
            </div>
          ) : (
            <>
              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                    Nearby Markets
                  </h2>
                  <button 
                    onClick={handleGetLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    {userLocation ? 'Update Location' : 'Find Markets Near Me'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {markets.length > 0 ? markets.map((market, i) => (
                    <MarketCard key={i} market={market} />
                  )) : (
                    MOCK_MARKETS.map((market, i) => (
                      <MarketCard key={i} market={market} />
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-600" />
                    Meet Your Farmers
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {farmers.length > 0 ? farmers.map((farmer, i) => (
                    <FarmerCard key={i} farmer={farmer} />
                  )) : (
                    MOCK_FARMERS.map((farmer, i) => (
                      <FarmerCard key={i} farmer={farmer} />
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* Cart Sidebar/Modal */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <ShoppingBasket className="w-6 h-6 text-emerald-600" />
                  Your Cart
                </h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBasket className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                    <p className="text-stone-500">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-stone-100">
                        <img 
                          src={item.product.imageUrl || 'https://picsum.photos/seed/food/200/200'} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-bold text-stone-900">{item.product.name}</p>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-stone-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-emerald-600 font-bold text-sm">₹{item.product.price.toFixed(2)} / {item.product.unit}</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-white"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-700">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-stone-50 border-t border-stone-100 space-y-4">
                  <div className="flex justify-between items-center text-xl font-bold text-stone-900">
                    <span>Total</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCart(false);
                      setIsCheckingOut(true);
                    }}
                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-3"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckingOut && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckingOut(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-stone-900">Final Checkout</h2>
                  <button onClick={() => setIsCheckingOut(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto mb-6 pr-2 no-scrollbar space-y-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-stone-500">{item.product.name} x {item.quantity}</span>
                      <span className="font-bold">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Delivery Address</label>
                    <textarea
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                      placeholder="Enter your full delivery address for fresh farm delivery..."
                    />
                  </div>

                  <div className="flex items-center justify-between text-lg font-bold text-stone-900 px-2">
                    <span>Grand Total</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>

                  <button
                    disabled={isProcessing || !deliveryAddress.trim()}
                    type="submit"
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-6 h-6" />
                        Pay with Razorpay
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-stone-400">Secure payment via Razorpay</p>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cook Up AI Modal */}
      <AnimatePresence>
        {isCooking && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCooking(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">AI Recipe Assistant</h2>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Cooking up ideas with fresh market produce</p>
                  </div>
                </div>
                <button onClick={() => setIsCooking(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar flex-1">
                {loadingCooking ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    <p className="text-stone-500 font-medium animate-pulse">Gathering ingredients and brainstorming recipes...</p>
                  </div>
                ) : (
                  <div className="prose prose-stone max-w-none">
                    <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                      <Markdown>{cookingAdvice}</Markdown>
                    </div>
                    <div className="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <ShoppingBasket className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900">Ready to start cooking?</p>
                        <p className="text-sm text-emerald-700">All these ingredients are available in the marketplace right now. Support your local farmers by buying fresh!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-center">
                <button 
                  onClick={() => setIsCooking(false)}
                  className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg"
                >
                  Close Assistant
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <AIChat context={`Buyer dashboard. Available products: ${products.map(p => p.name).join(', ')}. Your orders: ${orders.map(o => `${o.productName} (${o.status})`).join(', ')}.`} />
    </div>
  );
};

export default BuyerDashboard;
