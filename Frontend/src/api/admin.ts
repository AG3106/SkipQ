/**
 * Admin API functions.
 * Maps to: api/admin/
 */

import { api, buildFileUrl } from "./client";
import type { Canteen } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanteenRequestDocuments {
    aadharCard: string | null;
    hallApprovalForm: string | null;
}

export interface CanteenRequest extends Canteen {
    documents: CanteenRequestDocuments;
}

export interface PendingManagerRegistration {
    id: number;
    email: string;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
}

export interface ApproveRejectResponse {
    message: string;
    canteen: Canteen;
}

// ---------------------------------------------------------------------------
// Canteen requests
// ---------------------------------------------------------------------------

export async function fetchCanteenRequests(): Promise<CanteenRequest[]> {
    return api.get<CanteenRequest[]>("/api/admin/canteen-requests/");
}

export async function approveCanteen(canteenId: number): Promise<ApproveRejectResponse> {
    return api.post<ApproveRejectResponse>(
        `/api/admin/canteen-requests/${canteenId}/approve/`,
    );
}

export async function rejectCanteen(
    canteenId: number,
    reason: string,
): Promise<ApproveRejectResponse> {
    return api.post<ApproveRejectResponse>(
        `/api/admin/canteen-requests/${canteenId}/reject/`,
        { reason },
    );
}

// ---------------------------------------------------------------------------
// Manager registrations
// ---------------------------------------------------------------------------

export async function fetchManagerRegistrations(): Promise<PendingManagerRegistration[]> {
    return api.get<PendingManagerRegistration[]>("/api/admin/manager-registrations/");
}

export async function approveManager(
    registrationId: number,
): Promise<{ message: string }> {
    return api.post<{ message: string }>(
        `/api/admin/manager-registrations/${registrationId}/approve/`,
    );
}

export async function rejectManager(
    registrationId: number,
    reason: string,
): Promise<{ message: string }> {
    return api.post<{ message: string }>(
        `/api/admin/manager-registrations/${registrationId}/reject/`,
        { reason },
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export { buildFileUrl };
