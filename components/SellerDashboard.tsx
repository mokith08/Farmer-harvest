import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Product, UserProfile, Order } from '../types';
import ProductCard from './ProductCard';
import AIChat from './AIChat';
import SellerProfileForm from './SellerProfileForm';
import { Plus, X, LayoutDashboard, Package, TrendingUp, Sparkles, Loader2, Truck, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPriceAdvice } from '../services/groq';
import { generateMarketImage, generateProductImage } from '../services/imageGen';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface SellerDashboardProps {
  profile: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ profile }) => {
  console.log("SellerDashboard profile:", profile);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [priceAdvice, setPriceAdvice] = useState<string | null>(null);

  const [guestComplete, setGuestComplete] = useState(false);

  // Use profile directly to determine if form should show
  const showProfileForm = !profile.sellerProfile && !guestComplete;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: 'Vegetables',
    stock: '',
    imageUrl: '',
    upiId: ''
  });

  useEffect(() => {
    if (!profile.uid) return;
    
    const isGuest = profile.uid.startsWith('guest');

    if (isGuest) {
      setProducts([
        { id: 'demo-p1', name: 'Fresh Organic Tomatoes', description: 'Sun-ripened tomatoes.', price: 40, unit: 'kg', category: 'Vegetables', stock: 50, sellerId: profile.uid, imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400', createdAt: new Date().toISOString() }
      ]);
      setOrders([
        { id: 'demo-o1', buyerId: 'guest-buyer', buyerEmail: 'guest@demo.com', sellerId: profile.uid, productId: 'demo-p1', productName: 'Organic Tomatoes', quantity: 5, totalPrice: 200, status: 'paid', deliveryAddress: '123 Farm Street', createdAt: new Date().toISOString() }
      ]);
    } else {
      const qProds = query(collection(db, 'products'), where('sellerId', '==', profile.uid));
      const unsubProds = onSnapshot(qProds, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      });

      const qOrders = query(collection(db, 'orders'), where('sellerId', '==', profile.uid));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      });

      return () => {
        unsubProds();
        unsubOrders();
      };
    }
  }, [profile.uid]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  if (showProfileForm) {
    return <SellerProfileForm profile={profile} onComplete={() => setGuestComplete(true)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);

    if (isNaN(price) || isNaN(stock)) {
      alert("Please enter valid numbers for price and stock.");
      return;
    }

    console.log(editingProduct ? "Updating product:" : "Adding product:", formData);
    try {
      let finalImageUrl = formData.imageUrl;
      
      // Auto-generate image if not provided or if it's a placeholder
      if (!finalImageUrl || finalImageUrl.includes('picsum.photos')) {
        const generated = await generateProductImage(formData.name);
        if (generated) finalImageUrl = generated;
      }

      const productData = {
        ...formData,
        imageUrl: finalImageUrl,
        price,
        stock,
        sellerId: profile.uid,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        console.log("Product updated successfully");
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        console.log("Product added successfully");
      }

      setIsAdding(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', unit: 'kg', category: 'Vegetables', stock: '', imageUrl: '', upiId: '' });
      setPriceAdvice(null);
    } catch (error) {
      console.error("Error saving product:", error);
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      console.log("Product deleted successfully");
      setProductToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productToDelete.id}`);
    }
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      unit: product.unit,
      category: product.category,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      upiId: product.upiId || ''
    });
    setIsAdding(true);
  };

  const handleGetAdvice = async () => {
    if (!formData.name) return;
    setLoadingAdvice(true);
    try {
      const advice = await getPriceAdvice(formData.name, formData.description);
      setPriceAdvice(advice);
    } catch (error) {
      console.error("Error getting price advice:", error);
      // Don't throw to ErrorBoundary, just log and maybe show a toast if we had one
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 bg-white p-2 rounded-[24px] border border-stone-100 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          Inventory
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          Orders & Delivery
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Listings</p>
                <p className="text-2xl font-bold text-stone-900">{products.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Total Sales</p>
                <p className="text-2xl font-bold text-stone-900">
                  ₹{orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.totalPrice, 0).toFixed(2)}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-emerald-600 p-6 rounded-[32px] text-white flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="text-lg font-bold">Add New Product</span>
            </button>
          </div>

          {/* Product List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                Your Inventory
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-[32px] border-2 border-dashed border-stone-200 p-20 text-center">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 font-medium">You haven't listed any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isSeller 
                    onDelete={() => confirmDelete(product)} 
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Orders & Delivery Tab */
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Active Orders
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-[32px] border-2 border-dashed border-stone-200 p-20 text-center">
              <Clock className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 font-medium">No orders yet. Keep growing!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {[...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-stone-400" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{order.productName}</p>
                      <p className="text-sm text-stone-500">Qty: {order.quantity} • Total: ₹{order.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-stone-400 mt-1">Order ID: {order.id}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Delivery Address</p>
                    <p className="text-sm text-stone-600 max-w-xs">{order.deliveryAddress || 'No address provided'}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${
                      order.status === 'paid' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'shipped' ? 'bg-amber-100 text-amber-600' :
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {order.status}
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                          title="Mark as Paid"
                        >
                          <CreditCard className="w-5 h-5" />
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          className="p-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
                          title="Mark as Shipped"
                        >
                          <Truck className="w-5 h-5" />
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                          title="Mark as Delivered"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdding(false);
                setEditingProduct(null);
                setFormData({ name: '', description: '', price: '', unit: 'kg', category: 'Vegetables', stock: '', imageUrl: '', upiId: '' });
              }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-stone-900">
                    {editingProduct ? 'Edit Listing' : 'List New Produce'}
                  </h2>
                  <button 
                    onClick={() => {
                      setIsAdding(false);
                      setEditingProduct(null);
                      setFormData({ name: '', description: '', price: '', unit: 'kg', category: 'Vegetables', stock: '', imageUrl: '', upiId: '' });
                    }} 
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Product Name</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="e.g. Organic Tomatoes"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option>Vegetables</option>
                        <option>Fruits</option>
                        <option>Dairy</option>
                        <option>Grains</option>
                        <option>Honey</option>
                        <option>Others</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Seller UPI ID (for GPay)</label>
                      <input
                        required
                        type="text"
                        value={formData.upiId}
                        onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                        className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="e.g. farmer@okaxis"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                      placeholder="Tell buyers about your fresh produce..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Price (₹)</label>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <button 
                          type="button"
                          onClick={handleGetAdvice}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                          title="Get AI Price Advice"
                        >
                          {loadingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Unit</label>
                      <input
                        required
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="kg, bunch, piece"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Stock</label>
                      <input
                        required
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {priceAdvice && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800"
                    >
                      <div className="flex items-center gap-2 mb-1 font-bold">
                        <Sparkles className="w-4 h-4" />
                        AI Price Advisor
                      </div>
                      {priceAdvice}
                    </motion.div>
                  )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Image URL (Optional)</label>
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="https://images.unsplash.com/..."
                        />
                        <button 
                          type="button"
                          disabled={loadingAdvice || !formData.name}
                          onClick={async () => {
                            setLoadingAdvice(true);
                            const img = await generateMarketImage(`A fresh, high-quality photo of ${formData.name} for a farmer's market listing`);
                            if (img) setFormData({...formData, imageUrl: img});
                            setLoadingAdvice(false);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          title="Generate AI Image"
                        >
                          {loadingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
                  >
                    {editingProduct ? 'Update Listing' : 'Publish Listing'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Remove Listing?</h3>
              <p className="text-stone-500 mb-8">
                Are you sure you want to remove <span className="font-bold text-stone-900">"{productToDelete.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIChat context={`Seller dashboard. Your products: ${products.map(p => p.name).join(', ')}. Active orders: ${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}.`} />
    </div>
  );
};

export default SellerDashboard;
