const webpush = (() => { try { return require('web-push'); } catch { return null; } })();
const config = require('../config/app');
const SystemSettings = require('../models/SystemSettings');

const hasLib = () => !!webpush;

const getConfig = async () => {
  const envOk = !!(config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY);
  let dbEnabled = envOk;
  try {
    const settings = await SystemSettings.findOne();
    if (settings && typeof settings.pushEnabled === 'boolean') dbEnabled = settings.pushEnabled && envOk;
  } catch {}
  return {
    enabled: dbEnabled && hasLib(),
    publicKey: config.VAPID_PUBLIC_KEY,
    privateKey: config.VAPID_PRIVATE_KEY,
    subject: config.PUSH_SUBJECT,
  };
};

const isEnabled = async () => (await getConfig()).enabled;

// Send a single web-push message to one subscription.
// Returns { skipped } when disabled, or { expired } when the subscription
// is no longer valid (caller should remove it).
const sendPush = async (subscription, payload) => {
  if (!subscription) return { skipped: true, reason: 'no subscription' };
  const cfg = await getConfig();
  if (!cfg.enabled) return { skipped: true, reason: 'push disabled' };
  if (!webpush) {
    console.warn('Push: web-push package not installed — skipping');
    return { skipped: true, reason: 'web-push not installed' };
  }
  try {
    webpush.setVAPIDDetails({
      subject: cfg.subject,
      publicKey: cfg.publicKey,
      privateKey: cfg.privateKey,
    });
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
    return { success: true };
  } catch (err) {
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      return { expired: true };
    }
    console.error('Push send error:', err && err.message);
    return { error: err && err.message };
  }
};

// Send to all of a user's subscriptions. Returns count delivered + expired ids.
const sendToUser = async (userId, payload) => {
  const cfg = await getConfig();
  if (!cfg.enabled) return { skipped: true, reason: 'push disabled' };
  const PushSubscription = require('../models/PushSubscription');
  const subs = await PushSubscription.find({ user: userId });
  let sent = 0;
  const expired = [];
  for (const sub of subs) {
    const res = await sendPush(sub.subscription, payload);
    if (res.success) sent++;
    if (res.expired) expired.push(sub._id);
  }
  if (expired.length) {
    await PushSubscription.deleteMany({ _id: { $in: expired } });
  }
  return { sent, expired: expired.length };
};

exports.getConfig = getConfig;
exports.isEnabled = isEnabled;
exports.sendPush = sendPush;
exports.sendToUser = sendToUser;
exports.hasLib = hasLib;
