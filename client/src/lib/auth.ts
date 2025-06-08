import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

export interface AuthResponse {
  user: Omit<User, 'password'>;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  return response.json();
}

export async function register(userData: {
  username: string;
  email: string;
  password: string;
  name: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
}): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  return response.json();
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  } catch (error) {
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}


