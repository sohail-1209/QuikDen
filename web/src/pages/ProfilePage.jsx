import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Send, MessageSquare, Plus, ArrowRight, CheckCircle, Trash2, Building2, Eye, Clock, Star, ListChecks, Heart, SendHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, savedAPI, chatAPI, listingsAPI, reviewsAPI } from '../services/endpoints';
import RequestCard from '../components/RequestCard';
import ReviewCard from '../components/ReviewCard';
import Avatar from '../components/ui/Avatar';
import { formatRent, getPrimaryPhoto, formatNumber } from '../utils/helpers';

// ── Category-style card (matches homepage) ──────────────────────────────────────
const CategoryCard = ({ to, icon: Icon, label, value, gradient, iconColor, isLoading, delay = 0 }) => (
  <Link
    to={to}
    className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl glass-card group"
    style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
  >
    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
      <Icon size={16} className={`${iconColor} animate-bounce-subtle`} />
    </div>
    <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start w-full">
      {isLoading ? (
        <div className="skeleton h-5 w-8 rounded-lg mb-1" />
      ) : (
        <p className="text-base sm:text-lg font-bold text-surface-900 font-display leading-tight">{value}</p>
      )}
      <p className="text-[10px] sm:text-xs text-surface-400 font-medium leading-tight mt-0.5 whitespace-normal break-words w-full">{label}</p>
    </div>
  </Link>
);

// ── Skeleton for request cards ─────────────────────────────────────────────────
const RequestSkeleton = () => (
  <div className="card p-4 flex gap-4">
    <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-3 w-1/3 rounded-lg" />
    </div>
  </div>
);

// ── Skeleton listing row ───────────────────────────────────────────────────────
const ListingRowSkeleton = () => (
  <div className="card p-3 flex items-center gap-3">
    <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-5 w-20 rounded-full" />
    </div>
  </div>
);

// ── Mini listing row ───────────────────────────────────────────────────────────
const ListingRow = ({ listing }) => {
  const photo = getPrimaryPhoto(listing);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getDetailPath = (listing) => {
    if (listing.type === 'HOSTEL') return `/hostel/${listing.id}`;
    if (listing.type === 'ROOM_SHARING') return `/room/${listing.id}`;
    if (listing.type === 'LAND_SALE') return `/land/${listing.id}`;
    return `/listing/${listing.id}`;
  };

  const detailPath = getDetailPath(listing);

  return (
    <div
      className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(detailPath)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(detailPath)}
    >
      <img
        src={photo || 'https://placehold.co/56x56?text=📷'}
        alt={listing.title}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-800 text-sm line-clamp-1">{listing.title}</p>
        <p className="text-xs text-surface-400 mt-0.5">
          {listing.type === 'HOSTEL' && listing.hostelSharing?.tiers?.length > 0
            ? `From ${formatRent(Math.min(...listing.hostelSharing.tiers.map((t) => t.price)))}`
            : formatRent(listing.rent)
          }
          {listing.type !== 'LAND_SALE' ? (listing.rentPeriod === 'per year' ? '/yr' : listing.rentPeriod === 'custom' ? '' : (t('mo') || '/mo')) : ''} · {listing.city}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`badge text-xs ${listing.status === 'ACTIVE' ? 'badge-success' : listing.status === 'RENTED' ? 'badge-primary' : 'badge-gray'
              }`}
          >
            {listing.status === 'ACTIVE' ? t('active') : listing.status === 'RENTED' ? (listing.type === 'HOSTEL' ? t('fullyBooked') : t('booked')) : t('inactive')}
          </span>
          <span className="text-xs text-surface-400 flex items-center gap-0.5">
            <Eye size={11} /> {formatNumber(listing.views ?? 0)} {t('views')}
          </span>
        </div>
      </div>
      <ArrowRight size={16} className="text-surface-300 flex-shrink-0" />
    </div>
  );
};

// ── Booking Item (Local State for instant UI update) ───────────────────────────
const BookingItem = ({ booking, navigate, completeBookingMutation, t }) => {
  const [deleted, setDeleted] = useState(false);

  const handleDelete = () => {
    setDeleted(true);
    completeBookingMutation.mutate(booking.id, {
      onError: () => setDeleted(false),
    });
  };

  if (deleted) return null;

  return (
    <div className="card p-4">
      <div className="flex gap-4">
        <img
          src={booking.listing?.photos?.[0]?.url || 'https://placehold.co/80x80?text=No+Photo'}
          alt={booking.listing?.title}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-800 text-sm truncate">{booking.listing?.title}</p>
          <p className="text-xs text-surface-400 truncate">{booking.listing?.city}</p>
        </div>
      </div>
      {/* Activate prompt */}
      <div className="mt-3 p-3 bg-primary-50/50 rounded-xl border border-primary-100">
        <div className="flex items-start gap-2">
          <CheckCircle size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-primary-700">{t('bookingConfirmed') || 'Booking confirmed'}</p>
            <p className="text-[11px] text-primary-500 mt-0.5">{t('activateBookingPrompt') || 'Create a room sharing listing to activate this booking'}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate('/dashboard/listings/new', { state: { fromBooking: booking } })}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={14} /> {t('activateNow') || 'Activate Now'}
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-danger-500 border border-danger-200 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors"
          >
            <Trash2 size={14} /> {t('delete') || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Mobile Quick Nav Options ───────────────────────────────────────────────────
const MobileOptions = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const TENANT_ITEMS = [
    { to: '/dashboard/my-listings', icon: ListChecks, label: 'My Listing' },
    { to: '/dashboard/saved', icon: Heart, label: 'Saved Listings' },
    { to: '/dashboard/requests', icon: SendHorizontal, label: 'My Requests' },
  ];

  const OWNER_ITEMS = [
    { to: '/dashboard/listings', icon: ListChecks, label: 'My Listings' },
    { to: '/dashboard/saved', icon: Heart, label: 'Saved Listings' },
    { to: '/dashboard/requests', icon: SendHorizontal, label: 'requests' },
  ];

  const items = user?.role === 'OWNER' ? OWNER_ITEMS : TENANT_ITEMS;

  return (
    <div className="flex gap-2 lg:hidden w-full">
      {items.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white border border-surface-100 shadow-sm active:bg-surface-50 transition-colors"
        >
          <Icon size={18} className="text-primary-600" />
          <span className="text-[10px] font-medium text-surface-600 text-center leading-tight">{t(label) || label}</span>
        </Link>
      ))}
    </div>
  );
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isOwner = user?.role === 'OWNER';

  // Common Queries
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: savedData, isLoading: savedLoading } = useQuery({
    queryKey: ['saved'],
    queryFn: () => savedAPI.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatAPI.getChats().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  // Owner specific
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.getMyListings().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
    enabled: isOwner,
  });

  // Tenant specific
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => listingsAPI.getMyBookings().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
    enabled: !isOwner,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', user?.id],
    queryFn: () => reviewsAPI.getUserReviews(user?.id).then((r) => r.data.data),
    enabled: !!user?.id,
  });

  const completeBookingMutation = useMutation({
    mutationFn: (id) => listingsAPI.completeBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBookings'] });
      qc.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('bookingCompleted') || 'Booking activated!');
    },
    onError: () => toast.error(t('failedToUpdate') || 'Failed to update'),
  });

  // Computed data
  const requests = requestsData ?? [];
  const savedCount = savedData?.length ?? 0;
  const chatsCount = chatsData?.length ?? 0;

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const activeRequestsCount = pendingRequests.length;

  // Owner computed
  const listings = listingsData ?? [];
  const totalListings = listings.length;
  const totalViews = listings.reduce((acc, l) => acc + (l.views ?? 0), 0);
  const acceptedRequestsCount = requests.filter((r) => r.status === 'ACCEPTED').length;
  const recentPendingRequests = pendingRequests.slice(0, 5);
  const recentListings = listings.slice(0, 3);

  // Tenant computed
  const recentRequests = requests.slice(0, 3);
  const bookings = bookingsData ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-8">

      {/* ── Profile Section ──────────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={user?.profileImage} name={user?.name} size="xl" className="ring-2 ring-primary-100" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 font-display">
                {user?.name}
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={14} className="text-accent-400 fill-accent-400" />
                <span className="text-sm font-medium">
                  {user?.avgRating ? `${user.avgRating.toFixed(1)} (${reviews?.length || 0} ${t('reviews') || 'Reviews'})` : (t('noRatingYet') || 'No rating yet')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews ─────────────────────────────────────────────────────────── */}
        {reviews?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-surface-100">
            <h3 className="font-semibold text-surface-900 mb-3">{t('reviewsCount', { count: reviews.length }) || `Reviews (${reviews.length})`}</h3>
            <div className="space-y-3">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Quick Navigation ─────────────────────────────────────────── */}
      <MobileOptions />

      {/* ── Stats / Analytics Cards ─────────────────────────────────────────── */}
      <div className={`grid gap-2 ${isOwner ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
        {isOwner ? (
          <>
            <CategoryCard
              to="/dashboard/listings"
              icon={Building2}
              label={t('totalListings') || 'Total Listings'}
              value={totalListings}
              gradient="from-primary-50 to-primary-100"
              iconColor="text-primary-600"
              isLoading={listingsLoading}
              delay={0}
            />
            <CategoryCard
              to="/dashboard/listings"
              icon={Eye}
              label={t('totalViews') || 'Total Views'}
              value={formatNumber(totalViews)}
              gradient="from-violet-50 to-violet-100"
              iconColor="text-violet-600"
              isLoading={listingsLoading}
              delay={80}
            />
            <CategoryCard
              to="/dashboard/requests"
              icon={Clock}
              label={t('pendingRequests') || 'Pending Requests'}
              value={pendingRequests.length}
              gradient="from-amber-50 to-amber-100"
              iconColor="text-amber-600"
              isLoading={requestsLoading}
              delay={160}
            />
            <CategoryCard
              to="/dashboard/requests"
              icon={CheckCircle}
              label={t('acceptedRequests') || 'Accepted Requests'}
              value={acceptedRequestsCount}
              gradient="from-emerald-50 to-emerald-100"
              iconColor="text-emerald-600"
              isLoading={requestsLoading}
              delay={240}
            />
          </>
        ) : (
          <>
            <CategoryCard
              to="/dashboard/saved"
              icon={Bookmark}
              label={t('savedListings') || 'Saved Listings'}
              value={savedCount}
              gradient="from-primary-50 to-primary-100"
              iconColor="text-primary-600"
              isLoading={savedLoading}
              delay={0}
            />
            <CategoryCard
              to="/dashboard/requests"
              icon={Send}
              label={t('activeRequests') || 'Active Requests'}
              value={activeRequestsCount}
              gradient="from-amber-50 to-amber-100"
              iconColor="text-amber-600"
              isLoading={requestsLoading}
              delay={80}
            />
            <CategoryCard
              to="/dashboard/chats"
              icon={MessageSquare}
              label={t('chats') || 'Chats'}
              value={chatsCount}
              gradient="from-emerald-50 to-emerald-100"
              iconColor="text-emerald-600"
              isLoading={chatsLoading}
              delay={160}
            />
          </>
        )}
      </div>

      {/* ── Dashboard Content ─────────────────────────────────────────────── */}
      {isOwner ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Owner: Recent Pending Requests */}
          <section className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">{t('pendingRequests') || 'Pending Requests'}</h2>
                <p className="section-subtitle">{t('awaitingResponse') || 'Awaiting Response'}</p>
              </div>
              {pendingRequests.length > 5 && (
                <Link to="/dashboard/requests" className="btn-outline btn-sm flex items-center gap-1.5">
                  {t('viewAll') || 'View All'} <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {requestsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <RequestSkeleton key={i} />)}
              </div>
            ) : recentPendingRequests.length === 0 ? (
              <div className="card p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">🎉</div>
                <div>
                  <p className="font-semibold text-surface-700">{t('allCaughtUp') || 'All Caught Up'}</p>
                  <p className="text-sm text-surface-400 mt-1">{t('noPending') || 'No Pending Requests'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPendingRequests.map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            )}
          </section>

          {/* Owner: My Listings preview */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">{t('myListings') || 'My Listings'}</h2>
                <p className="section-subtitle">{t('quickOverview') || 'Quick Overview'}</p>
              </div>
              <Link to="/dashboard/listings" className="btn-outline btn-sm flex items-center gap-1.5">
                {t('viewAll') || 'View All'} <ArrowRight size={14} />
              </Link>
            </div>

            {listingsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <ListingRowSkeleton key={i} />)}
              </div>
            ) : recentListings.length === 0 ? (
              <div className="card p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">🏠</div>
                <div>
                  <p className="font-semibold text-surface-700">{t('noListings') || 'No Listings'}</p>
                  <p className="text-sm text-surface-400 mt-1">{t('createFirst') || 'Create First Listing'}</p>
                </div>
                <button onClick={() => navigate('/dashboard/listings/new')} className="btn-primary btn-sm flex items-center gap-1.5">
                  <Plus size={14} /> {t('addListing') || 'Add Listing'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Tenant: Recent Requests */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">{t('recentRequests') || 'Recent Requests'}</h2>
                <p className="section-subtitle">{t('latestRentalRequests') || 'Latest Rental Requests'}</p>
              </div>
              {requests.length > 3 && (
                <Link to="/dashboard/requests" className="btn-outline btn-sm flex items-center gap-1.5">
                  {t('viewAll') || 'View All'} <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {requestsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <RequestSkeleton key={i} />)}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="card p-10 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-3xl select-none">📋</div>
                <div>
                  <p className="font-semibold text-surface-700">{t('noRequests') || 'No Requests'}</p>
                  <p className="text-sm text-surface-400 mt-1">{t('browseGetStarted') || 'Browse to Get Started'}</p>
                </div>
                <Link to="/search" className="btn-primary btn-sm">{t('browseListings') || 'Browse Listings'}</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            )}
          </section>

          {/* Tenant: My Bookings (Accepted) */}
          {bookings.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="section-title">{t('myBookings') || 'My Bookings'}</h2>
                  <p className="section-subtitle">{t('acceptedBookings') || 'Accepted Bookings'}</p>
                </div>
              </div>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} navigate={navigate} completeBookingMutation={completeBookingMutation} t={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}



    </div>
  );
}
