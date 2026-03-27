/**
 * Cake reservation API functions.
 * Maps to: api/cakes/
 */

import { api } from "./client";
import type { CakeReservation } from "../types";

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
