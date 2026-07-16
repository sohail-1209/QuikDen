// HomePage — Google M3 design: typewriter hero, listings-first, smooth animations
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, Home, Users, BedDouble, LandPlot, SlidersHorizontal,
  ArrowRight, Sparkles, Shield, Building2, Star, TrendingUp,
} from 'lucide-react';
import { listingsAPI } from '../services/endpoints';
import ListingCard from '../components/listing/ListingCard';
import Navbar from '../components/layout/Navbar';

const CATEGORIES = [
  { type: '', label: 'All', icon: SlidersHorizontal },
  { type: 'HOUSE_RENTAL', label: 'Houses', icon: Home },
  { type: 'ROOM_SHARING', label: 'Rooms', icon: Users },
  { type: 'HOSTEL', label: 'Hostels', icon: BedDouble },
  { type: 'LAND_SALE', label: 'Land', icon: LandPlot },
];

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Chennai'];

const SKELETON_COUNT = 8;

function SkeletonCard({ index }) {
  return (
    <div
      className="card overflow-hidden"
      style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both` }}
    >
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton w-1/3 rounded-lg" />
        <div className="h-4 skeleton w-3/4 rounded-lg" />
        <div className="h-3 skeleton w-1/2 rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="h-3 skeleton w-16 rounded-lg" />
          <div className="h-3 skeleton w-12 rounded-lg" />
        </div>
        <div className="border-t border-surface-100 pt-3 mt-2 flex items-center gap-2">
          <div className="w-7 h-7 skeleton rounded-full" />
          <div className="h-3 skeleton w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [heroVisible, setHeroVisible] = useState(false);
  const loaderRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['home-listings', activeType, page],
    queryFn: async () => {
      const params = { page, limit: 12 };
      if (activeType) params.type = activeType;
      const res = await listingsAPI.getAll(params);
      return res.data?.data ?? res.data ?? [];
    },
    placeholderData: (prev) => prev,
  });

  const listings = Array.isArray(data) ? data : data?.listings ?? [];

  useEffect(() => {
    setPage(1);
  }, [activeType]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && listings.length >= 12 && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [listings.length, isFetching]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.set('city', searchCity);
    if (activeType) params.set('type', activeType);
    navigate(`/search?${params.toString()}`);
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />

      {/* ═══ HERO — Compact, typewriter, Google-style ═══════════ */}
      <section className="relative bg-white border-b border-surface-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-50/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-50/30 rounded-full blur-3xl" />
        </div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Tagline chip */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-medium mb-3 animate-bounce-subtle">
              <Sparkles size={12} />
              India's Fastest Growing Room Finder
            </div>

            {/* Typewriter headline */}
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-surface-900 flex items-center justify-center gap-1">
              <span>Find your next</span>
              <span className="typewriter text-primary-600"></span>
            </h1>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Search by city, area, or landmark..."
                  className="w-full pl-10 pr-4 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all duration-200"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3.5 rounded-2xl text-sm font-semibold shrink-0 ripple-container">
                <Search size={16} />
                Search
              </button>
            </div>
          </form>

          {/* Category filter tabs */}
          <div className="flex items-center justify-center gap-1.5 mt-4 overflow-x-auto no-scrollbar px-2">
            {CATEGORIES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-out ripple-container ${
                  activeType === type
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-surface-100 text-surface-500 hover:bg-surface-200 hover:text-surface-700 active:bg-surface-300'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Quick city links */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-surface-400">
            <span className="font-medium">Popular:</span>
            {CITIES.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(`/search?city=${encodeURIComponent(c)}`)}
                  className="text-surface-500 hover:text-primary-600 font-medium transition-colors cursor-pointer hover:underline underline-offset-2"
                >
                  {c}
                </button>
                {i < CITIES.length - 1 && <span className="text-surface-300">·</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LISTINGS — Immediately visible, stagger reveal ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-surface-900">
              {activeType ? CATEGORIES.find((c) => c.type === activeType)?.label : 'All Listings'}
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {isLoading ? (
                <span className="inline-block h-3 w-16 skeleton rounded" />
              ) : (
                `${listings.length} listings found`
              )}
            </p>
          </div>
          <Link to="/search" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} index={i} />)
            : listings.map((listing, i) => (
                <div
                  key={listing.id}
                  style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                >
                  <ListingCard listing={listing} />
                </div>
              ))
          }
        </div>

        {/* Empty state */}
        {!isLoading && listings.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <Building2 size={48} className="mx-auto mb-4 text-surface-200" />
            <p className="text-surface-500 font-medium">No listings found</p>
            <p className="text-surface-400 text-sm mt-1">Try a different category or city</p>
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="h-12 flex items-center justify-center">
          {isFetching && !isLoading && (
            <div className="flex items-center gap-3 text-sm text-surface-400 animate-fade-in">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin-slow" />
              Loading more...
            </div>
          )}
        </div>
      </section>

      {/* ═══ TRUST BAR ═══════════════════════════════════════════ */}
      <section className="border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-3 gap-4 stagger-children">
            {[
              { Icon: Shield, value: '100%', label: 'Verified Owners' },
              { Icon: Star, value: '0%', label: 'Brokerage Fee' },
              { Icon: TrendingUp, value: '500+', label: 'Active Listings' },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-surface-900 leading-tight">{value}</p>
                  <p className="text-xs text-surface-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CITIES ══════════════════════════════════════════════ */}
      <section className="border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h3 className="font-display font-bold text-sm text-surface-900 mb-3">Explore by City</h3>
          <div className="flex flex-wrap gap-2 stagger-children">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => navigate(`/search?city=${encodeURIComponent(city)}`)}
                className="px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-100 text-sm font-medium text-surface-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 transition-all duration-200 cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═════════════════════════════════════════════════ */}
      <section className="border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="text-center sm:text-left">
              <h3 className="font-display font-bold text-lg">Own a property?</h3>
              <p className="text-surface-400 text-sm">List it for free. Reach verified tenants.</p>
            </div>
            <Link to="/register" className="btn bg-white text-surface-900 hover:bg-white/90 px-6 py-2.5 rounded-xl text-sm font-semibold shrink-0 ripple-container">
              Post Free Listing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-100 py-6 px-4 text-center text-xs text-surface-400 bg-white">
        <p>&copy; {new Date().getFullYear()} Houziee &middot; Made with care in India</p>
      </footer>
    </div>
  );
}
