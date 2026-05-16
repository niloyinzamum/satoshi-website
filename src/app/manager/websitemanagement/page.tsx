"use client";

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Upload, X } from 'lucide-react';

interface Setting {
  logo_text: string;
  logo_url: string | null;
  hero_text: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function WebsiteManagement() {
  const [settings, setSettings] = useState<Setting>({ logo_text: 'SATOSHI', logo_url: null, hero_text: 'Silent Beauty.' });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Product Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, image_url: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/landing-products')
      ]);
      const sData = await sRes.json();
      const pData = await pRes.json();
      if (sData) setSettings(sData);
      if (pData) setProducts(pData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    alert('Settings saved!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'product' = 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        if (target === 'logo') {
          setSettings({ ...settings, logo_url: data.url });
        } else {
          setNewProduct({ ...newProduct, image_url: data.url });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (editingId) {
      await fetch(`/api/landing-products/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
    } else {
      await fetch('/api/landing-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
    }
    
    // Reset and Refresh
    setNewProduct({ name: '', price: 0, image_url: '' });
    setIsAdding(false);
    setEditingId(null);
    const res = await fetch('/api/landing-products');
    const data = await res.json();
    setProducts(data);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/landing-products/${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
  };

  if (isLoading) return <div className="p-10 font-bold text-gray-400">Loading...</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Website Management</h1>
        <p className="text-gray-500">Control the appearance and content of your landing page.</p>
      </header>

      {/* Brand Settings */}
      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Brand & Hero</h2>
          <button 
            onClick={handleSaveSettings}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logo Image</label>
            <div className="h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
              {settings.logo_url ? (
                <>
                  <img src={settings.logo_url} alt="Logo Preview" className="h-12 object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label className="cursor-pointer bg-white p-2 rounded-full shadow-lg">
                      <Upload size={14}/>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')}/>
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-1 p-4 text-center">
                  <Upload className="text-gray-300" size={24} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{uploading ? '...' : 'Upload Logo'}</span>
                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                </label>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logo Text (Fallback)</label>
                <input 
                  type="text" 
                  value={settings.logo_text}
                  onChange={e => setSettings({ ...settings, logo_text: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-indigo-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hero Heading</label>
                <input 
                  type="text" 
                  value={settings.hero_text}
                  onChange={e => setSettings({ ...settings, hero_text: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-indigo-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Collection Products</h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        {isAdding && (
          <div className="bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editingId ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="aspect-[3/4] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                  {newProduct.image_url ? (
                    <>
                      <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="cursor-pointer bg-white p-2 rounded-full"><Upload size={16}/><input type="file" className="hidden" onChange={handleImageUpload}/></label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 p-4 text-center">
                      <Upload className="text-gray-300" size={32} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      <input type="file" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Name</label>
                  <input 
                    type="text" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-indigo-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price (BDT)</label>
                  <input 
                    type="number" 
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-indigo-300"
                  />
                </div>
                <button 
                  onClick={handleSaveProduct}
                  disabled={!newProduct.name || !newProduct.price || !newProduct.image_url}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update Product' : 'Add to Collection'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingId(product.id);
                      setNewProduct({ name: product.name, price: product.price, image_url: product.image_url });
                      setIsAdding(true);
                    }}
                    className="p-2 bg-white/90 backdrop-blur rounded-xl text-gray-700 hover:text-indigo-600 shadow-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-xl text-gray-700 hover:text-red-600 shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm font-bold text-gray-400 tracking-widest">BDT {product.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
