/**
 * Centralized API client for SkipQ backend.
 *
 * - Base URL: http://localhost:8000
 * - Session-based auth via cookies (credentials: "include")
 * - Automatic snake_case → camelCase response transformation
 * - Structured error handling
 */

export const API_BASE = `http://${window.location.hostname}:8000`;

// ---------------------------------------------------------------------------
// snake_case → camelCase transformer
// ---------------------------------------------------------------------------

function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(transformKeys);
    if (obj !== null && typeof obj === "object" && !(obj instanceof File)) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            result[toCamelCase(key)] = transformKeys(value);
        }
        return result;
    }
    return obj;
}

// camelCase → snake_case for request bodies
function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeysToSnake(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(transformKeysToSnake);
    if (obj !== null && typeof obj === "object" && !(obj instanceof File)) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            result[toSnakeCase(key)] = transformKeysToSnake(value);
        }
        return result;
    }
    return obj;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ApiError extends Error {
    status: number;
    data: Record<string, unknown>;

    constructor(status: number, data: Record<string, unknown>) {
        const message =
            typeof data.detail === "string"
                ? data.detail
                : typeof data.error === "string"
                    ? data.error
                    : `Request failed with status ${status}`;
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

// ---------------------------------------------------------------------------
// CSRF token helper
// ---------------------------------------------------------------------------

function getCsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    isFormData?: boolean;
}

export async function apiRequest<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
): Promise<T> {
    const { method = "GET", body, headers = {}, isFormData = false } = options;

    const url = `${API_BASE}${endpoint}`;

    const fetchOptions: RequestInit = {
        method,
        credentials: "include", // session cookies
        headers: {
            ...headers,
        },
    };

    // Send CSRF token on unsafe methods
    if (method !== "GET" && method !== "HEAD") {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            (fetchOptions.headers as Record<string, string>)["X-CSRFToken"] = csrfToken;
        }
    }

    if (body) {
        if (isFormData) {
            // Let browser set Content-Type with boundary for FormData
            fetchOptions.body = body as FormData;
        } else {
            (fetchOptions.headers as Record<string, string>)["Content-Type"] =
                "application/json";
            fetchOptions.body = JSON.stringify(transformKeysToSnake(body));
        }
    }

    const response = await fetch(url, fetchOptions);

    // No content
    if (response.status === 204) return undefined as T;

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        if (!response.ok) throw new ApiError(response.status, { detail: response.statusText });
        return undefined as T;
    }

    if (!response.ok) {
        throw new ApiError(
            response.status,
            (typeof data === "object" && data !== null ? data : { detail: String(data) }) as Record<string, unknown>,
        );
    }

    return transformKeys(data) as T;
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

export const api = {
    get: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint),

    post: <T = unknown>(endpoint: string, body?: unknown) =>
        apiRequest<T>(endpoint, { method: "POST", body }),

    patch: <T = unknown>(endpoint: string, body?: unknown) =>
        apiRequest<T>(endpoint, { method: "PATCH", body }),

    delete: <T = unknown>(endpoint: string, body?: unknown) =>
        apiRequest<T>(endpoint, { method: "DELETE", body }),

    upload: <T = unknown>(endpoint: string, formData: FormData, method = "POST") =>
        apiRequest<T>(endpoint, { method, body: formData, isFormData: true }),
};

/**
 * Build full URL for backend-served files (images, documents).
 * Example: buildFileUrl("/files/canteen_images/3.jpg") → "http://localhost:8000/files/canteen_images/3.jpg"
 */
export function buildFileUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return `${API_BASE}${path}`;
}
