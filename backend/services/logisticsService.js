const cron = require('node-cron');
const Shipping = require('../models/Shipping');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

// Auto-advances a shipment through the logistics stages so that the parcel is
// delivered within a 2-4 day window. The window is derived from the receiver
// address (destination zone) and the stages are scaled to fit that window.
//
// 0 Order Preparation -> 1 Picked Up -> 2 In Transit -> 3 Out for Delivery
//   -> 4 Delivered -> 5 Receiver Signed
//
// Terminal stages (Delivery Failed, Returned) are never auto-touched.
const AUTOMATION_KEY = 'logisticsAutomation';
const AUTO_STAGES = [0, 1, 2, 3, 4];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const STATUS_LABELS = {
  0: 'Order Preparation',
  1: 'Picked Up',
  2: 'In Transit',
  3: 'Out for Delivery',
  4: 'Delivered',
  5: 'Receiver Signed',
  6: 'Delivery Failed',
  7: 'Returned',
};

// Delivery window (days) per destination zone. A = local/near (2 days),
// B = standard (3 days), C = remote (4 days). Bounds: min 2, max 4 days.
const DEFAULT_ZONES = { A: 2, B: 3, C: 4 };
const MIN_WINDOW_DAYS = 2;
const MAX_WINDOW_DAYS = 4;

// Province keywords -> zone. Best-effort, admin-overridable via the Setting.
const ZONE_PROVINCES = {
  A: ['北京', '上海', '天津', '重庆', '江苏', '浙江', '广东', '福建'],
  B: ['安徽', '江西', '山东', '河南', '湖北', '湖南', '河北', '山西', '陕西', '四川', '辽宁', '吉林', '广西', '贵州', '海南'],
  C: ['云南', '甘肃', '青海', '宁夏', '新疆', '西藏', '内蒙古', '黑龙江'],
};
const ALL_PROVINCES = Object.values(ZONE_PROVINCES).flat();

// Cumulative fraction of the delivery window at which each status transition
// fires. Transitions: 0->1, 1->2, 2->3, 3->4, 4->5.
// Delivered (4) lands at 85% of the window; Receiver Signed (5) at 100%.
const STAGE_WEIGHTS = [0.15, 0.25, 0.30, 0.15, 0.15];
const CUMULATIVE = STAGE_WEIGHTS.reduce((acc, w) => {
  acc.push((acc[acc.length - 1] || 0) + w);
  return acc;
}, []);

// Resolve the destination zone from the receiver address. If the receiver's
// province also appears in the sender address, treat it as local (zone A).
const resolveZone = (receiverAddress, senderAddress) => {
  const recv = String(receiverAddress || '');
  const sender = String(senderAddress || '');

  if (recv) {
    for (const prov of ALL_PROVINCES) {
      if (recv.includes(prov) && sender.includes(prov)) return 'A';
    }
    for (const [zone, provs] of Object.entries(ZONE_PROVINCES)) {
      if (provs.some((p) => recv.includes(p))) return zone;
    }
  }
  return 'B';
};

const clampDays = (days) => {
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ZONES.B;
  return Math.min(MAX_WINDOW_DAYS, Math.max(MIN_WINDOW_DAYS, n));
};

const normalizeZones = (zones) => ({
  A: clampDays(zones?.A ?? DEFAULT_ZONES.A),
  B: clampDays(zones?.B ?? DEFAULT_ZONES.B),
  C: clampDays(zones?.C ?? DEFAULT_ZONES.C),
});

const getConfig = async () => {
  try {
    const doc = await Setting.findOne({ key: AUTOMATION_KEY });
    const value = doc?.value || {};
    return {
      enabled: value.enabled !== false,
      zones: normalizeZones(value.zones),
    };
  } catch {
    return { enabled: true, zones: { ...DEFAULT_ZONES } };
  }
};

const setConfig = async (input) => {
  const enabled = input?.enabled !== false;
  const zones = normalizeZones(input?.zones);
  await Setting.findOneAndUpdate(
    { key: AUTOMATION_KEY },
    {
      key: AUTOMATION_KEY,
      value: { enabled, zones },
      type: 'json',
      label: 'Logistics Automation',
      description: 'Auto-advance shipping status; zones = delivery window in days (2-4)',
    },
    { upsert: true, new: true }
  );
  return { enabled, zones };
};

// Compute the delivery plan (zone + window in days) for a new shipment.
const planDelivery = async (receiverAddress, senderAddress) => {
  const config = await getConfig();
  const zone = resolveZone(receiverAddress, senderAddress);
  const days = config.zones[zone] || DEFAULT_ZONES[zone] || DEFAULT_ZONES.B;
  return { zone, days };
};

// Timestamp the shipment entered its first (preparation) stage.
const baseTime = (shipping) => {
  const entries = (shipping.statusHistory || [])
    .map((h) => ({ status: h.status, t: new Date(h.timestamp).getTime() }))
    .filter((h) => !Number.isNaN(h.t));
  const prep = entries.filter((h) => h.status === 0);
  if (prep.length) return Math.min(...prep.map((h) => h.t));
  if (entries.length) return Math.min(...entries.map((h) => h.t));
  const fallback = shipping.createdAt || shipping.updatedAt;
  return fallback ? new Date(fallback).getTime() : Date.now();
};

const advanceShipments = async () => {
  const config = await getConfig();
  if (!config.enabled) return { advanced: 0, checked: 0 };

  const shippings = await Shipping.find({ status: { $in: AUTO_STAGES } });
  const io = global.io || null;
  const now = Date.now();
  let advanced = 0;

  for (const shipping of shippings) {
    const current = shipping.status;
    if (!AUTO_STAGES.includes(current)) continue;

    const windowDays = clampDays(
      shipping.deliveryWindowDays || config.zones[shipping.deliveryZone] || DEFAULT_ZONES.B
    );
    const windowMs = windowDays * DAY_MS;
    const base = baseTime(shipping);
    const threshold = base + windowMs * CUMULATIVE[current];
    if (now < threshold) continue;

    const next = current + 1;
    const label = STATUS_LABELS[next] || 'Status updated';

    const updated = await Shipping.findOneAndUpdate(
      { _id: shipping._id, status: current },
      {
        $set: { status: next, ...(next === 4 ? { deliveredAt: new Date() } : {}) },
        $push: {
          statusHistory: {
            status: next,
            location: '',
            description: `${label} (automatic)`,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!updated) continue;
    advanced += 1;

    if (io) {
      try {
        const order = await Order.findById(updated.orderId).select('userId orderNo');
        if (order) {
          io.to(`user_${order.userId}`).emit('trackingUpdated', {
            orderId: order._id,
            trackingNo: updated.trackingNo,
            status: next,
            statusLabel: label,
            message: `Your order ${order.orderNo} tracking updated: ${label}`,
          });
        }
      } catch (err) {
        console.error('[logistics] socket emit failed:', err.message);
      }
    }
  }

  if (advanced > 0) console.log(`[logistics] auto-advanced ${advanced} shipment(s)`);
  return { advanced, checked: shippings.length };
};

let task = null;

const start = () => {
  if (task) return;
  // Run every hour; each stage advances at most once per run.
  task = cron.schedule('0 * * * *', () => {
    advanceShipments().catch((err) => console.error('[logistics] cron error:', err.message));
  });
  console.log('Logistics auto-advance scheduled hourly');
};

module.exports = {
  start,
  advanceShipments,
  getConfig,
  setConfig,
  planDelivery,
  resolveZone,
  DEFAULT_ZONES,
  STAGE_WEIGHTS,
  STATUS_LABELS,
};
