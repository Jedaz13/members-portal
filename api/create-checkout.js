const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe Price IDs — per-protocol pricing
const PROTOCOL_PRICES = {
  'bloat_reset':  'price_1SwkoVLZMe5qWSedZMXuSKnF',
  'regularity':   'price_1Swl2jLZMe5qWSedVESlYi1A',
  'calm_gut':     'price_1Swl3RLZMe5qWSedDd40BgDG',
  'stability':    'price_1Swl3gLZMe5qWSed2ZoLaoOd',
  'rebuild':      'price_1Swl3tLZMe5qWSedxrlIAzwG'
};

const STRIPE_PRICE_SURVIVAL = 'price_1Swl5GLZMe5qWSedSB44hOjF';  // $19 one-time
const STRIPE_PRICE_MEALPLAN = 'price_1Swl6DLZMe5qWSedzUotZrpG';  // $37 one-time

const ALLOWED_ORIGINS = [
  'https://www.guthealingacademy.com',
  'https://guthealingacademy.com'
];

function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const corsHeaders = getCorsHeaders(origin);

  // Set CORS headers on all responses
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      name,
      protocol_name,
      protocol,
      include_survival_guide,
      include_meal_plan,
      success_url: customSuccessUrl,
      cancel_url: customCancelUrl,
      // Quiz params for metadata passthrough
      primary_complaint,
      duration,
      treatments_tried_count,
      gut_brain_score,
      vision
    } = req.body;

    if (!email || !protocol_name) {
      return res.status(400).json({ error: 'Missing required fields: email and protocol_name' });
    }

    const protocolPrice = PROTOCOL_PRICES[protocol];
    if (!protocolPrice) {
      return res.status(400).json({ error: 'Invalid protocol: ' + protocol });
    }

    // Build line items — protocol is always included
    const line_items = [
      { price: protocolPrice, quantity: 1 }
    ];

    if (include_survival_guide) {
      line_items.push({ price: STRIPE_PRICE_SURVIVAL, quantity: 1 });
    }

    if (include_meal_plan) {
      line_items.push({ price: STRIPE_PRICE_MEALPLAN, quantity: 1 });
    }

    // Build query string for success/cancel URLs
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (email) params.set('email', email);
    if (protocol_name) params.set('protocol_name', protocol_name);
    if (primary_complaint) params.set('primary_complaint', primary_complaint);
    if (duration) params.set('duration', duration);
    if (treatments_tried_count) params.set('treatments_tried_count', treatments_tried_count);
    if (gut_brain_score) params.set('gut_brain_score', gut_brain_score);
    if (vision) params.set('vision', vision);

    const queryString = params.toString();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items,
      allow_promotion_codes: true,
      metadata: {
        name: name || '',
        protocol_name: protocol_name || '',
        primary_complaint: primary_complaint || '',
        duration: duration || '',
        treatments_tried_count: treatments_tried_count || '',
        gut_brain_score: gut_brain_score || '',
        vision: vision || ''
      },
      success_url: customSuccessUrl || `https://www.guthealingacademy.com/case-review/?${queryString}`,
      cancel_url: customCancelUrl || `https://www.guthealingacademy.com/offer-protocol/?${queryString}`
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
