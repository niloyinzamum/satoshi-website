"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Check, Plus, Minus, Info, X, CalendarX2, ChevronDown } from 'lucide-react';
import { addDays, startOfToday, isFriday, format } from 'date-fns';

interface PackageItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  key_nutrients: string | null;
}

interface Package {
  id: string;
  title: string;
  base_price: number;
  optional_price: number | null;
  image_url: string | null;
  items: PackageItem[];
}

interface Beverage {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

interface Deployment {
  id: string;
  date: string;
  packages: { package: Package }[];
  beverages: { beverage: Beverage }[];
}

interface CartItem {
  id: string;
  type: 'pkg_base' | 'pkg_opt' | 'bev';
  name: string;
  price: number;
  quantity: number;
}

type CartState = Record<string, Record<string, CartItem>>;

const DELIVERY_FEES: Record<string, number> = {
  "Gulshan 1": 150,
  "Gulshan 2": 120,
  "Banani": 60,
  "Bashundhara R/A": 60,
  "Mohakhali": 120,
  "Old DOHS": 100,
  "Mirpur DOHS": 120,
  "Others": 0
};

export default function CustomerOrder() {
  const params = useParams();
  const id = params.id as string;
  
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [cart, setCart] = useState<CartState>({});
  
  // Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [flat, setFlat] = useState('');
  const [house, setHouse] = useState('');
  const [road, setRoad] = useState('');
  const [area, setArea] = useState<string>('Gulshan 1');

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeDate, setActiveDate] = useState<string>('');
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);
  const [isFooterMinimized, setIsFooterMinimized] = useState(false);

  useEffect(() => {
    fetch('/api/deployments/active')
      .then(r => r.json())
      .then(d => {
        const deps = d.deployments || [];
        setDeployments(deps);
        setLoading(false);
      });
  }, []);

  const calendarDays = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 30 }).map((_, i) => addDays(today, i + 1));
  }, []);

  useEffect(() => {
    if (calendarDays.length > 0 && !activeDate) {
      const firstValid = calendarDays.find(d => !isFriday(d));
      if (firstValid) setActiveDate(firstValid.toISOString());
    }
  }, [calendarDays, activeDate]);

  const updateCart = (dateStr: string, itemKey: string, payload: Omit<CartItem, 'quantity'>, delta: number) => {
    setCart(prev => {
      const dayCart = prev[dateStr] || {};
      
      // Prevent adding a beverage if there are no packages for this day
      if (payload.type === 'bev' && delta > 0) {
        let currentPkgCount = 0;
        Object.values(dayCart).forEach(item => {
          if (item.type !== 'bev') currentPkgCount += item.quantity;
        });
        if (currentPkgCount === 0) return prev;
      }

      const currentQty = dayCart[itemKey]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      const newDayCart = { ...dayCart };
      if (newQty === 0) {
        delete newDayCart[itemKey];
      } else {
        newDayCart[itemKey] = { ...payload, quantity: newQty };
      }

      // If package count drops to 0, auto-remove all beverages for this day
      let newPkgCount = 0;
      Object.values(newDayCart).forEach(item => {
        if (item.type !== 'bev') newPkgCount += item.quantity;
      });

      if (newPkgCount === 0) {
        Object.keys(newDayCart).forEach(key => {
          if (newDayCart[key].type === 'bev') {
            delete newDayCart[key];
          }
        });
      }

      return { ...prev, [dateStr]: newDayCart };
    });
  };

  const { subtotal, packageTotal, beverageTotal, uniqueDays, globalDiscPct, totalBulkSavings, totalLongTermSavings, pkgCount, bevCount, combinedTotalDiscountPct, deliveryFee } = useMemo(() => {
    let sub = 0;
    let pkgTot = 0;
    let bevTot = 0;
    let pkgC = 0;
    let bevC = 0;
    let activeDays = 0;
    let totalDeliveryFee = 0;

    const baseDeliveryFee = DELIVERY_FEES[area] || 0;

    Object.entries(cart).forEach(([dateStr, dayCart]) => {
      const items = Object.values(dayCart);
      if (items.some(item => item.quantity > 0)) {
        activeDays++;
      }
    });

    let gDiscPct = 0;
    if (activeDays >= 22) gDiscPct = 0.30;
    else if (activeDays >= 15) gDiscPct = 0.20;
    else if (activeDays >= 7) gDiscPct = 0.10;
    else if (activeDays >= 3) gDiscPct = 0.05;

    let bulkSav = 0;
    let longSav = 0;

    Object.entries(cart).forEach(([dateStr, dayCart]) => {
      let dayPkgCost = 0;
      let dayPkgCount = 0;
      
      Object.values(dayCart).forEach(item => {
        const cost = item.price * item.quantity;
        sub += cost;
        if (item.type === 'bev') {
          bevTot += cost;
          bevC += item.quantity;
        } else {
          dayPkgCost += cost;
          dayPkgCount += item.quantity;
          pkgTot += cost;
          pkgC += item.quantity;
        }
      });

      // Calculate Delivery Fee for this day
      if (dayPkgCount > 0) {
        const deliveryMultiplier = Math.ceil(dayPkgCount / 3);
        totalDeliveryFee += (baseDeliveryFee * deliveryMultiplier);
      }

      let dayBulkPct = 0;
      if (dayPkgCount >= 6) dayBulkPct = 0.10;
      else if (dayPkgCount >= 3) dayBulkPct = 0.05;

      // Ensure capping at 40% maximum per day for the packages
      let totalPct = gDiscPct + dayBulkPct;
      if (totalPct > 0.40) {
        let overflow = totalPct - 0.40;
        dayBulkPct = Math.max(0, dayBulkPct - overflow);
      }

      bulkSav += (dayPkgCost * dayBulkPct);
      longSav += (dayPkgCost * gDiscPct);
    });
    
    const combinedPct = pkgTot > 0 ? ((bulkSav + longSav) / pkgTot) * 100 : 0;

    return {
      subtotal: sub,
      packageTotal: pkgTot,
      beverageTotal: bevTot,
      uniqueDays: activeDays,
      globalDiscPct: gDiscPct,
      totalBulkSavings: bulkSav,
      totalLongTermSavings: longSav,
      pkgCount: pkgC,
      bevCount: bevC,
      combinedTotalDiscountPct: Math.round(combinedPct),
      deliveryFee: totalDeliveryFee
    };
  }, [cart, area]);

  const finalItemsTotal = subtotal - (totalBulkSavings + totalLongTermSavings);
  const finalTotal = finalItemsTotal + deliveryFee;

  const getUpsellHint = () => {
    if (uniqueDays >= 21 && uniqueDays < 22) return "Add 1 more day to unlock 30% long-term off!";
    if (uniqueDays >= 14 && uniqueDays < 15) return "Add 1 more day to unlock 20% long-term off!";
    if (uniqueDays >= 6 && uniqueDays < 7) return "Add 1 more day to unlock 10% long-term off!";
    if (uniqueDays >= 2 && uniqueDays < 3) return "Add 1 more day to unlock 5% long-term off!";
    return null;
  };
  const upsellHint = getUpsellHint();

  const getDailyBulkHint = (dateStr: string) => {
    const dayCart = cart[dateStr] || {};
    let count = 0;
    Object.values(dayCart).forEach(item => {
      if (item.type !== 'bev') count += item.quantity;
    });

    if (count >= 6) return { text: "10% Daily Bulk Active", active: true };
    if (count === 5) return { text: "Add 1 more for 10% bulk off!", active: false, pulse: true };
    if (count >= 3) return { text: "5% Daily Bulk Active", active: true };
    if (count === 2) return { text: "Add 1 more for 5% bulk off!", active: false, pulse: true };
    return null;
  };

  const isFormValid = customerName && /^01[3-9]\d{8}$/.test(phone) && flat && house && road && area && finalItemsTotal > 0;

  const submitOrder = async () => {
    if (!isFormValid) return;

    const flattenedItems: { id: string, name: string, price: number, quantity: number }[] = [];
    Object.entries(cart).forEach(([dateStr, dayItems]) => {
      const shortDate = format(new Date(dateStr), 'MMM d');
      Object.values(dayItems).forEach(item => {
        flattenedItems.push({
          id: item.id,
          name: `[${shortDate}] ${item.name}`,
          price: item.price,
          quantity: item.quantity
        });
      });
    });

    const totalDiscountAmount = totalBulkSavings + totalLongTermSavings;
    if (totalDiscountAmount > 0) {
      flattenedItems.push({
        id: 'discount',
        name: `Satoshi Discount (${combinedTotalDiscountPct}% Stacked)`,
        price: -totalDiscountAmount,
        quantity: 1
      });
    }

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        items: flattenedItems,
        total_price: finalTotal, // even if "Others", we submit the subtotal. The manager handles manually.
        customer_name: customerName,
        phone,
        flat,
        house,
        road,
        area,
        delivery_fee: deliveryFee
      }),
    });
    setSubmitted(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading menu...</div>;

  if (submitted) {
    const flattenedItems: { id: string, name: string, price: number, quantity: number }[] = [];
    Object.entries(cart).forEach(([dateStr, dayItems]) => {
      const shortDate = format(new Date(dateStr), 'MMM d');
      Object.values(dayItems).forEach(item => {
        flattenedItems.push({
          id: item.id,
          name: `[${shortDate}] ${item.name}`,
          price: item.price,
          quantity: item.quantity
        });
      });
    });

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 animate-in fade-in duration-700">
        <div id="receipt" className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100 relative overflow-hidden print:shadow-none print:border-none print:p-0">
          
          {/* Decorative Top Bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600 print:hidden"></div>
          
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">SATOSHI</h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Official Order Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
              <p className="font-mono text-sm font-bold text-gray-900">{id.split('-')[0].toUpperCase()}</p>
              <p className="text-[10px] text-gray-400 mt-1">{format(new Date(), 'PPP')}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 py-6 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Delivery To</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">{customerName}</p>
                <p className="text-xs text-gray-600 mt-0.5">{phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Flat {flat}, House {house}</p>
                <p className="text-xs text-gray-600">Road {road}, {area}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Items</h3>
            <div className="space-y-3">
              {flattenedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">৳{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-2 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900">৳{subtotal.toFixed(2)}</span>
            </div>
            {(totalBulkSavings + totalLongTermSavings) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Total Savings</span>
                <span className="font-bold">-৳{(totalBulkSavings + totalLongTermSavings).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="font-bold text-gray-900">৳{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black pt-4 border-t border-gray-100 mt-4">
              <span className="text-gray-900">GRAND TOTAL</span>
              <span className="text-indigo-600">৳{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* bKash Instructions */}
          <div className="bg-[#fdf2f7] p-6 rounded-2xl border border-[#e2136e]/20 mb-8 print:bg-white print:border-gray-200">
            <h4 className="text-[#e2136e] font-bold mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#e2136e] text-white rounded-full flex items-center justify-center text-[10px]">!</span>
              Payment Instructions
            </h4>
            <p className="text-sm text-gray-900 leading-relaxed font-medium">
              Please make payment via send money bKash to <span className="font-black underline text-[#e2136e]">01719612680</span> (৳{finalTotal.toFixed(2)}). 
              Please write down your name in the reference. 
              An agent will call you soon to confirm your payment and order.
            </p>
          </div>

          <div className="flex gap-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Print Receipt
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>

          <div className="mt-8 text-center print:mt-12">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Thank you for choosing Satoshi Breakfast</p>
          </div>
        </div>
      </div>
    );
  }

  let activeDeployment = null;
  if (activeDate) {
    const activeDateObj = new Date(activeDate);
    activeDeployment = deployments.find(d => {
      const dDate = new Date(d.date);
      return dDate.getFullYear() === activeDateObj.getFullYear() && 
             dDate.getMonth() === activeDateObj.getMonth() && 
             dDate.getDate() === activeDateObj.getDate();
    });
  }

  const activeDailyBulk = activeDate && !isFriday(new Date(activeDate)) ? getDailyBulkHint(activeDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-[500px]">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Satoshi Breakfast</h1>
          {globalDiscPct > 0 && (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
              {globalDiscPct * 100}% Long-Term Active
            </span>
          )}
        </div>
        
        {/* Date Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex overflow-x-auto gap-3 pb-3 scrollbar-hide">
          {calendarDays.map((d, index) => {
            const dateISO = d.toISOString();
            const isSelected = activeDate === dateISO;
            const friday = isFriday(d);
            const dayCart = cart[dateISO];
            const hasItems = dayCart && Object.values(dayCart).some(item => item.quantity > 0);

            if (friday) {
              return (
                <div key={index} className="flex flex-col items-center justify-center min-w-[76px] p-2 rounded-xl border border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{format(d, 'EEE')}</span>
                  <span className="text-xl font-bold text-gray-400 mb-1">{format(d, 'd')}</span>
                  <span className="text-[9px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase">Closed</span>
                </div>
              );
            }

            return (
              <button 
                key={index}
                onClick={() => setActiveDate(dateISO)}
                className={`relative flex flex-col items-center justify-center min-w-[76px] p-2 rounded-xl border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">{format(d, 'EEE')}</span>
                <span className="text-xl font-bold">{format(d, 'd')}</span>
                {hasItems && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {!activeDate ? null : isFriday(new Date(activeDate)) ? (
           <div className="flex flex-col items-center justify-center text-gray-400 mt-16">
             <CalendarX2 size={48} className="mb-4 opacity-50" />
             <h2 className="text-xl font-medium text-gray-500">No Service on Fridays</h2>
             <p className="text-sm">Please select another day.</p>
           </div>
        ) : !activeDeployment ? (
          <div className="text-center text-gray-500 mt-10">No menu deployed for this date yet.</div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Packages */}
            {activeDeployment.packages.length > 0 && (
              <section>
                <div className="flex flex-col mb-4 min-h-[52px]">
                  <h2 className="text-xl font-bold text-gray-900">Breakfast Packages</h2>
                  {activeDailyBulk ? (
                    <span className={`mt-1 self-start text-xs font-semibold px-2 py-1 rounded ${activeDailyBulk.active ? 'bg-green-100 text-green-800' : 'bg-indigo-50 text-indigo-700'} ${activeDailyBulk.pulse ? 'animate-pulse' : ''}`}>
                      {activeDailyBulk.text}
                    </span>
                  ) : (
                    <div className="mt-1 h-6"></div>
                  )}
                </div>
                <div className="space-y-4">
                  {activeDeployment.packages.map(({ package: pkg }, idx) => {
                    const dayCart = cart[activeDate] || {};
                    const baseQty = dayCart[`${pkg.id}_base`]?.quantity || 0;
                    const optQty = dayCart[`${pkg.id}_opt`]?.quantity || 0;

                    const isExpanded = expandedPkgId === pkg.id;

                    return (
                      <div key={pkg.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 relative transition-all duration-300">
                        {/* Serial Number Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        {pkg.image_url && <img src={pkg.image_url} alt={pkg.title} className="w-full h-40 object-cover" />}
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{pkg.title}</h3>
                            <button 
                              onClick={() => setExpandedPkgId(isExpanded ? null : pkg.id)} 
                              className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-700 ${isExpanded ? 'text-gray-400' : 'text-indigo-600 animate-pulse'}`}
                            >
                              {isExpanded ? 'Hide items' : 'See items'}
                            </button>
                          </div>

                          {/* Menu-style Items List */}
                          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                            <div className="relative mt-2 mb-8 mx-1">
                              {/* The "Green Shadow" Box from the image */}
                              <div className="absolute -bottom-2 -right-2 w-full h-full bg-[#8fb065] rounded-sm z-0"></div>
                              
                              {/* The Menu Card */}
                              <div className="relative bg-white border border-gray-200 px-6 py-8 shadow-sm z-10 flex flex-col items-center">
                                {/* Decorative Lines */}
                                <div className="w-full border-t-2 border-black mb-0.5"></div>
                                <div className="w-full border-t border-black mb-3"></div>
                                
                                <h4 className="text-xl font-bold text-gray-900 uppercase tracking-[0.3em] mb-3">Menu</h4>
                                
                                <div className="w-full border-t border-black mb-0.5"></div>
                                <div className="w-full border-t-2 border-black mb-8"></div>

                                {/* Menu Items */}
                                <div className="w-full space-y-5">
                                  {pkg.items.map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                      <div className="dot-leader">
                                        <span className="text-base font-bold text-gray-900 leading-none">{item.name}</span>
                                        <span className="text-base font-bold text-gray-900 ml-auto leading-none">{item.portion}</span>
                                      </div>
                                      {/* Nutritional values as subtle subtext */}
                                      <div className="flex gap-3 text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-wider">
                                        <span>{item.calories} Cal</span>
                                        <span>•</span>
                                        <span>P: {item.protein}g</span>
                                        <span>•</span>
                                        <span>C: {item.carbs}g</span>
                                        <span>•</span>
                                        <span>F: {item.fat}g</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Base Price Selection */}
                          <div className="flex justify-between items-center mt-4">
                            <div>
                              <span className="font-semibold text-gray-900">৳{pkg.base_price.toFixed(2)}</span>
                              <span className="text-sm text-gray-500 block">Standard</span>
                            </div>
                            <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-1 shadow-sm">
                              <button onClick={() => updateCart(activeDate, `${pkg.id}_base`, { id: pkg.id, type: 'pkg_base', name: pkg.title, price: pkg.base_price }, -1)} className="p-1.5 rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 active:scale-95"><Minus className="w-4 h-4" /></button>
                              <span className="font-bold w-6 text-center text-gray-800">{baseQty}</span>
                              <button onClick={() => updateCart(activeDate, `${pkg.id}_base`, { id: pkg.id, type: 'pkg_base', name: pkg.title, price: pkg.base_price }, 1)} className="p-1.5 rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 active:scale-95"><Plus className="w-4 h-4" /></button>
                            </div>
                          </div>

                          {/* Optional Price Selection */}
                          {pkg.optional_price && (
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                              <div>
                                <span className="font-semibold text-gray-900">৳{pkg.optional_price.toFixed(2)}</span>
                                <span className="text-sm text-gray-500 block">With extra egg</span>
                              </div>
                              <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-1 shadow-sm">
                                <button onClick={() => updateCart(activeDate, `${pkg.id}_opt`, { id: pkg.id, type: 'pkg_opt', name: `${pkg.title} (w/ egg)`, price: pkg.optional_price! }, -1)} className="p-1.5 rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 active:scale-95"><Minus className="w-4 h-4" /></button>
                                <span className="font-bold w-6 text-center text-gray-800">{optQty}</span>
                                <button onClick={() => updateCart(activeDate, `${pkg.id}_opt`, { id: pkg.id, type: 'pkg_opt', name: `${pkg.title} (w/ egg)`, price: pkg.optional_price! }, 1)} className="p-1.5 rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 active:scale-95"><Plus className="w-4 h-4" /></button>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Beverages */}
            {activeDeployment.beverages.length > 0 && (
              <section className="pt-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Beverages <span className="text-sm font-normal text-gray-500 ml-2">(Not eligible for discount)</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeDeployment.beverages.map(({ beverage: bev }, idx) => {
                    const dayCart = cart[activeDate] || {};
                    const qty = dayCart[`${bev.id}_bev`]?.quantity || 0;

                    let dayPkgCount = 0;
                    Object.values(dayCart).forEach(item => {
                      if (item.type !== 'bev') dayPkgCount += item.quantity;
                    });
                    const canAddBeverage = dayPkgCount > 0;

                    return (
                      <div key={bev.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
                        {/* Serial Number Badge */}
                        <div className="absolute top-0 left-0 bg-gray-100 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg border-r border-b border-gray-200">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="pl-4">
                          <h3 className="font-semibold text-gray-900">{bev.name}</h3>
                          <span className="font-medium text-gray-600">৳{bev.price.toFixed(2)}</span>
                          {!canAddBeverage && <p className="text-[10px] text-red-500 mt-1 leading-tight">Requires at least<br/>1 food package</p>}
                        </div>
                        <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-1 shadow-sm">
                          <button onClick={() => updateCart(activeDate, `${bev.id}_bev`, { id: bev.id, type: 'bev', name: bev.name, price: bev.price }, -1)} className="p-1.5 rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 active:scale-95 disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold w-4 text-center text-gray-800">{qty}</span>
                          <button disabled={!canAddBeverage} onClick={() => updateCart(activeDate, `${bev.id}_bev`, { id: bev.id, type: 'bev', name: bev.name, price: bev.price }, 1)} className={`p-1.5 rounded-md shadow-sm active:scale-95 transition-colors ${canAddBeverage ? 'bg-white text-gray-600 hover:text-indigo-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      {finalItemsTotal > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out z-30 ${isFooterMinimized ? 'h-[72px]' : 'max-h-[85vh] overflow-y-auto'}`}>
          <div className="max-w-3xl mx-auto">
            
            {/* Clickable Header for Toggle */}
            <button 
              onClick={() => setIsFooterMinimized(!isFooterMinimized)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors border-b border-transparent"
            >
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full border transition-all duration-500 flex items-center justify-center ${isFooterMinimized ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 animate-pulse' : 'bg-red-50 border-red-100 text-red-500'}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                    {isFooterMinimized ? 'Checkout' : 'Hide'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{uniqueDays} Days • {pkgCount + bevCount} Items</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</p>
                <p className="text-lg font-black text-gray-900">৳{area === 'Others' ? finalItemsTotal.toFixed(2) : finalTotal.toFixed(2)}</p>
              </div>
            </button>

            {/* Collapsible Content */}
            <div className={`px-4 pb-6 space-y-6 transition-all duration-500 ease-in-out overflow-hidden ${isFooterMinimized ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100 mt-2'}`}>
              
              {/* Summary Information */}
              <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  {upsellHint && <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded animate-pulse">{upsellHint}</p>}
                  {combinedTotalDiscountPct > 0 && (
                    <div className="block text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                      Saving {combinedTotalDiscountPct}% on packages!
                    </div>
                  )}
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-xs text-gray-500">Subtotal: ৳{subtotal.toFixed(2)}</div>
                  {totalBulkSavings > 0 && <div className="text-xs font-medium text-indigo-600">Bulk: -৳{totalBulkSavings.toFixed(2)}</div>}
                  {totalLongTermSavings > 0 && <div className="text-xs font-medium text-green-600">Long-term: -৳{totalLongTermSavings.toFixed(2)}</div>}
                  <div className="text-xs font-semibold text-gray-700">Delivery: {area === 'Others' ? 'TBD' : `৳${deliveryFee.toFixed(2)}`}</div>
                </div>
              </div>

              {/* Delivery Form */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Delivery Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all" />
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="Phone (e.g. 017xxxxxxxx)" 
                      className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:ring-4 transition-all ${
                        /^01[3-9]\d{8}$/.test(phone) 
                          ? 'border-green-500 focus:ring-green-500/10' 
                          : phone.length >= 11 
                            ? 'border-red-500 focus:ring-red-500/10' 
                            : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-100'
                      }`} 
                    />
                    {phone.length >= 11 && !/^01[3-9]\d{8}$/.test(phone) && (
                      <p className="text-[10px] text-red-500 mt-1 absolute -bottom-4 left-1 font-bold">Invalid phone number format</p>
                    )}
                    {/^01[3-9]\d{8}$/.test(phone) && (
                      <p className="text-[10px] text-green-600 mt-1 absolute -bottom-4 left-1 font-bold">Valid number</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" value={flat} onChange={(e) => setFlat(e.target.value)} placeholder="Flat" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all" />
                  <input type="text" value={house} onChange={(e) => setHouse(e.target.value)} placeholder="House" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all" />
                  <input type="text" value={road} onChange={(e) => setRoad(e.target.value)} placeholder="Road" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="relative">
                  <select 
                    value={area} 
                    onChange={(e) => setArea(e.target.value)} 
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer pr-10 shadow-sm hover:border-gray-400"
                  >
                    {Object.keys(DELIVERY_FEES).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {area === 'Others' && (
                <div className="bg-yellow-50 text-yellow-800 text-xs font-semibold p-4 rounded-xl border border-yellow-200 flex gap-3 items-start">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Please talk to the manager for getting your final delivery charge.</p>
                </div>
              )}
              
              <button 
                onClick={submitOrder}
                disabled={!isFormValid}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold py-5 px-6 rounded-2xl shadow-xl flex justify-between items-center transition-all active:scale-[0.98] group"
              >
                <span className="text-lg">Confirm and Pay</span>
                <span className="bg-white/10 group-hover:bg-white/20 px-4 py-1 rounded-lg text-lg transition-colors">
                  ৳{area === 'Others' ? finalItemsTotal.toFixed(2) : finalTotal.toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
