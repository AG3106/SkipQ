/**
 * Canteen & menu API functions.
 * Maps to: api/canteens/
 */

import { api } from "./client";
import type { Canteen, Dish, PopularDish } from "../types";

export async function listCanteens(): Promise<Canteen[]> {
    return api.get<Canteen[]>("/api/canteens/");
}

export async function getCanteenDetail(canteenId: number): Promise<Canteen> {
    return api.get<Canteen>(`/api/canteens/${canteenId}/`);
}

export async function getCanteenMenu(canteenId: number): Promise<Dish[]> {
    return api.get<Dish[]>(`/api/canteens/${canteenId}/menu/`);
}

export async function getPopularDishes(): Promise<PopularDish[]> {
    return api.get<PopularDish[]>("/api/canteens/dishes/popular/");
}

export async function getCanteenPopularDishes(
    canteenId: number,
): Promise<PopularDish[]> {
    return api.get<PopularDish[]>(
        `/api/canteens/${canteenId}/menu/popular/`,
    );
}

export async function getEstimatedWaitTime(
    canteenId: number,
): Promise<{ estimatedWaitTime: string }> {
    return api.get(`/api/canteens/${canteenId}/wait-time/`);
}

// Manager endpoints

export async function getManagerDashboard(): Promise<{
    canteen: Canteen;
    earnings: {
        totalRevenue: string;
        completedOrders: number;
    };
    queue: {
        pendingOrders: number;
        activeOrders: number;
        estimatedWaitMinutes: string;
    };
}> {
    return api.get("/api/canteens/manager/dashboard/");
}

export async function addDish(
    canteenId: number,
    data: FormData,
): Promise<Dish> {
    return api.upload<Dish>(`/api/canteens/${canteenId}/menu/add/`, data);
}

export async function updateDish(
    dishId: number,
    data: Partial<{ name: string; price: string; description: string; category: string; isVeg: boolean; isAvailable: boolean }>,
): Promise<Dish> {
    return api.patch<Dish>(`/api/canteens/dishes/${dishId}/`, data);
}

export async function deleteDish(dishId: number): Promise<void> {
    await api.delete(`/api/canteens/dishes/${dishId}/`);
}

export async function toggleDishAvailability(dishId: number): Promise<Dish> {
    return api.post<Dish>(`/api/canteens/dishes/${dishId}/toggle/`);
}

export async function registerCanteen(data: FormData): Promise<{ message: string; canteen: Canteen }> {
    return api.upload<{ message: string; canteen: Canteen }>("/api/canteens/register/", data);
}

export async function updateCanteenImage(
    canteenId: number,
    imageFile: File,
): Promise<Canteen> {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.upload<Canteen>(`/api/canteens/${canteenId}/image/`, formData, "PATCH");
}

// Timings update

export async function updateCanteenTimings(
    canteenId: number,
    data: { openingTime?: string; closingTime?: string },
): Promise<Canteen> {
    return api.patch<Canteen>(`/api/canteens/${canteenId}/timings/`, data);
}

// Holiday management

export async function getHolidays(canteenId: number): Promise<{ id: number; date: string; description: string }[]> {
    return api.get(`/api/canteens/${canteenId}/holidays/`);
}

export async function addHoliday(canteenId: number, date: string, description: string): Promise<{ id: number; date: string; description: string }> {
    return api.post(`/api/canteens/${canteenId}/holidays/`, { date, description });
}

export async function deleteHoliday(canteenId: number, date: string): Promise<void> {
    await api.delete(`/api/canteens/${canteenId}/holidays/`, { date });
}

// Analytics endpoints

export interface MonthlyBreakdown {
    month: string;
    revenue: string;
    orderCount: number;
}

export interface DishFrequency {
    dishId: number;
    dishName: string;
    totalOrdered: number;
}

export interface DishRevenue {
    dishId: number;
    dishName: string;
    totalOrdered: number;
    revenue: string;
}

export async function getManagerAnalytics(year?: number): Promise<{
    canteenId: number;
    canteenName: string;
    yearFilter: number | null;
    monthlyBreakdown: MonthlyBreakdown[];
}> {
    const params = year ? `?year=${year}` : "";
    return api.get(`/api/canteens/manager/analytics/${params}`);
}

export async function getManagerDishAnalytics(): Promise<{
    canteenId: number;
    canteenName: string;
    period: string;
    dishFrequency: DishFrequency[];
    top5ByFrequency: DishFrequency[];
    top5ByRevenue: DishRevenue[];
}> {
    return api.get("/api/canteens/manager/dish-analytics/");
}

export async function getManagerMonthlyRevenue(year: number, month: number): Promise<{
    canteenId: number;
    canteenName: string;
    year: number;
    month: number;
    dishes: { dishId: number; dishName: string; quantitySold: number; revenue: string }[];
    totalRevenue: string;
}> {
    return api.get(`/api/canteens/manager/monthly-revenue/?year=${year}&month=${month}`);
}
