const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "request failed");
  return data;
}

export const api = {
  auth: {
    register: (body: unknown) => request("/auth/register", { method: "POST", body }),
    login: (body: unknown) => request("/auth/login", { method: "POST", body }),
    me: (token: string) => request("/auth/me", { token }),
  },
  accounts: {
    list: (token: string) => request("/accounts", { token }),
    get: (id: string, token: string) => request(`/accounts/${id}`, { token }),
    create: (body: unknown, token: string) => request("/accounts", { method: "POST", body, token }),
  },
  transactions: {
    history: (accountId: string, token: string, page = 1, limit = 20) =>
      request(`/transactions?account_id=${accountId}&page=${page}&limit=${limit}`, { token }),
    get: (id: string, token: string) => request(`/transactions/${id}`, { token }),
    transfer: (body: unknown, token: string) =>
      request("/transactions/transfer", { method: "POST", body, token }),
    deposit: (body: unknown, token: string) =>
      request("/transactions/deposit", { method: "POST", body, token }),
    withdraw: (body: unknown, token: string) =>
      request("/transactions/withdraw", { method: "POST", body, token }),
  },
};
