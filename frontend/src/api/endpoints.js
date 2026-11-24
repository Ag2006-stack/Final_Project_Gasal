import { apiRequest } from './client';

export const authApi = {
  login: (credentials) =>
    apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) =>
    apiRequest('/auth/register', { method: 'POST', body: userData }),
  me: (signal) =>
    apiRequest('/auth/me', { signal })
};

export const productsApi = {
  list: (params = {}, signal) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, String(val));
      }
    });
    const qs = query.toString();
    return apiRequest(`/products${qs ? `?${qs}` : ''}`, { signal });
  },
  getById: (id, signal) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, { signal }),
  create: (productData) =>
    apiRequest('/products', { method: 'POST', body: productData }),
  update: (id, productData) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: productData
    }),
  updateStock: (id, stock) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { stock }
    }),
  remove: (id) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),
  uploadImage: (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = String(reader.result).split(',')[1];
          const res = await apiRequest('/upload', {
            method: 'POST',
            body: {
              fileName: file.name,
              contentType: file.type,
              base64Data
            }
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    })
};

export const cartApi = {
  get: (signal) =>
    apiRequest('/cart', { signal }),
  addItem: (productId, quantity = 1) =>
    apiRequest('/cart/items', { method: 'POST', body: { productId, quantity } }),
  updateItem: (productId, quantity) =>
    apiRequest(`/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: { quantity }
    }),
  removeItem: (productId) =>
    apiRequest(`/cart/items/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    }),
  applyCoupon: (code) =>
    apiRequest('/cart/coupon', { method: 'POST', body: { code } })
};

export const checkoutApi = {
  createSession: (payload, idempotencyKey) =>
    apiRequest('/checkout', {
      method: 'POST',
      body: payload,
      idempotencyKey
    })
};

export const ordersApi = {
  list: (signal) =>
    apiRequest('/orders', { signal }),
  getById: (id, signal) =>
    apiRequest(`/orders/${encodeURIComponent(id)}`, { signal })
};

export const aiApi = {
  discover: (prompt, signal) =>
    apiRequest('/ai/discover', { method: 'POST', body: { prompt }, signal })
};