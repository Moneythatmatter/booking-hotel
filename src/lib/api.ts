import { createClient } from "./supabase";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let leaving = false;

async function leaveForLogin() {
  if (leaving || typeof window === "undefined") return;
  leaving = true;
  try {
    await createClient().auth.signOut();
  } catch {
    // The session is already unusable.
  }
  window.location.assign("/admin/login");
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function api<T>(path: string, options: { method?: string; token?: string | null; body?: unknown } = {}) {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "The booking service is unavailable. Check that the API is running.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && options.token) {
      await leaveForLogin();
      return new Promise<T>(() => {});
    }
    throw new ApiError(response.status, payload?.error?.message ?? "Request failed.");
  }
  return payload as T;
}
