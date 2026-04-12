/**
 * useOrderWebSocket — Real-time order updates for the manager dashboard.
 *
 * Opens a WebSocket connection to ws://<host>:8000/ws/orders/ and
 * dispatches incoming events to the provided callbacks.
 *
 * Features:
 *   - Automatic reconnection with exponential backoff (1s → 30s max)
 *   - Connection status tracking (connecting / connected / disconnected)
 *   - Clean teardown on unmount
 *
 * Only used by the OwnerDashboard — managers only (~15 connections).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { Order } from "../types";
import { API_BASE } from "../api/client";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseOrderWebSocketOptions {
    /** Called when a customer places a new order at the manager's canteen. */
    onNewOrder?: (order: Order) => void;
    /** Called when an existing order changes status. */
    onOrderUpdate?: (order: Order) => void;
}

// snake_case → camelCase transformer (mirrors api/client.ts)
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(transformKeys);
    if (obj !== null && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            result[toCamelCase(key)] = transformKeys(value);
        }
        return result;
    }
    return obj;
}

export function useOrderWebSocket({
    onNewOrder,
    onOrderUpdate,
}: UseOrderWebSocketOptions) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectDelay = useRef(1000); // Start at 1s
    const mountedRef = useRef(true);

    // Store latest callbacks in refs so reconnect logic always uses current ones
    const onNewOrderRef = useRef(onNewOrder);
    const onOrderUpdateRef = useRef(onOrderUpdate);
    onNewOrderRef.current = onNewOrder;
    onOrderUpdateRef.current = onOrderUpdate;

    const connect = useCallback(() => {
        if (!mountedRef.current) return;

        // Build WS URL from the HTTP API_BASE
        const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws/orders/";

        setStatus("connecting");

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) return;
            setStatus("connected");
            reconnectDelay.current = 1000; // Reset backoff on success
            console.log("[WS] Connected to", wsUrl);
        };

        ws.onmessage = (event) => {
            if (!mountedRef.current) return;
            try {
                const raw = JSON.parse(event.data);
                const data = transformKeys(raw) as {
                    type: string;
                    order: Order;
                };

                if (data.type === "new_order" && onNewOrderRef.current) {
                    onNewOrderRef.current(data.order);
                } else if (data.type === "order_update" && onOrderUpdateRef.current) {
                    onOrderUpdateRef.current(data.order);
                }
            } catch (err) {
                console.error("[WS] Failed to parse message:", err);
            }
        };

        ws.onclose = (event) => {
            if (!mountedRef.current) return;
            setStatus("disconnected");
            console.log("[WS] Disconnected, code:", event.code);

            // Auto-reconnect with exponential backoff
            const delay = reconnectDelay.current;
            reconnectDelay.current = Math.min(delay * 2, 30000); // Max 30s
            console.log(`[WS] Reconnecting in ${delay}ms...`);
            reconnectTimer.current = setTimeout(connect, delay);
        };

        ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            ws.close(); // Will trigger onclose → reconnect
        };
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        connect();

        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent reconnect on unmount
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { status };
}
