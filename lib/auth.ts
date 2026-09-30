import { api } from "./api";

export type EmployeeContext = {
  employeeId: string;
  empCode: string;
  firstName: string;
  lastName: string;
  department?: string;
  designation?: string;
  leaveBalance?: { casual?: number; sick?: number; earned?: number };
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  isSuperAdmin?: boolean;
  employeeId?: string | null;
  employee?: EmployeeContext | null;
};

export type LoginResult = {
  user: AuthUser;
  token: string;
};

const SESSION_KEY = "emp_session";
const TOKEN_KEY = "emp_token";

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(user: AuthUser | null, token?: string | null) {
  if (typeof window === "undefined") return;
  if (user && token) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const result = await api.post<LoginResult>("/api/auth/employee-login", {
    email,
    password,
  });
  setSession(result.user, result.token);
  return result.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await api.get<AuthUser>("/api/auth/me");
    if (!user.employeeId) {
      setSession(null);
      return null;
    }
    setSession(user, token);
    return user;
  } catch {
    setSession(null);
    return null;
  }
}

export function logoutSession() {
  setSession(null);
}
