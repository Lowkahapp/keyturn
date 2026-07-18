import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kt_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── API helpers ─────────────────────────────────────────────────────────────
export const authAPI = {
  sendOtp:    (phone)            => api.post('/auth/otp/send', { phone }),
  verifyOtp:  (phone, otp, name, user_type) => api.post('/auth/otp/verify', { phone, otp, name, user_type }),
  getMe:      ()                 => api.get('/auth/me'),
  updateProfile: (data)          => api.put('/auth/profile', data),
};

export const propertyAPI = {
  list:           (params)       => api.get('/properties', { params }),
  get:            (id)           => api.get(`/properties/${id}`),
  create:         (data)         => api.post('/properties', data),
  update:         (id, data)     => api.put(`/properties/${id}`, data),
  remove:         (id)           => api.delete(`/properties/${id}`),
  uploadPhotos:   (id, formData) => api.post(`/properties/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestVerify:  (id)           => api.post(`/properties/${id}/verify-request`),
  myListings:     ()             => api.get('/properties/owner/my-listings'),
};

export const searchAPI = {
  search:      (params) => api.get('/search', { params }),
  suggestions: (q, city) => api.get('/search/suggestions', { params: { q, city } }),
};

export const transactionAPI = {
  initiate:       (property_id)  => api.post('/transactions/initiate', { property_id }),
  list:           ()             => api.get('/transactions'),
  get:            (id)           => api.get(`/transactions/${id}`),
  agree:          (id, data)     => api.put(`/transactions/${id}/agree`, data),
  initiateEscrow: (id)           => api.post(`/transactions/${id}/escrow/initiate`),
  confirmEscrow:  (id, data)     => api.post(`/transactions/${id}/escrow/confirm`, data),
  confirmHandover:(id, data)     => api.post(`/transactions/${id}/handover/confirm`, data),
  cancel:         (id, reason)   => api.put(`/transactions/${id}/cancel`, { cancellation_reason: reason }),
};

export const visitAPI = {
  schedule: (data)    => api.post('/visits', data),
  list:     ()        => api.get('/visits'),
  confirm:  (id)      => api.put(`/visits/${id}/confirm`),
  cancel:   (id)      => api.put(`/visits/${id}/cancel`),
  complete: (id, data)=> api.put(`/visits/${id}/complete`, data),
};

export const chatAPI = {
  rooms:    ()         => api.get('/chat/rooms'),
  messages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  send:     (roomId, data)   => api.post(`/chat/rooms/${roomId}/messages`, data),
};

export const scoutAPI = {
  tasks:    (params) => api.get('/scouts/tasks', { params }),
  checkIn:  (id, loc)=> api.post(`/scouts/tasks/${id}/checkin`, loc),
  complete: (id, data)=> api.post(`/scouts/tasks/${id}/complete`, data),
  earnings: ()        => api.get('/scouts/earnings'),
};

export const priceOracleAPI = {
  estimate: (params) => api.get('/price-oracle/estimate', { params }),
  trends:   (params) => api.get('/price-oracle/trends', { params }),
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify:      (data) => api.post('/payments/verify', data),
  history:     ()     => api.get('/payments/history'),
};
