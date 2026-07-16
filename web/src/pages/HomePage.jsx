// HomePage — bento grid layout with search-first hero
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, Home, Users, ArrowRight, Star, Shield, Zap,
  CheckCircle, Building2, BedDouble, LandPlot, Sparkles, Quote,
  ArrowUpRight, TrendingUp, ChevronRight,
} from 'lucide-react';
import { listingsAPI } from '../services/endpoints';
import ListingCard from '../components/listing/ListingCard';
import Navbar from '../components/layout/Navbar';
import { sessionCache } from '../utils/sessionCache';

/* ─── Scroll Reveal ─────────────────────────────────────────────── */
const useReveal = (threshold = 0.12) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
};

const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>{children}</div>;
};

/* ─── Data ──────────────────────────────────────────────────────── */
const CATEGORIES = [
  { type: 'HOUSE_RENTAL', label: 'House Rental', icon: Home, color: 'bg-primary-500' },
  { type: 'ROOM_SHARING', label: 'Room Sharing', icon: Users, color: 'bg-accent-500' },
  { type: 'HOSTEL',       label: 'Hostel / PG',  icon: BedDouble, color: 'bg-emerald-500' },
  { type: 'LAND_SALE',    label: 'Land Sale',     icon: LandPlot, color: 'bg-amber-500' },
];

const CITIES = [
  { name: 'Hyderabad', emoji: '🌆', count: '120+' },
  { name: 'Bangalore', emoji: '🌳', count: '180+' },
  { name: 'Mumbai',    emoji: '🌊', count: '95+' },
  { name: 'Pune',      emoji: '🏛️', count: '60+' },
  { name: 'Delhi',     emoji: '🕌', count: '75+' },
  { name: 'Chennai',   emoji: '🌴', count: '50+' },
];

const HOW_IT_WORKS = [
  { step: '01', Icon: Search, title: 'Search', desc: 'Browse verified listings. Filter by city, budget, type.', color: 'from-primary-500 to-primary-600' },
  { step: '02', Icon: Zap, title: 'Request', desc: 'Send a request to the owner. Get contact on acceptance.', color: 'from-accent-500 to-accent-600' },
  { step: '03', Icon: CheckCircle, title: 'Move In', desc: 'Visit, sign, and move into your new home.', color: 'from-emerald-500 to-emerald-600' },
];

const TESTIMONIALS = [
  { quote: "Found my perfect PG in Bangalore in under 48 hours. Owner was verified and communication was super smooth!", name: 'Priya Sharma', role: 'Software Engineer, Bengaluru', rating: 5 },
  { quote: "As a property owner, I listed my flat and got 15 inquiries in the first week. Incredibly easy to use.", name: 'Rahul Mehta', role: 'Property Owner, Hyderabad', rating: 5 },
  { quote: "The AI search feature saved me hours. It understood exactly what I was looking for.", name: 'Ananya Reddy', role: 'Marketing Manager, Mumbai', rating: 5 },
];

/* ─── Bento Card ────────────────────────────────────────────────── */
const BentoCard = ({ listing, size = 'normal' }) => {
  const sizeClasses = {
    tall: 'row-span-2',
    wide: 'col-span-2',
    normal: '',
  };
  return (
    <div className={sizeClasses[size]}>
      <ListingCard listing={listing} />
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const buildQuery = (type) => ({
    queryKey: [`home-${type}`],
    queryFn: async () => {
      const res = await listingsAPI.getAll({ type, limit: 6 });
      const data = res.data?.data ?? res.data ?? [];
      sessionCache.set(`home-${type}`, data, 10 * 60 * 1000);
      return data;
    },
    initialData: () => sessionCache.get(`home-${type}`) ?? undefined,
    select: (d) => d ?? [],
    staleTime: 1000 * 60 * 5,
  });

  const { data: houseData, isLoading: houseLoading } = useQuery(buildQuery('HOUSE_RENTAL'));
  const { data: roomData, isLoading: roomLoading } = useQuery(buildQuery('ROOM_SHARING'));
  const { data: hostelData, isLoading: hostelLoading } = useQuery(buildQuery('HOSTEL'));
  const { data: landData, isLoading: landLoading } = useQuery(buildQuery('LAND_SALE'));

  const allListings = [
    ...(houseData ?? []).slice(0, 2),
    ...(roomData ?? []).slice(0, 2),
    ...(hostelData ?? []).slice(0, 1),
    ...(landData ?? []).slice(0, 1),
  ].filter(Boolean);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.set('city', searchCity);
    if (activeCategory) params.set('type', activeCategory);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Search-first, full viewport
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 pt-8 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50/30" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-200/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-200/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100/60 text-primary-700 text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles size={14} />
            India's Fastest Growing Room Finder
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-surface-900 mb-4">
            Find your next
            <br />
            <span className="gradient-text">home, effortlessly</span>
          </h1>

          <p className="text-surface-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Verified rentals, shared rooms, and hostels across India.
            No brokers. No hidden fees.
          </p>

          {/* Search — the star of the show */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="bg-white rounded-2xl shadow-soft-lg border border-surface-100/50 p-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Which city are you looking in?"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-50 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                />
              </div>
              <button type="submit" className="btn-primary btn-lg px-8 py-3.5 rounded-xl text-sm font-semibold shrink-0">
                <Search size={18} />
                Search
              </button>
            </div>
          </form>

          {/* Category chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {CATEGORIES.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => navigate(`/search?type=${type}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === type
                    ? 'bg-primary-500 text-white shadow-glow-primary'
                    : 'bg-white text-surface-600 border border-surface-200 hover:border-primary-300 hover:text-primary-600 shadow-sm'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Quick city picks */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-sm text-surface-400">
            <span>Popular:</span>
            {CITIES.map((c) => (
              <button key={c.name} onClick={() => navigate(`/search?city=${encodeURIComponent(c.name)}`)} className="text-surface-500 hover:text-primary-600 transition-colors font-medium cursor-pointer">
                {c.name}{c !== CITIES[CITIES.length - 1] && <span className="mx-1 text-surface-300">·</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-surface-300 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BENTO GRID — Featured listings, asymmetric layout
      ═══════════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-4 sm:px-6 max-w-7xl mx-auto -mt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Featured Picks</h2>
              <p className="section-subtitle">Handpicked listings across all categories</p>
            </div>
            <Link to="/search" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
            {houseLoading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse h-72" />)
            ) : (
              allListings.map((listing, i) => (
                <div key={listing.id} className={i === 0 ? 'sm:row-span-2' : ''}>
                  <ListingCard listing={listing} />
                </div>
              ))
            )}
          </div>

          {/* Category quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {CATEGORIES.map(({ type, label, icon: Icon, color }) => {
              const count = type === 'HOUSE_RENTAL' ? houseData?.length : type === 'ROOM_SHARING' ? roomData?.length : type === 'HOSTEL' ? hostelData?.length : landData?.length;
              return (
                <Link
                  key={type}
                  to={`/search?type=${type}`}
                  className="card-shine flex items-center gap-3 p-4 group cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800 truncate">{label}</p>
                    <p className="text-xs text-surface-400">{count ?? '—'} listings</p>
                  </div>
                  <ArrowUpRight size={14} className="text-surface-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* ═══════════════════════════════════════════════════════════════
          CATEGORY SECTIONS — Tabbed view
      ═══════════════════════════════════════════════════════════════ */}
      {[
        { label: 'House Rentals', data: houseData, loading: houseLoading, type: 'HOUSE_RENTAL', icon: Home, color: 'text-primary-500' },
        { label: 'Room Sharing', data: roomData, loading: roomLoading, type: 'ROOM_SHARING', icon: Users, color: 'text-accent-500' },
        { label: 'Hostels & PGs', data: hostelData, loading: hostelLoading, type: 'HOSTEL', icon: BedDouble, color: 'text-emerald-500' },
      ].map(({ label, data, loading, type, icon: Icon, color }) => (
        <Reveal key={type}>
          <section className="px-4 sm:px-6 max-w-7xl mx-auto py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title flex items-center gap-2">
                <Icon size={22} className={color} />
                {label}
              </h2>
              <Link to={`/search?type=${type}`} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-72" />)
              ) : (data ?? []).slice(0, 3).length > 0 ? (
                (data ?? []).slice(0, 3).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-surface-400 text-sm">
                  No listings yet. Check back soon!
                </div>
              )}
            </div>
          </section>
        </Reveal>
      ))}

      {/* ═══════════════════════════════════════════════════════════════
          TRUST BAR — Stats + trust signals
      ═══════════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto gradient-bg rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { value: '500+', label: 'Verified Listings', Icon: Building2 },
                { value: '10+', label: 'Cities Covered', Icon: MapPin },
                { value: '100%', label: 'Free to Use', Icon: Star },
              ].map(({ value, label, Icon }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={24} className="opacity-70" />
                  <span className="font-display font-bold text-4xl">{value}</span>
                  <span className="text-white/70 text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="font-semibold text-lg">Trusted by thousands of renters across India</p>
                <p className="text-white/60 text-sm mt-1">No hidden fees, verified owners, secure platform</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={16} className="text-emerald-300" />
                <span className="text-white/80">100% Verified</span>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="section-title text-3xl mb-3">How It Works</h2>
            <p className="section-subtitle mb-12 text-base">Three steps to your new home</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map(({ step, Icon, title, desc, color }, idx) => (
                <div key={step} className="card p-6 flex flex-col items-center gap-4 group hover:-translate-y-1 transition-all duration-300">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:shadow-glow-primary group-hover:scale-110 transition-all duration-300`}>
                      <Icon size={28} strokeWidth={1.5} className="text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-900 text-white text-xs font-bold flex items-center justify-center">
                      {step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-surface-900 mb-1">{title}</h3>
                    <p className="text-surface-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ═══════════════════════════════════════════════════════════════
          CITIES GRID
      ═══════════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-4 sm:px-6 py-16 bg-surface-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="section-title">Explore by City</h2>
              <p className="section-subtitle">Find rentals in India's top cities</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {CITIES.map(({ name, emoji, count }) => (
                <button
                  key={name}
                  onClick={() => navigate(`/search?city=${encodeURIComponent(name)}`)}
                  className="card-shine p-5 flex flex-col items-center gap-3 text-center group cursor-pointer"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{emoji}</span>
                  <div>
                    <p className="font-semibold text-surface-800 text-sm">{name}</p>
                    <p className="text-xs text-surface-400">{count} listings</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="section-title mb-10">Loved by Renters</h2>

            <div className="relative min-h-[240px]">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    idx === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <div className="card p-8 sm:p-10">
                    <Quote size={28} className="text-primary-200 mx-auto mb-4" />
                    <p className="text-surface-700 text-base sm:text-lg leading-relaxed italic mb-6">"{t.quote}"</p>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm">{t.name[0]}</div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                        <p className="text-xs text-surface-500">{t.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 justify-center mt-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeTestimonial ? 'bg-primary-500 w-6' : 'bg-surface-300 w-2 hover:bg-surface-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ═══════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════ */}
      <Reveal>
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-4xl mx-auto bg-surface-900 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">Are you a Property Owner?</h2>
              <p className="text-surface-400 mb-8 max-w-md mx-auto">List your property for free. Reach thousands of verified tenants across India.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="btn bg-white text-surface-900 hover:bg-white/90 btn-lg font-semibold shadow-xl">
                  Post a Listing — Free
                </Link>
                <Link to="/search" className="btn border border-surface-600 text-surface-300 hover:bg-surface-800 btn-lg font-semibold">
                  Browse Listings
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="border-t border-surface-100 py-8 px-4 text-center text-sm text-surface-400">
        <p>&copy; {new Date().getFullYear()} Houziee &middot; Made with care in India</p>
      </footer>
    </div>
  );
}
