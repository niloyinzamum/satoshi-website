"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Package, User, MapPin, Phone, CreditCard, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  status: string;
  items: string;
  total_price: number;
  customer_name: string;
  phone: string | null;
  flat: string | null;
  house: string | null;
  road: string | null;
  area: string | null;
  delivery_fee: number;
  created_at: string;
}

export default function OrderDetails() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = () => {
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.order) setOrder(data.order);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    
    // Optimistic UI update
    setOrder({ ...order, status: newStatus });

    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchOrder();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AWAITING_PAYMENT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading order details...</div>;
  if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-red-500">Order not found.</div>;

  const items = JSON.parse(order.items);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/manager')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-200 group-hover:bg-gray-50 transition-all">
              <ChevronLeft size={20} />
            </div>
            Back to Dashboard
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Order Details</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {order.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Items Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Package size={20} />
                  </div>
                  <h2 className="font-black text-gray-900 uppercase tracking-tight">Ordered Items</h2>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{items.length} Items</span>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:border-indigo-100">
                      <div className="flex gap-4">
                        <span className="font-black text-indigo-600 w-6">{item.quantity}x</span>
                        <span className="font-bold text-gray-800">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-900">৳{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-end">
                  <div className="text-right flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tighter">৳{order.total_price.toFixed(2)}</p>
                    {order.area === 'Others' && <p className="text-xs font-bold text-red-500 mt-2 uppercase tracking-widest">Requires Manual Delivery Charge</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                    <MapPin size={20} />
                  </div>
                  <h2 className="font-black text-gray-900 uppercase tracking-tight">Delivery Address</h2>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Customer</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {order.customer_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.phone}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Location</label>
                  <p className="font-bold text-gray-900">Flat {order.flat}, House {order.house}</p>
                  <p className="text-sm text-gray-600 mt-1">Road {order.road}, {order.area}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Actions */}
          <div className="space-y-8">
            
            {/* Status Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Order Status</label>
                <div className={`text-center py-4 rounded-2xl border mb-6 ${getStatusColor(order.status)}`}>
                  <p className="font-black uppercase tracking-widest text-xs">{order.status.replace('_', ' ')}</p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Change Status</label>
                  {['AWAITING_PAYMENT', 'PAID', 'COMPLETED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${order.status === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ordered At</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{format(new Date(order.created_at), 'PPP p')}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <CreditCard size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Delivery Fee</span>
                </div>
                <p className="text-sm font-bold text-gray-900">৳{order.delivery_fee.toFixed(2)}</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
