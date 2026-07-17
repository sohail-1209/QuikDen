import api from '../services/api';

// Convert VAPID key from URL-safe base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Get VAPID public key from backend
async function getVapidKey() {
  const res = await api.get('/push/vapid-public-key');
  return res.data.publicKey;
}

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported on this device');
    return false;
  }

  try {
    // Check current permission state first
    let permission = Notification.permission;

    if (permission === 'default') {
      // Request permission — must be triggered by user gesture on some mobile browsers
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Push notification permission denied');
      return false;
    }

    const vapidPublicKey = await getVapidKey();
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const { endpoint, keys } = subscription.toJSON();
    await api.post('/push/subscribe', { endpoint, p256dh: keys.p256dh, auth: keys.auth });

    // Send welcome notifications only once per user
    if (!localStorage.getItem('welcomeNotifSent')) {
      await api.post('/push/welcome');
      localStorage.setItem('welcomeNotifSent', 'true');
    }

    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

// Check if user is subscribed
export async function isPushSubscribed() {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// Request notification permission (call on user interaction)
export async function requestNotificationPermission() {
  if (!isPushSupported()) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}
