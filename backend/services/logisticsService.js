const cron = require('node-cron');
const Shipping = require('../models/Shipping');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

// Auto-advances a shipment through the logistics stages based on a per-stage
// dwell time (in hours). Terminal stages (Receiver Signed, Delivery Failed,
// Returned) are never auto-touched.
//
// 0 Order Preparation -> 1 Picked Up -> 2 In Transit -> 3 Out for Delivery
//   -> 4 Delivered -> 5 Receiver Signed
const AUTOMATION_KEY = 'logisticsAutomation';
const AUTO_STAGES = [0, 1, 2, 3, 4];
const FINAL_STATUS = 5;

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

const DEFAULT_STAGES = [
  { status: 0, label: 'Order Preparation', hours: 12 },
  { status: 1, label: 'Picked Up', hours: 24 },
  { status: 2, label: 'In Transit', hours: 48 },
  { status: 3, label: 'Out for Delivery', hours: 24 },
  { status: 4, label: 'Delivered', hours: 24 },
  { status: 5, label: 'Receiver Signed', hours: 0 },
];

const normalizeStages = (stages) =>
  (Array.isArray(stages) ? stages : [])
    .filter((s) => s && Number.isInteger(Number(s.status)))
    .map((s) => ({
      status: Number(s.status),
      label: String(s.label || STATUS_LABELS[Number(s.status)] || ''),
      hours: Math.max(0, Number(s.hours) || 0),
    }))
    .sort((a, b) => a.status - b.status);

const getConfig = async () => {
  try {
    const doc = await Setting.findOne({ key: AUTOMATION_KEY });
    const value = doc?.value || {};
    const stages = normalizeStages(value.stages);
    return { enabled: value.enabled !== false, stages: stages.length ? stages : DEFAULT_STAGES };
  } catch {
    return { enabled: true, stages: DEFAULT_STAGES };
  }
};

const setConfig = async (input) => {
  const enabled = input?.enabled !== false;
  const stages = normalizeStages(input?.stages);
  const finalStages = stages.length ? stages : DEFAULT_STAGES;
  await Setting.findOneAndUpdate(
    { key: AUTOMATION_KEY },
    {
      key: AUTOMATION_KEY,
      value: { enabled, stages: finalStages },
      type: 'json',
      label: 'Logistics Automation',
      description: 'Auto-advance shipping status; hours = dwell time at each stage',
    },
    { upsert: true, new: true }
  );
  return { enabled, stages: finalStages };
};

const dwellMs = (status, config) => {
  const stage = config.stages.find((s) => s.status === status);
  const hours = stage ? stage.hours : 0;
  return hours * 60 * 60 * 1000;
};

// Timestamp the shipment entered its current status.
const enteredCurrentStatusAt = (shipping) => {
  const entries = (shipping.statusHistory || []).filter((h) => h.status === shipping.status);
  if (entries.length) {
    const times = entries
      .map((h) => new Date(h.timestamp).getTime())
      .filter((t) => !Number.isNaN(t));
    if (times.length) return Math.max(...times);
  }
  const fallback = shipping.updatedAt || shipping.createdAt;
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

    const enteredAt = enteredCurrentStatusAt(shipping);
    if (now - enteredAt < dwellMs(current, config)) continue;

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
  // Run every hour; each cart stage advances at most once per run.
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
  DEFAULT_STAGES,
  STATUS_LABELS,
};
