const config = require('../config/app');
const SystemSettings = require('../models/SystemSettings');

// Returns the effective SMS configuration (DB toggle overrides env).
const getConfig = async () => {
  const envEnabled = !!(config.SMS_ACCOUNT_SID && config.SMS_AUTH_TOKEN && config.SMS_FROM);
  let dbEnabled = envEnabled;
  let from = config.SMS_FROM;
  try {
    const settings = await SystemSettings.findOne();
    if (settings) {
      if (typeof settings.smsEnabled === 'boolean') dbEnabled = settings.smsEnabled && envEnabled;
      if (settings.smsFrom) from = settings.smsFrom;
    }
  } catch {}
  return { enabled: dbEnabled, from, accountSid: config.SMS_ACCOUNT_SID, authToken: config.SMS_AUTH_TOKEN };
};

const isEnabled = async () => (await getConfig()).enabled;

// Send an SMS via Twilio. Gracefully skips (returns { skipped: true }) when
// SMS is disabled or the twilio package is not installed, so the rest of
// the notification flow is never blocked.
const sendSMS = async ({ to, body }) => {
  if (!to || !body) return { skipped: true, reason: 'missing to/body' };
  const cfg = await getConfig();
  if (!cfg.enabled) return { skipped: true, reason: 'sms disabled' };

  let twilio;
  try {
    twilio = require('twilio');
  } catch {
    console.warn('SMS: twilio package not installed — skipping SMS send');
    return { skipped: true, reason: 'twilio not installed' };
  }

  try {
    const client = twilio(cfg.accountSid, cfg.authToken);
    const message = await client.messages.create({
      to,
      from: cfg.from,
      body: body.slice(0, 1600),
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('SMS send error:', err.message);
    return { error: err.message };
  }
};

// Build a short human-readable SMS text from a notification payload.
const buildBody = (title, message) => {
  const t = (title || 'Notification').slice(0, 40);
  const m = (message || '').slice(0, 120);
  return m ? `${t}: ${m}` : t;
};

exports.getConfig = getConfig;
exports.isEnabled = isEnabled;
exports.sendSMS = sendSMS;
exports.buildBody = buildBody;
