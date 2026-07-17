// Format currency in Indian Rupees
export const formatRent = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// Format number in Indian style (x,xx,xxx)
export const formatNumber = (num) =>
  new Intl.NumberFormat('en-IN').format(num);

// Relative time (e.g., "2 days ago") — uses i18n for locale-aware strings
import i18n from '../i18n';

export const timeAgo = (date) => {
  const t = i18n.t.bind(i18n);
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return `${mins}${t('mAgo')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t('hAgo')}`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}${t('dAgo')}`;
  return new Date(date).toLocaleDateString('en-IN');
};

// Truncate text
export const truncate = (str, len = 80) =>
  str?.length > len ? str.slice(0, len) + '…' : str;

// Get primary photo URL from a listing
export const getPrimaryPhoto = (listing) =>
  listing?.photos?.find((p) => p.isPrimary)?.url ||
  listing?.photos?.[0]?.url ||
  null;

// Build amenity list from amenity object
export const getAmenityList = (amenities) => {
  if (!amenities) return [];
  const t = i18n.t.bind(i18n);
  const map = {
    wifi: t('wifi'), ac: t('ac'), parking: t('parking'), fridge: t('fridge'),
    washingMachine: t('washingMachine'), kitchen: t('kitchen'), lift: t('lift'),
    gym: t('gym'), security: t('security'), powerBackup: t('powerBackup'),
    waterSupply: t('waterSupply'), cctv: t('cctv'), ventilation: t('ventilation'),
  };
  return Object.entries(map).filter(([key]) => amenities[key]).map(([, label]) => label);
};

// Listing type label
export const listingTypeLabel = (type) => {
  const t = i18n.t.bind(i18n);
  return ({ HOUSE_RENTAL: t('houseRental'), ROOM_SHARING: t('roomSharingType'), HOSTEL: t('hostelPg'), LAND_SALE: t('landSaleType') })[type] || type;
};

// Request status color class
export const requestStatusClass = (status) => ({
  PENDING:  'badge-warning',
  ACCEPTED: 'badge-success',
  REJECTED: 'badge-danger',
}[status] || 'badge-gray');

// Extract error message from axios error
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || i18n.t('somethingWrong');
