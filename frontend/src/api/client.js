const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  constructor({ status, code, message, details = null, requestId = null }) {
    super(message || 'Unexpected API error');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
    this.requestId = requestId;
  }
}

export async function apiRequest(
  endpoint,
  { method = 'GET', body, token, idempotencyKey, signal } = {}
) {
  const headers = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const activeToken = token || localStorage.getItem('auth_token');
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError({
      status: 0,
      code: 'NETWORK_OFFLINE',
      message: 'Unable to reach the server. Check your internet connection.'
    });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.success === false)) {
    const errObj = payload?.error || {};
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw new ApiError({
      status: response.status,
      code: errObj.code || `HTTP_${response.status}`,
      message: errObj.message || response.statusText || 'Request failed',
      details: errObj.details || null,
      requestId: payload?.requestId || null
    });
  }

  return {
    data: payload?.data ?? payload,
    meta: payload?.meta ?? null
  };
}