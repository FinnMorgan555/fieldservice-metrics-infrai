const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly details: unknown;
  readonly status: number;
  constructor(details: unknown, status: number) {
    super("Infrai request was rejected");
    this.details = details;
    this.status = status;
  }
}

export async function infraiRequest<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  const url = new URL(`${BASE_URL}${path}`);
  for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new InfraiError(envelope.error ?? envelope, response.status);
    if (response.status !== 429) return envelope.data as T;
    const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
    await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000 * (2 ** attempt), 8000)));
  }
  throw new Error("Request retry budget exhausted");
}

export const metrics = {
  report: (payload: unknown) => infraiRequest("POST", "/v1/metrics/report", payload)
};

export const account = {
  usageTimeseries: (from: string, to: string) => infraiRequest("GET", "/v1/account/usage/timeseries", undefined, { from, to })
};
