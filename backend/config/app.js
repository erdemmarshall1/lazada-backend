module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'shopify_wholesale_jwt_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'shopify_wholesale_refresh_secret_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  PORT: process.env.PORT || 3000,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',

  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@shopifywholesale.com',

  // SMS (Twilio) - optional; notifications skip when unconfigured
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'twilio',
  SMS_ACCOUNT_SID: process.env.SMS_ACCOUNT_SID || '',
  SMS_AUTH_TOKEN: process.env.SMS_AUTH_TOKEN || '',
  SMS_FROM: process.env.SMS_FROM || '',

  // Web Push (VAPID) - optional; notifications skip when unconfigured
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  PUSH_SUBJECT: process.env.PUSH_SUBJECT || 'mailto:noreply@shopifywholesale.com',
};
