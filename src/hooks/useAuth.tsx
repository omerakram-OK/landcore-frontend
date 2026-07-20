import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest } from "../api/auth";
import type { AuthClaims, DecodedToken } from "../types/auth";
import { CLAIM_TYPES } from "../types/auth";

const TOKEN_STORAGE_KEY = "landcore_token";

function decodeTokenPayload(token: string): DecodedToken | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as DecodedToken;
  } catch {
    return null;
  }
}

function toClaims(decoded: DecodedToken): AuthClaims {
  const rawPermissions = decoded[CLAIM_TYPES.permission];
  const permissions = Array.isArray(rawPermissions)
    ? rawPermissions
    : rawPermissions
      ? [rawPermissions]
      : [];

  return {
    userId: decoded.sub,
    role: decoded[CLAIM_TYPES.role],
    adminId: decoded.adminId ?? null,
    permissions,
    email: decoded.email ?? null,
    name: decoded.name ?? null,
    expiresAt: decoded.exp,
  };
}

function claimsFromStoredToken(token: string | null): AuthClaims | null {
  if (!token) {
    return null;
  }

  const decoded = decodeTokenPayload(token);
  if (!decoded) {
    return null;
  }

  if (decoded.exp * 1000 <= Date.now()) {
    return null;
  }

  return toClaims(decoded);
}

interface AuthContextValue {
  token: string | null;
  claims: AuthClaims | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthClaims>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [claims, setClaims] = useState<AuthClaims | null>(() =>
    claimsFromStoredToken(localStorage.getItem(TOKEN_STORAGE_KEY)),
  );

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const nextToken = response.data.token;

    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    const decoded = decodeTokenPayload(nextToken);
    const nextClaims = decoded ? toClaims(decoded) : null;

    setToken(nextToken);
    setClaims(nextClaims);

    if (!nextClaims) {
      throw new Error("Login succeeded but the session token could not be read.");
    }

    return nextClaims;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setClaims(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      claims,
      isAuthenticated: token !== null && claims !== null,
      login,
      logout,
    }),
    [token, claims, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
