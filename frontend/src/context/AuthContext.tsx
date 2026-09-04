import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { api } from "../lib/api";
import {
  type AuthResponse,
  type LoginCredentials,
  type RegisterDetails,
  type User,
} from "../types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (
    credentials: LoginCredentials,
  ) => Promise<User>;
  register: (
    details: RegisterDetails,
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          user: User;
        };
      }>("/auth/me");

      setUser(response.data.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function restoreSession() {
      await refreshUser();
      setIsLoading(false);
    }

    void restoreSession();
  }, [refreshUser]);

  async function login(
    credentials: LoginCredentials,
  ) {
    try {
      const response =
        await api.post<AuthResponse>(
          "/auth/login",
          credentials,
        );

      const authenticatedUser =
        response.data.data.user;

      setUser(authenticatedUser);

      return authenticatedUser;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function register(
    details: RegisterDetails,
  ) {
    try {
      const response =
        await api.post<AuthResponse>(
          "/auth/register",
          details,
        );

      const registeredUser =
        response.data.data.user;

      setUser(registeredUser);

      return registeredUser;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}