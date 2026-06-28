import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenPair } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const TOKENS_KEY = "placera.tokens";

export function getTokens(): TokenPair | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as TokenPair) : null;
}

export function setTokens(tokens: TokenPair | null) {
  if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKENS_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getTokens();
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

// Single-flight refresh so concurrent 401s don't trigger multiple refreshes.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh_token) return null;
  try {
    const { data } = await axios.post<TokenPair>(`${API_URL}/auth/refresh`, {
      refresh_token: tokens.refresh_token,
    });
    setTokens(data);
    return data.access_token;
  } catch {
    setTokens(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // hard logout
      window.dispatchEvent(new CustomEvent("placera:logout"));
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ error?: { message?: string } }>;
  return err.response?.data?.error?.message ?? "Something went wrong. Please try again.";
}
