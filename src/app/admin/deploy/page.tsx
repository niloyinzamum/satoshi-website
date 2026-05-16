"use client";
import { useState, useEffect } from 'react';

export default function DeployMenu() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [packages, setPackages] = useState<any[]>([]);
  const [beverages, setBeverages] = useState<any[]>([]);
  
  const [selectedPkgs, setSelectedPkgs] = useState<Set<string>>(new Set());
  const [selectedBevs, setSelectedBevs] = useState<Set<string>>(new Set());
  
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/packages').then(r => r.json()).then(d => setPackages(d.packages || []));
    fetch('/api/admin/beverages').then(r => r.json()).then(d => setBeverages(d.beverages || []));
  }, []);

  useEffect(() => {
    if (!date) return;
    fetch(`/api/admin/deploy?date=${date}`)
      .then(r => r.json())
      .then(d => {
        if (d.deployment) {
          setSelectedPkgs(new Set(d.deployment.packages.map((p: any) => p.package_id)));
          setSelectedBevs(new Set(d.deployment.beverages.map((b: any) => b.beverage_id)));
        } else {
          setSelectedPkgs(new Set());
          setSelectedBevs(new Set());
        }
      });
  }, [date]);

  const toggleSelection = (id: string, type: 'pkg' | 'bev') => {
    const set = type === 'pkg' ? selectedPkgs : selectedBevs;
    const newSet = new Set(set);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    
    if (type === 'pkg') setSelectedPkgs(newSet);
    else setSelectedBevs(newSet);
  };

  const deploy = async () => {
    if (selectedPkgs.size === 0 && selectedBevs.size === 0) {
      alert("Please select at least one item to deploy.");
      return;
    }

    const res = await fetch('/api/admin/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        packageIds: Array.from(selectedPkgs),
        beverageIds: Array.from(selectedBevs)
      })
    });
    
    if (res.ok) {
      setMessage('Deployment saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Deploy Menu</h1>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300 border rounded-lg px-4 py-2 w-full md:w-64 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Packages */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Packages</h2>
            {packages.length === 0 ? <p className="text-gray-500">No packages in catalog.</p> : (
              <div className="space-y-3">
                {packages.map(p => (
                  <label key={p.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300"
                      checked={selectedPkgs.has(p.id)}
                      onChange={() => toggleSelection(p.id, 'pkg')}
                    />
                    <span className="ml-3 font-medium text-gray-900">{p.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Beverages */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Beverages</h2>
            {beverages.length === 0 ? <p className="text-gray-500">No beverages in catalog.</p> : (
              <div className="space-y-3">
                {beverages.map(b => (
                  <label key={b.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300"
                      checked={selectedBevs.has(b.id)}
                      onChange={() => toggleSelection(b.id, 'bev')}
                    />
                    <span className="ml-3 font-medium text-gray-900">{b.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            {message && <span className="text-green-600 font-semibold animate-in fade-in">{message}</span>}
          </div>
          <button 
            onClick={deploy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-all"
          >
            Save Deployment
          </button>
        </div>
      </div>
    </div>
  );
}
