/**
 * Order API functions.
 * Maps to: api/orders/
 */

import { api } from "./client";
import type { Order, PlaceOrderRequest } from "../types";

export async function placeOrder(data: PlaceOrderRequest): Promise<Order> {
    const response = await api.post<{ message: string; order: Order }>("/api/orders/place/", data);
    return response.order;
}

export async function getOrderDetail(orderId: number): Promise<Order> {
    return api.get<Order>(`/api/orders/${orderId}/`);
}

export async function getOrderHistory(): Promise<Order[]> {
    return api.get<Order[]>("/api/orders/history/");
}

export async function getDetailedOrderHistory(): Promise<Order[]> {
    return api.get<Order[]>("/api/orders/history/detailed/");
}

export async function getPreviousOrder(): Promise<Order | null> {
    try {
        return await api.get<Order>("/api/orders/previous-order/");
    } catch {
        return null;
    }
}

export async function requestCancelOrder(orderId: number): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/cancel/`);
}

export async function rateOrder(
    orderId: number,
    ratings: { dishId: number; rating: number }[],
): Promise<unknown> {
    return api.post(`/api/orders/${orderId}/rate/`, { ratings });
}

// Manager endpoints
export async function getPendingOrders(): Promise<Order[]> {
    return api.get<Order[]>("/api/orders/pending/");
}

export async function getActiveOrders(): Promise<Order[]> {
    return api.get<Order[]>("/api/orders/active/");
}

export async function acceptOrder(orderId: number): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/accept/`);
}

export async function rejectOrder(
    orderId: number,
    reason: string,
): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/reject/`, { reason });
}

export async function markReady(orderId: number): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/ready/`);
}

export async function markCompleted(orderId: number): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/complete/`);
}

export async function approveCancelOrder(orderId: number): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/approve-cancel/`);
}

export async function rejectCancelOrder(
    orderId: number,
    reason: string,
): Promise<Order> {
    return api.post<Order>(`/api/orders/${orderId}/reject-cancel/`, { reason });
}
