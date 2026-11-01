export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { fieldErrors?: Record<string, string>; patientCount?: number },
  ) {
    super(message);
  }
}

type QueryValue = string | number | undefined | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
}

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function send(path: string, { method = "GET", body, query }: RequestOptions) {
  let response: Response;
  try {
    response = await fetch(`/api${withQuery(path, query)}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection.");
  }

  if (response.ok) return response;

  const payload = await response.json().catch(() => null);
  const error = payload?.error;
  if (response.status === 401 && !path.startsWith("/auth/login")) {
    window.location.assign("/login");
  }
  throw new ApiError(
    response.status,
    error?.code ?? "UNKNOWN",
    error?.message ?? "Something went wrong. Please try again.",
    error?.details,
  );
}

/** For endpoints that respond with `{ data }`. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()).data as T;
}

/** For list endpoints that respond with `{ data, meta }`. */
export async function apiPage<T>(path: string, query: Record<string, QueryValue>): Promise<T> {
  const response = await send(path, { query });
  return (await response.json()) as T;
}
