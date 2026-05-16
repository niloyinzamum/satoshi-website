"use client";
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload } from 'lucide-react';

export default function CatalogManager() {
  const [packages, setPackages] = useState<any[]>([]);
  const [beverages, setBeverages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'packages' | 'beverages'>('packages');

  const [editingBev, setEditingBev] = useState<any>(null);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPackage: boolean) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        if (isPackage) {
          setEditingPkg({ ...editingPkg, image_url: data.url });
        } else {
          setEditingBev({ ...editingBev, image_url: data.url });
        }
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetch('/api/admin/packages').then(r => r.json()).then(d => setPackages(d.packages || []));
    fetch('/api/admin/beverages').then(r => r.json()).then(d => setBeverages(d.beverages || []));
  }, []);

  const saveBeverage = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingBev.id;
    const url = isNew ? '/api/admin/beverages' : `/api/admin/beverages/${editingBev.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingBev)
    });
    setEditingBev(null);
    const d = await fetch('/api/admin/beverages').then(r => r.json());
    setBeverages(d.beverages || []);
  };

  const deleteBeverage = async (id: string) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`/api/admin/beverages/${id}`, { method: 'DELETE' });
    setBeverages(beverages.filter(b => b.id !== id));
  };

  const savePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingPkg.id;
    const url = isNew ? '/api/admin/packages' : `/api/admin/packages/${editingPkg.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingPkg)
    });
    setEditingPkg(null);
    const d = await fetch('/api/admin/packages').then(r => r.json());
    setPackages(d.packages || []);
  };

  const deletePackage = async (id: string) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
    setPackages(packages.filter(p => p.id !== id));
  };

  const addPackageItem = () => {
    setEditingPkg({
      ...editingPkg,
      items: [...(editingPkg.items || []), { name: '', portion: '', calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0, key_nutrients: '' }]
    });
  };

  const updatePackageItem = (index: number, field: string, value: any) => {
    const newItems = [...editingPkg.items];
    newItems[index][field] = value;
    setEditingPkg({ ...editingPkg, items: newItems });
  };

  const removePackageItem = (index: number) => {
    const newItems = [...editingPkg.items];
    newItems.splice(index, 1);
    setEditingPkg({ ...editingPkg, items: newItems });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Catalog Manager</h1>
        
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${activeTab === 'packages' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('packages')}
          >
            Breakfast Packages
          </button>
          <button 
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${activeTab === 'beverages' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('beverages')}
          >
            Beverages
          </button>
        </div>

        {/* PACKAGES */}
        {activeTab === 'packages' && !editingPkg && (
          <div>
            <button 
              onClick={() => setEditingPkg({ title: '', base_price: 0, items: [] })}
              className="mb-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} /> Add Package
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{p.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPkg(p)} className="text-gray-500 hover:text-indigo-600"><Edit2 size={18} /></button>
                      <button onClick={() => deletePackage(p.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">Base: ৳{p.base_price}</p>
                  {p.optional_price && <p className="text-sm text-gray-500">With Egg: ৳{p.optional_price}</p>}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Included Items ({p.items?.length || 0})</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PACKAGE EDITOR */}
        {activeTab === 'packages' && editingPkg && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingPkg.id ? 'Edit Package' : 'New Package'}</h2>
              <button onClick={() => setEditingPkg(null)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <form onSubmit={savePackage} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required value={editingPkg.title} onChange={e => setEditingPkg({...editingPkg, title: e.target.value})} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Photo</label>
                  <div className="flex gap-2 items-center">
                    {editingPkg.image_url ? (
                      <img src={editingPkg.image_url} alt="preview" className="h-10 w-10 object-cover rounded border" />
                    ) : null}
                    <div className="relative overflow-hidden inline-block border rounded p-2 bg-gray-50 flex-grow hover:bg-gray-100 cursor-pointer">
                      <div className="flex items-center gap-2 justify-center text-sm font-medium text-gray-600">
                        <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload Photo'}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleImageUpload(e, true)} 
                        className="absolute left-0 top-0 right-0 bottom-0 opacity-0 cursor-pointer w-full h-full" 
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (BDT)</label>
                  <input required type="number" step="0.01" value={editingPkg.base_price} onChange={e => setEditingPkg({...editingPkg, base_price: e.target.value})} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Optional Price (with egg) (BDT)</label>
                  <input type="number" step="0.01" value={editingPkg.optional_price || ''} onChange={e => setEditingPkg({...editingPkg, optional_price: e.target.value})} className="w-full border rounded p-2" />
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Nutritional Items</h3>
                  <button type="button" onClick={addPackageItem} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">
                    <Plus size={16} /> Add Item
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2 w-24">Portion</th>
                        <th className="px-4 py-2 w-20">Cal</th>
                        <th className="px-4 py-2 w-20">Pro (g)</th>
                        <th className="px-4 py-2 w-20">Carbs (g)</th>
                        <th className="px-4 py-2 w-20">Fib (g)</th>
                        <th className="px-4 py-2 w-20">Fat (g)</th>
                        <th className="px-4 py-2">Nutrients</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editingPkg.items || []).map((item: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2"><input required value={item.name} onChange={e => updatePackageItem(idx, 'name', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input required value={item.portion} onChange={e => updatePackageItem(idx, 'portion', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input required type="number" value={item.calories} onChange={e => updatePackageItem(idx, 'calories', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input required type="number" step="0.1" value={item.protein} onChange={e => updatePackageItem(idx, 'protein', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input required type="number" step="0.1" value={item.carbs} onChange={e => updatePackageItem(idx, 'carbs', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input required type="number" step="0.1" value={item.fiber} onChange={e => updatePackageItem(idx, 'fiber', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input required type="number" step="0.1" value={item.fat} onChange={e => updatePackageItem(idx, 'fat', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><input value={item.key_nutrients || ''} onChange={e => updatePackageItem(idx, 'key_nutrients', e.target.value)} className="w-full border rounded p-1" /></td>
                          <td className="p-2"><button type="button" onClick={() => removePackageItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setEditingPkg(null)} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Package</button>
              </div>
            </form>
          </div>
        )}

        {/* BEVERAGES */}
        {activeTab === 'beverages' && !editingBev && (
          <div>
            <button 
              onClick={() => setEditingBev({ name: '', price: 0 })}
              className="mb-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} /> Add Beverage
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {beverages.map(b => (
                <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{b.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingBev(b)} className="text-gray-500 hover:text-indigo-600"><Edit2 size={16} /></button>
                      <button onClick={() => deleteBeverage(b.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">৳{b.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BEVERAGE EDITOR */}
        {activeTab === 'beverages' && editingBev && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingBev.id ? 'Edit Beverage' : 'New Beverage'}</h2>
              <button onClick={() => setEditingBev(null)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <form onSubmit={saveBeverage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required value={editingBev.name} onChange={e => setEditingBev({...editingBev, name: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (BDT)</label>
                <input required type="number" step="0.01" value={editingBev.price} onChange={e => setEditingBev({...editingBev, price: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Photo</label>
                <div className="flex gap-2 items-center">
                  {editingBev.image_url ? (
                    <img src={editingBev.image_url} alt="preview" className="h-10 w-10 object-cover rounded border" />
                  ) : null}
                  <div className="relative overflow-hidden inline-block border rounded p-2 bg-gray-50 flex-grow hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center gap-2 justify-center text-sm font-medium text-gray-600">
                      <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleImageUpload(e, false)} 
                      className="absolute left-0 top-0 right-0 bottom-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editingBev.description || ''} onChange={e => setEditingBev({...editingBev, description: e.target.value})} className="w-full border rounded p-2" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingBev(null)} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Beverage</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
