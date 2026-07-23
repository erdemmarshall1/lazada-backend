import { get, post } from '@/api/request';

const VAPID_ENDPOINT = '/home/notification/vapid-public-key';
const SUBSCRIBE_ENDPOINT = '/home/notification/push/subscribe';
const UNSUBSCRIBE_ENDPOINT = '/home/notification/push/unsubscribe';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

// Subscribe the current browser to Web Push (called once the user is logged in).
// Gracefully no-ops when push is unsupported or disabled server-side.
export async function initPush() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
  try {
    const res = await get(VAPID_ENDPOINT);
    const publicKey = res?.data?.publicKey;
    if (!publicKey) return; // push not configured/enabled server-side

    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    await post(SUBSCRIBE_ENDPOINT, { subscription });
  } catch (err) {
    console.warn('Push init failed:', err?.message || err);
  }
}

export async function unsubscribePush() {
  try {
    const registration = await navigator.serviceWorker?.ready;
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await post(UNSUBSCRIBE_ENDPOINT, { subscription });
    }
  } catch (err) {
    console.warn('Push unsubscribe failed:', err?.message || err);
  }
}
