import React from 'react';
import { Leaf, Heart, MapPin, Share2, Award, TrendingUp, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Jan', impact: 400 },
  { name: 'Feb', impact: 300 },
  { name: 'Mar', impact: 600 },
  { name: 'Apr', impact: 800 },
  { name: 'May', impact: 500 },
  { name: 'Jun', impact: 900 },
  { name: 'Jul', impact: 1100 },
];

const ImpactStats: React.FC = () => {
  const stats = [
    { label: 'Nature Saved', value: '12.4 kg', sub: 'CO2 Offset', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Given to Farmers', value: '₹4,250', sub: 'Direct Support', icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Market Visits', value: '8', sub: 'Local Markets', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Community', value: '124', sub: 'People Helped', icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const badges = [
    { name: 'Eco Warrior', desc: 'Saved 10kg+ CO2', icon: Award, date: 'Mar 2026', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Farmer Friend', desc: 'Supported 5+ Farmers', icon: Award, date: 'Feb 2026', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Market Regular', desc: '5+ Market Visits', icon: Award, date: 'Jan 2026', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My HarvestHub Impact',
        text: 'I just saved 12.4kg of CO2 by shopping local at HarvestHub! Join me in supporting our farmers.',
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Sharing is not supported on this browser. Copy the URL to share!');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">My Progress</h1>
          <p className="text-stone-500">See how your local shopping helps the planet and community.</p>
        </div>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg"
        >
          <Share2 className="w-5 h-5" />
          Share My Impact
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-stone-900 mb-1">{stat.value}</p>
            <p className="text-xs text-stone-500">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Impact Over Time
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#a8a29e' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#a8a29e' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="impact" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorImpact)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Achievements
          </h2>
          <div className="space-y-6">
            {badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-12 h-12 ${badge.bg} rounded-2xl flex items-center justify-center ${badge.color} shadow-inner`}>
                  <badge.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-stone-900 leading-none">{badge.name}</p>
                  <p className="text-xs text-stone-500 mt-1">{badge.desc}</p>
                  <p className="text-[10px] font-bold text-stone-300 uppercase mt-1">{badge.date}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 bg-stone-50 text-stone-600 rounded-2xl font-bold hover:bg-stone-100 transition-all text-sm">
            View All Badges
          </button>
        </div>
      </div>

      <div className="bg-stone-900 rounded-[40px] p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-500/20">
          <Globe className="w-12 h-12 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Global Impact</h3>
          <p className="text-stone-400 leading-relaxed">
            HarvestHub users in India have collectively saved over <span className="text-emerald-400 font-bold">2,400 tonnes</span> of CO2 this year by choosing local Markets over supermarkets. Every purchase counts!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactStats;
