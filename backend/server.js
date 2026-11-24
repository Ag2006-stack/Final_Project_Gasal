import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '5mb' }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ok = (res, data, meta = null, status = 200) =>
  res.status(status).json({ success: true, data, meta });

const fail = (res, status, code, message, details = null) =>
  res.status(status).json({
    success: false,
    error: { code, message, details },
    requestId: crypto.randomUUID()
  });

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, 'UNAUTHORIZED', 'Authentication required.');

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return fail(res, 401, 'INVALID_TOKEN', 'Session expired. Please log in again.');
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Admin role required.');
  }
  next();
}

const mapProduct = (p) => ({
  id: p.id,
  brand: p.brand || 'Generic',
  name: p.name,
  description: p.description,
  category: p.category,
  price: Number(p.price),
  stock: Number(p.stock),
  imageUrl: p.image_url
});

async function buildUserCart(userId, couponCode = null) {
  const { data: rows, error } = await supabase
    .from('cart_items')
    .select('quantity, product_id, products(id, brand, name, price, stock, image_url)')
    .eq('user_id', userId);

  if (error) throw error;

  const items = (rows || [])
    .filter((r) => r.products)
    .map((r) => ({
      productId: r.products.id,
      brand: r.products.brand,
      name: `${r.products.brand} ${r.products.name}`,
      price: Number(r.products.price),
      imageUrl: r.products.image_url,
      quantity: r.quantity
    }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount = 0;
  let appliedCode = null;

  if (couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .single();

    if (coupon && coupon.is_active) {
      appliedCode = coupon.code;
      discount = Math.round((subtotal * coupon.discount_percent) / 100);
    }
  }

  return {
    items,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    couponCode: appliedCode
  };
}

// ================= AUTH ROUTES =================
app.post('/api/v1/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return fail(res, 422, 'VALIDATION_ERROR', 'Name, email, and 8+ char password required.');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('users')
    .insert({ name, email: email.toLowerCase(), password_hash })
    .select('id, name, email, role')
    .single();

  if (error) return fail(res, 409, 'EMAIL_EXISTS', 'Email is already registered.');

  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
  return ok(res, { token, user }, null, 201);
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', String(email || '').toLowerCase())
    .single();

  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(safeUser, process.env.JWT_SECRET, { expiresIn: '7d' });
  return ok(res, { token, user: safeUser });
});

app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  return ok(res, { user: req.user });
});

// ================= ADMIN IMAGE UPLOAD =================
app.post('/api/v1/upload', requireAuth, requireAdmin, async (req, res) => {
  const { fileName, contentType, base64Data } = req.body;
  if (!base64Data || !contentType) {
    return fail(res, 422, 'VALIDATION_ERROR', 'Image file data is required.');
  }

  const ext = (fileName?.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
  const storagePath = `hardware/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(base64Data, 'base64');

  const { error: uploadErr } = await supabase.storage
    .from('product-images')
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (uploadErr) {
    return fail(res, 500, 'UPLOAD_FAILED', uploadErr.message);
  }

  const { data: publicData } = supabase.storage
    .from('product-images')
    .getPublicUrl(storagePath);

  return ok(res, { url: publicData.publicUrl }, null, 201);
});

// ================= PRODUCT CRUD ROUTES =================
app.get('/api/v1/products', async (req, res) => {
  const { q, category, brand, sort, limit = 50 } = req.query;
  let query = supabase.from('products').select('*').limit(Number(limit));

  if (q) query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  if (category) query = query.eq('category', category);
  if (brand) query = query.ilike('brand', brand);
  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return fail(res, 500, 'DB_ERROR', error.message);

  const mapped = (data || []).map(mapProduct);
  return ok(res, mapped, { total: mapped.length });
});

app.get('/api/v1/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return fail(res, 404, 'NOT_FOUND', 'Product not found.');
  return ok(res, mapProduct(data));
});

app.post('/api/v1/products', requireAuth, requireAdmin, async (req, res) => {
  const { brand, name, description, category, price, stock, imageUrl } = req.body;
  if (!brand || !name || !category || Number(price) <= 0) {
    return fail(res, 422, 'VALIDATION_ERROR', 'Brand, name, category, and valid price are required.');
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      brand: brand.trim(),
      name: name.trim(),
      description: description || '',
      category,
      price: Number(price),
      stock: Math.max(0, Number(stock ?? 10)),
      image_url: imageUrl || null
    })
    .select('*')
    .single();

  if (error) return fail(res, 500, 'DB_ERROR', error.message);
  return ok(res, mapProduct(data), null, 201);
});

app.put('/api/v1/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const { brand, name, description, category, price, stock, imageUrl } = req.body;
  if (!brand || !name || !category || Number(price) <= 0) {
    return fail(res, 422, 'VALIDATION_ERROR', 'Brand, name, category, and valid price are required.');
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      brand: brand.trim(),
      name: name.trim(),
      description: description || '',
      category,
      price: Number(price),
      stock: Math.max(0, Number(stock ?? 0)),
      image_url: imageUrl || null
    })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error || !data) return fail(res, 404, 'NOT_FOUND', 'Product not found.');
  return ok(res, mapProduct(data));
});

app.patch('/api/v1/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const { stock } = req.body;
  const { data, error } = await supabase
    .from('products')
    .update({ stock: Math.max(0, Number(stock)) })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error || !data) return fail(res, 404, 'NOT_FOUND', 'Product not found.');
  return ok(res, mapProduct(data));
});

app.delete('/api/v1/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return fail(
      res,
      409,
      'PRODUCT_IN_USE',
      'Cannot delete a product linked to existing orders. Set stock to 0 instead.'
    );
  }
  return ok(res, { deletedId: req.params.id });
});

// ================= CART ROUTES =================
app.get('/api/v1/cart', requireAuth, async (req, res) => {
  const cart = await buildUserCart(req.user.id);
  return ok(res, cart);
});

app.post('/api/v1/cart/items', requireAuth, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
  if (!product) return fail(res, 404, 'NOT_FOUND', 'Product not found.');

  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('product_id', productId)
    .single();

  const nextQty = (existing?.quantity || 0) + Number(quantity);
  if (nextQty > product.stock) {
    return fail(res, 409, 'INSUFFICIENT_STOCK', `Only ${product.stock} left in stock.`);
  }

  await supabase.from('cart_items').upsert(
    { user_id: req.user.id, product_id: productId, quantity: nextQty },
    { onConflict: 'user_id,product_id' }
  );

  const cart = await buildUserCart(req.user.id);
  return ok(res, cart);
});

app.patch('/api/v1/cart/items/:productId', requireAuth, async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (quantity <= 0) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId);
  } else {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', req.params.productId)
      .single();
    if (product && quantity > product.stock) {
      return fail(res, 409, 'INSUFFICIENT_STOCK', `Only ${product.stock} left in stock.`);
    }
    await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId);
  }

  const cart = await buildUserCart(req.user.id);
  return ok(res, cart);
});

app.delete('/api/v1/cart/items/:productId', requireAuth, async (req, res) => {
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', req.user.id)
    .eq('product_id', req.params.productId);

  const cart = await buildUserCart(req.user.id);
  return ok(res, cart);
});

app.post('/api/v1/cart/coupon', requireAuth, async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code).single();

  if (!coupon) return fail(res, 422, 'INVALID_COUPON', 'Coupon code does not exist.');
  if (!coupon.is_active) return fail(res, 422, 'COUPON_EXPIRED', 'This coupon has expired.');

  const cart = await buildUserCart(req.user.id, code);
  return ok(res, cart);
});

// ================= CHECKOUT (MAYA SANDBOX) =================
app.post('/api/v1/checkout', requireAuth, async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  const { shippingAddress, couponCode } = req.body;

  if (idempotencyKey) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();
    if (existingOrder) {
      return ok(res, { orderId: existingOrder.id, checkoutUrl: existingOrder.maya_checkout_id });
    }
  }

  const cart = await buildUserCart(req.user.id, couponCode);
  if (cart.items.length === 0) {
    return fail(res, 422, 'EMPTY_CART', 'Your cart is empty.');
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: req.user.id,
      status: 'pending_payment',
      subtotal: cart.subtotal,
      discount: cart.discount,
      total: cart.total,
      coupon_code: cart.couponCode,
      shipping_address: shippingAddress,
      idempotency_key: idempotencyKey || null
    })
    .select('*')
    .single();

  if (orderErr) return fail(res, 500, 'ORDER_CREATE_FAILED', orderErr.message);

  await supabase.from('order_items').insert(
    cart.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  );

  const authHeader = Buffer.from(`${process.env.MAYA_PUBLIC_KEY}:`).toString('base64');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const mayaRes = await fetch('https://pg-sandbox.paymaya.com/checkout/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      totalAmount: { value: cart.total, currency: 'PHP' },
      buyer: {
        firstName: shippingAddress.fullName,
        contact: { phone: shippingAddress.phone, email: req.user.email }
      },
      redirectUrl: {
        success: `${frontendUrl}/payment/success?orderId=${order.id}`,
        failure: `${frontendUrl}/payment/cancelled?orderId=${order.id}`,
        cancel: `${frontendUrl}/payment/cancelled?orderId=${order.id}`
      },
      requestReferenceNumber: order.id
    })
  });

  const mayaData = await mayaRes.json();
  if (!mayaRes.ok || !mayaData.redirectUrl) {
    return fail(res, 502, 'PAYMENT_GATEWAY_ERROR', 'Failed to create Maya checkout session.', mayaData);
  }

  await supabase
    .from('orders')
    .update({ maya_checkout_id: mayaData.redirectUrl })
    .eq('id', order.id);

  await supabase.from('cart_items').delete().eq('user_id', req.user.id);

  return ok(res, { orderId: order.id, checkoutUrl: mayaData.redirectUrl });
});

// ================= MAYA WEBHOOK =================
app.post('/api/v1/webhooks/maya', async (req, res) => {
  const { requestReferenceNumber, paymentStatus } = req.body || {};
  if (requestReferenceNumber && paymentStatus === 'PAYMENT_SUCCESS') {
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', requestReferenceNumber);
  }
  res.status(200).json({ received: true });
});

// ================= ORDERS ROUTES =================
app.get('/api/v1/orders', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  return ok(res, data || []);
});

app.get('/api/v1/orders/:id', requireAuth, async (req, res) => {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (!order) return fail(res, 404, 'NOT_FOUND', 'Order not found.');

  if (order.status === 'pending_payment' && process.env.MAYA_SECRET_KEY) {
    try {
      const secretAuth = Buffer.from(`${process.env.MAYA_SECRET_KEY}:`).toString('base64');
      const checkRes = await fetch(
        `https://pg-sandbox.paymaya.com/payments/v1/payment-rrns/${order.id}`,
        { headers: { Authorization: `Basic ${secretAuth}` } }
      );
      if (checkRes.ok) {
        const payments = await checkRes.json();
        const isPaid = Array.isArray(payments) && payments.some((p) => p.status === 'PAYMENT_SUCCESS');
        if (isPaid) {
          await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);
          order.status = 'paid';
        }
      }
    } catch {
      // Return current DB status
    }
  }

  return ok(res, {
    ...order,
    items: order.order_items || []
  });
});

// ================= GEMINI AI DISCOVERY =================
app.post('/api/v1/ai/discover', async (req, res) => {
  const prompt = String(req.body.prompt || '').trim();
  if (!prompt) return fail(res, 422, 'VALIDATION_ERROR', 'Prompt is required.');

  const { data: dbProducts } = await supabase.from('products').select('*');
  const catalog = (dbProducts || []).map(mapProduct);

  const fallbackSearch = () => {
    const terms = prompt.toLowerCase().split(/\s+/).filter(Boolean);
    const matched = catalog.filter((p) => {
      const text = `${p.brand} ${p.name} ${p.category} ${p.description}`.toLowerCase();
      return terms.some((t) => text.includes(t));
    });
    const results = matched.length > 0 ? matched : catalog.slice(0, 3);
    return ok(res, {
      summary:
        results.length > 0
          ? `Showing top catalog matches for "${prompt}" (${results
              .map((p) => `${p.brand} ${p.name} at ₱${p.price}`)
              .join(', ')}).`
          : 'No hardware items are currently in the catalog yet.',
      products: results
    });
  };

  if (!process.env.GEMINI_API_KEY) {
    return fallbackSearch();
  }

  try {
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY.trim()
        },
        body: JSON.stringify({
          generationConfig: {
            responseMimeType: 'application/json'
          },
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful PC hardware & laptop store assistant. User request: "${prompt}".
Available catalog JSON: ${JSON.stringify(catalog)}
Respond ONLY in valid JSON with this exact format:
{"summary": "short 2-sentence helpful recommendation mentioning brands and prices", "productIds": ["matching-uuid-1"]}`
                }
              ]
            }
          ]
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return fallbackSearch();
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    const matchedProducts = catalog.filter(
      (p) => Array.isArray(parsed.productIds) && parsed.productIds.includes(p.id)
    );

    return ok(res, {
      summary: parsed.summary || 'Here are the closest hardware matches from our catalog.',
      products: matchedProducts.length > 0 ? matchedProducts : catalog.slice(0, 2)
    });
  } catch (err) {
    console.error('Gemini discovery error:', err);
    return fallbackSearch();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));