/**
 * Cake reservation API functions.
 * Maps to: api/cakes/
 */

import { api } from "./client";
import type { CakeReservation, CakeOptions, CakeSizePrice, CakeFlavor } from "../types";

export async function checkCakeAvailability(
    canteenId: number,
    date: string,
): Promise<{ available: boolean; message: string }> {
    return api.post("/api/cakes/check-availability/", { canteenId, date });
}

export async function submitReservation(data: {
    canteenId: number;
    flavor: string;
    size: string;
    design?: string;
    message?: string;
    pickupDate: string;
    pickupTime: string;
    advanceAmount: string;
    walletPin: string;
}): Promise<CakeReservation> {
    return api.post<CakeReservation>("/api/cakes/reserve/", data);
}

export async function getMyReservations(): Promise<CakeReservation[]> {
    return api.get<CakeReservation[]>("/api/cakes/my-reservations/");
}

// Manager endpoints

export async function getManagerAllCakes(): Promise<CakeReservation[]> {
    return api.get<CakeReservation[]>("/api/cakes/manager-all/");
}

export async function getPendingCakes(): Promise<CakeReservation[]> {
    return api.get<CakeReservation[]>("/api/cakes/pending/");
}

export async function acceptCake(reservationId: number): Promise<CakeReservation> {
    return api.post<CakeReservation>(`/api/cakes/${reservationId}/accept/`);
}

export async function rejectCake(
    reservationId: number,
    reason: string,
): Promise<CakeReservation> {
    return api.post<CakeReservation>(`/api/cakes/${reservationId}/reject/`, { rejectionReason: reason });
}

export async function completeCake(reservationId: number): Promise<CakeReservation> {
    return api.post<CakeReservation>(`/api/cakes/${reservationId}/complete/`);
}

export async function cancelCake(reservationId: number): Promise<CakeReservation> {
    return api.post<CakeReservation>(`/api/cakes/${reservationId}/cancel/`);
}

// Cake options — public (per canteen)

export async function getCakeOptions(canteenId: number): Promise<CakeOptions> {
    return api.get<CakeOptions>(`/api/cakes/options/${canteenId}/`);
}

// Manager CRUD — size prices

export async function getManagerSizePrices(): Promise<CakeSizePrice[]> {
    return api.get<CakeSizePrice[]>("/api/cakes/manage/sizes/");
}

export async function createSizePrice(data: { size: string; price: string; isAvailable?: boolean }): Promise<CakeSizePrice> {
    return api.post<CakeSizePrice>("/api/cakes/manage/sizes/", data);
}

export async function updateSizePrice(id: number, data: { size: string; price: string; isAvailable?: boolean }): Promise<CakeSizePrice> {
    return api.patch<CakeSizePrice>(`/api/cakes/manage/sizes/${id}/`, data);
}

export async function deleteSizePrice(id: number): Promise<void> {
    return api.delete(`/api/cakes/manage/sizes/${id}/`);
}

// Manager CRUD — flavors

export async function getManagerFlavors(): Promise<CakeFlavor[]> {
    return api.get<CakeFlavor[]>("/api/cakes/manage/flavors/");
}

export async function createFlavor(data: FormData): Promise<CakeFlavor> {
    return api.upload<CakeFlavor>("/api/cakes/manage/flavors/", data);
}

export async function updateFlavor(id: number, data: FormData): Promise<CakeFlavor> {
    return api.upload<CakeFlavor>(`/api/cakes/manage/flavors/${id}/`, data, "PATCH");
}

export async function deleteFlavor(id: number): Promise<void> {
    return api.delete(`/api/cakes/manage/flavors/${id}/`);
}
