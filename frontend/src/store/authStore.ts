import { create } from "zustand";
import { api, getTokens, setTokens } from "@/lib/api";
import type { AuthResponse, Role, TokenPair, User } from "@/types";

interface AuthState {
  user: User | null;
  initialized: boolean;
  isAuthenticated: boolean;
  setSession: (res: AuthResponse) => void;
  setUser: (user: User) => void;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role: Role;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  isAuthenticated: false,

  setSession: (res) => {
    setTokens(res.tokens);
    set({ user: res.user, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  bootstrap: async () => {
    const tokens = getTokens();
    if (!tokens?.access_token) {
      set({ initialized: true });
      return;
    }
    try {
      const { data } = await api.get<User>("/auth/me");
      set({ user: data, isAuthenticated: true, initialized: true });
    } catch {
      setTokens(null);
      set({ user: null, isAuthenticated: false, initialized: true });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    get().setSession(data);
    return data.user;
  },

  register: async (payload) => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    get().setSession(data);
    return data.user;
  },

  logout: async () => {
    const tokens = getTokens() as TokenPair | null;
    try {
      if (tokens?.refresh_token) {
        await api.post("/auth/logout", { refresh_token: tokens.refresh_token });
      }
    } catch {
      /* ignore */
    }
    setTokens(null);
    set({ user: null, isAuthenticated: false });
  },
}));

// react to forced logout from the axios interceptor
if (typeof window !== "undefined") {
  window.addEventListener("placera:logout", () => {
    setTokens(null);
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });
}
