import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Automatically sends and receives HTTP-only cookies
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to extract human-readable error messages from any API or network error
export const getErrorMessage = (err, defaultMsg = 'An unexpected error occurred. Please try again.') => {
  if (!err) return defaultMsg;

  // If detailed validation errors array exists from server
  if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
    const errorDetails = err.response.data.errors
      .map((e) => (typeof e === 'string' ? e : e.message))
      .filter(Boolean);

    if (errorDetails.length > 0) {
      return errorDetails.join('. ');
    }
  }

  // If server provided a specific top-level message
  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  // Network / client errors
  if (err.message) {
    if (err.message === 'Network Error') {
      return 'Unable to reach the server. Please check your internet connection or server status.';
    }
    return err.message;
  }

  return defaultMsg;
};

// Response Interceptor: Silent Token Refresh on 401 via HTTP-Only Cookies
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth login/register/refresh endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh cookies via server endpoint
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        window.dispatchEvent(new Event('pulseflow_logout'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
