import axios from "axios";
import { API_BASE } from "../config/site.js";

const TOKEN_KEY = "shree_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const api = axios.create({ baseURL: API_BASE, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      // Token invalid/expired or account blocked — force re-login
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const apiError = (err, fallback = "Something went wrong") =>
  err.response?.data?.message || err.message || fallback;

// Loads Razorpay checkout.js once (no npm dep needed)
let razorpayPromise = null;
export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayPromise) {
    razorpayPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }
  return razorpayPromise;
};

export default api;
