'use client';

import { useState, useEffect } from 'react';

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

export default function LandingPage() {
  const [settings, setSettings] = useState<Setting>({ logo_text: 'SATOSHI', logo_url: null, hero_text: 'Silent Beauty.' });
  const [products, setProducts] = useState<Product[]>([]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathStatus, setBreathStatus] = useState('Find a comfortable position.');
  const [cycleCount, setCycleCount] = useState(0);
  const [time, setTime] = useState('');

  const totalCycles = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/landing-products')
        ]);
        const sData = await sRes.json();
        const pData = await pRes.json();
        console.log('Fetched settings:', sData);
        if (sData) setSettings(sData);
        if (pData && pData.length > 0) {
          setProducts(pData);
        } else {
          // Fallback to defaults
          setProducts([
            { id: '1', name: 'Ceramic Incense Holder', price: 1500, image_url: '/incense_holder.png' },
            { id: '2', name: 'Woven Linen Tote', price: 3200, image_url: '/linen_tote.png' },
            { id: '3', name: 'Oak Studio Lamp', price: 12500, image_url: '/studio_lamp_oak.png' }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeStr = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
      setTime(timeStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const startBreathing = () => {
    setIsBreathing(true);
    setCycleCount(0);
    setBreathStatus("Inhale slowly");
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    setCycleCount(0);
    setBreathStatus("Find a comfortable position.");
  };

  useEffect(() => {
    if (!isBreathing) return;

    if (cycleCount >= totalCycles) {
      setBreathStatus("Focus restored. Carry this peace with you.");
      setIsBreathing(false);
      return;
    }

    const inhaleDuration = 5000;
    const exhaleDuration = 5000;

    const inhaleTimer = setTimeout(() => {
      setBreathStatus("Exhale and release");
      const exhaleTimer = setTimeout(() => {
        setCycleCount(prev => prev + 1);
        if (cycleCount + 1 < totalCycles) {
          setBreathStatus("Inhale slowly");
        }
      }, exhaleDuration);
      return () => clearTimeout(exhaleTimer);
    }, inhaleDuration);

    return () => clearTimeout(inhaleTimer);
  }, [isBreathing, cycleCount]);

  const isOrbActive = isBreathing && breathStatus === "Inhale slowly";

  return (
    <main>
      <nav className="nav-satoshi">
        <a href="#" className="nav-logo-satoshi">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.logo_text} className="h-24 w-auto" />
          ) : (
            settings.logo_text
          )}
        </a>
      </nav>

      <header className="hero-satoshi">
        <h1>{settings.hero_text}</h1>
        <p>Live with Intention</p>
      </header>

      <section className="zen-space-satoshi" id="zen">
        <h2>A Moment of Stillness</h2>
        <p className="breath-status">{breathStatus}</p>

        <div className="breath-orb-container-satoshi">
          <div className={`breath-orb-satoshi ${isOrbActive ? 'active' : ''}`}></div>
        </div>

        {!isBreathing ? (
          <button className="btn-zen-satoshi" onClick={startBreathing}>
            {cycleCount > 0 ? "PRACTICE AGAIN" : "START ONE MINUTE"}
          </button>
        ) : (
          <button className="btn-zen-satoshi border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={stopBreathing}>
            STOP SESSION
          </button>
        )}
      </section>

      <section className="product-section-satoshi">
        <div className="section-intro-satoshi">
          <h2>The Collection</h2>
        </div>

        <div className="grid-satoshi">
          {products.map(product => (
            <div key={product.id} className="product-card-satoshi">
              <div className="product-image-box-satoshi">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="product-image-satoshi"
                />
              </div>
              <h3>{product.name}</h3>
              <p className="price">BDT {product.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer-satoshi">
        <div className="footer-left-satoshi">
          © 2026 SATOSHI LIFESTYLE
        </div>

        <div className="footer-right-satoshi">
          DHAKA, BD | <span>28°C CLEAR</span> | HUMIDITY: 76% | <span>{time}</span>
        </div>
      </footer>
    </main>
  );
}
