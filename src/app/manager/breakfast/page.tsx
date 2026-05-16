"use client";

import { useState, useEffect, useMemo } from 'react';
import { LogOut, Calendar, ChevronRight, Search, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns';

interface Order {
  id: string;
  status: string;
  items: string;
  total_price: number;
  customer_name: string;
  phone: string | null;
  area: string | null;
  created_at: string;
}

export default function ManagerDashboard() {
  const [generatedLink, setGeneratedLink] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/manager/login');
    router.refresh();
  };

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const generateLink = () => {
    const id = crypto.randomUUID();
    const url = `${window.location.origin}/order/${id}`;
    setGeneratedLink(url);
    navigator.clipboard.writeText(url);
  };

  const updateStatus = async (e: React.MouseEvent | React.ChangeEvent, id: string, newStatus: string) => {
    e.stopPropagation();
    // Optimistic UI update
    setOrders(currentOrders => 
      currentOrders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      )
    );

    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AWAITING_PAYMENT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (startDate && orderDate < startOfDay(new Date(startDate))) return false;
      if (endDate && orderDate > endOfDay(new Date(endDate))) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 py-10 relative">
      

      {/* Link Generation Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-4xl w-full text-center mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Food Orders</h1>
        <p className="text-gray-500 mb-8">Generate a unique order link for your next customer.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={generateLink}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-bold py-4 px-8 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
          >
            Generate Link
          </button>
          <button 
            onClick={() => {
              const id = crypto.randomUUID();
              router.push(`/order/${id}`);
            }}
            className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            Create Order (Manual)
          </button>
        </div>

        {generatedLink && (
          <div className="mt-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 max-w-md mx-auto">
            <p className="font-bold text-sm mb-2">Link Copied to Clipboard!</p>
            <input 
              type="text" 
              readOnly 
              value={generatedLink}
              className="w-full text-xs bg-white border border-green-300 rounded-xl p-3 text-gray-700 outline-none text-center"
            />
          </div>
        )}
      </div>

      {/* Orders Table Section */}
      <div className="max-w-6xl w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
          <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
              />
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Area</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium">
                      No orders found for this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => router.push(`/manager/order/${order.id}`)}
                      className="group hover:bg-indigo-50/30 cursor-pointer transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{order.customer_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{format(new Date(order.created_at), 'MMM d, h:mm a')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">{order.area}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-black text-gray-900">৳{order.total_price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            value={order.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateStatus(e, order.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                          >
                            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                            <option value="PAID">Paid</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          <div className="p-2 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
