const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('aura_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (credentials) => request('/auth/register', { method: 'POST', body: credentials }),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: data }),
  getMe: () => request('/auth/me')
};

export const categoriesApi = {
  getAll: () => request('/categories'),
  getById: (id) => request(`/categories/${id}`),
  create: (data) => request('/categories', { method: 'POST', body: data }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' })
};

export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getLowStock: () => request('/products/low-stock'),
  getById: (id) => request(`/products/${id}`),
  create: (data) => request('/products', { method: 'POST', body: data }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' })
};

export const customersApi = {
  getAll: (search) => request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getKhata: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers/khata${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/customers/${id}`),
  getBills: (id) => request(`/customers/${id}/bills`),
  create: (data) => request('/customers', { method: 'POST', body: data }),
  update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/customers/${id}`, { method: 'DELETE' })
};

export const suppliersApi = {
  getAll: (search) => request(`/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => request(`/suppliers/${id}`),
  getPurchases: (id) => request(`/suppliers/${id}/purchases`),
  create: (data) => request('/suppliers', { method: 'POST', body: data }),
  update: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/suppliers/${id}`, { method: 'DELETE' })
};

export const billsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bills${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/bills/${id}`),
  create: (data) => request('/bills', { method: 'POST', body: data }),
  updatePayment: (id, paid_amount) => request(`/bills/${id}/payment`, { method: 'PATCH', body: { paid_amount } })
};

export const purchasesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/purchases/${id}`),
  create: (data) => request('/purchases', { method: 'POST', body: data })
};

export const dashboardApi = {
  getMetrics: () => request('/dashboard/metrics')
};
