import { useQuery } from '@tanstack/react-query';
import {
  BarChart2, Eye, TrendingUp, DollarSign, List,
  Calendar, CheckCircle, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listingsAPI, requestsAPI } from '../../services/endpoints';
import { formatRent, formatNumber } from '../../utils/helpers';
import PageHeader from '../../components/layout/PageHeader';

const StatCard = ({ label, value, description, icon: Icon, color }) => (
  <div className="card p-3 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
    <div className="space-y-0.5 sm:space-y-1">
      <p className="text-xs sm:text-sm font-medium text-surface-400">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-surface-900 font-display">{value}</p>
      {description && <p className="text-xs text-surface-400">{description}</p>}
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} text-white`}>
      <Icon size={22} />
    </div>
  </div>
);

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsAPI.getMyListings().then((r) => r.data.data),
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsAPI.getAll().then((r) => r.data.data),
  });

  const isLoading = listingsLoading || requestsLoading;

  const totalListings = listings?.length || 0;
  const totalViews = listings?.reduce((acc, l) => acc + (l.views ?? 0), 0) || 0;
  const activeListings = listings?.filter((l) => l.status === 'ACTIVE').length || 0;
  
  const avgRent = totalListings > 0
    ? Math.round(listings.reduce((acc, l) => acc + l.rent, 0) / totalListings)
    : 0;

  const totalRequests = requests?.length || 0;
  const pendingRequests = requests?.filter((r) => r.status === 'PENDING').length || 0;
  const acceptedRequests = requests?.filter((r) => r.status === 'ACCEPTED').length || 0;

  // Max views for bar chart scaling
  const maxViews = listings?.length ? Math.max(...listings.map((l) => l.views ?? 0), 1) : 1;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <PageHeader title={t('analytics')} subtitle={t('performanceStats')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader title={t('analytics')} subtitle={t('performanceTrends')} />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t('totalViews')}
          value={formatNumber(totalViews)}
          description={t('acrossAll')}
          icon={Eye}
          color="bg-primary-600 shadow-lg shadow-primary-500/20"
        />
        <StatCard
          label={t('myListings')}
          value={totalListings}
          description={`${activeListings} ${t('activeListingsCount')}`}
          icon={List}
          color="bg-info-500 shadow-lg shadow-info-500/20"
        />
        <StatCard
          label={t('avgRent')}
          value={`₹${formatNumber(avgRent)}`}
          description={t('avgRentDesc')}
          icon={DollarSign}
          color="bg-success-500 shadow-lg shadow-success-500/20"
        />
        <StatCard
          label={t('totalRequestsLabel')}
          value={totalRequests}
          description={`${pendingRequests} ${t('pendingVerification')}`}
          icon={TrendingUp}
          color="bg-accent-500 shadow-lg shadow-accent-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Views Bar Chart */}
        <div className="card p-4 sm:p-6 lg:col-span-2 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-surface-900">{t('trafficBreakdown')}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{t('viewsPerListing')}</p>
            </div>
            <BarChart2 className="text-surface-400" size={20} />
          </div>

          {!listings?.length ? (
            <div className="h-60 flex flex-col items-center justify-center text-surface-400">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm font-medium">{t('noListingsAnalyze')}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {listings.map((l) => {
                const percentage = Math.max(Math.round(((l.views ?? 0) / maxViews) * 100), 2);
                return (
                  <div key={l.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-surface-700 truncate max-w-[80%]">{l.title}</span>
                      <span className="text-surface-900 font-bold">{formatNumber(l.views ?? 0)} {t('views')}</span>
                    </div>
                    <div className="h-2.5 w-full bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Requests Funnel */}
        <div className="card p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-surface-900">{t('requestStatus')}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{t('conversionFunnel')}</p>
            </div>
            <TrendingUp className="text-surface-400" size={20} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="text-warning-500" size={18} />
                <span className="text-sm font-medium text-surface-700">{t('pending')}</span>
              </div>
              <span className="text-lg font-bold text-surface-900">{pendingRequests}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-success-500" size={18} />
                <span className="text-sm font-medium text-surface-700">{t('accepted')}</span>
              </div>
              <span className="text-lg font-bold text-surface-900">{acceptedRequests}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary-500" size={18} />
                <span className="text-sm font-medium text-surface-700">{t('total')}</span>
              </div>
              <span className="text-lg font-bold text-surface-900">{totalRequests}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
