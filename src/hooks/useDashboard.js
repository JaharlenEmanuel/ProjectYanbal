// src/hooks/useDashboard.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../config/supabase";


export function useDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1) summary: your admin_dashboard view
            const { data: summary, error: summaryErr } = await supabase
                .from("admin_dashboard")
                .select("*")
                .single();

            if (summaryErr && summaryErr.code !== "PGRST116") {
                // PGRST116 or other code might happen if view missing — still continue
                console.warn("admin_dashboard returned error:", summaryErr);
            }

            const summaryData = summary || {};

            // 2) recent orders (reservations) join profile
            const { data: recentOrders = [], error: roErr } = await supabase
                .from("reservations")
                .select("id, total_amount, status, created_at, user: user_profile_id (id, full_name, email)")
                .order("created_at", { ascending: false })
                .limit(6);

            if (roErr) console.warn("recent orders err", roErr);

            // 3) recent consultants
            const { data: recentConsultants = [], error: rcErr } = await supabase
                .from("consultants")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(6);

            if (rcErr) console.warn("recent consultants err", rcErr);

            // 4) low stock products (threshold 5)
            const STOCK_THRESHOLD = 5;
            const { data: lowStockProducts = [], error: lowErr } = await supabase
                .from("products")
                .select("id, name, stock")
                .lt("stock", STOCK_THRESHOLD)
                .order("stock", { ascending: true })
                .limit(8);

            if (lowErr) console.warn("low stock err", lowErr);

            // 5) sales data for last 30 days (sum reservations.total_amount by day)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // include today -> 30 days
            const fromISO = thirtyDaysAgo.toISOString();

            const { data: salesRows = [], error: salesErr } = await supabase
                .from("reservations")
                .select("created_at, total_amount")
                .gte("created_at", fromISO);

            if (salesErr) console.warn("salesErr", salesErr);

            // Aggregate salesRows into array of 30 days
            const dateMap = new Map();
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
                dateMap.set(key, 0);
            }

            for (const r of salesRows) {
                const key = new Date(r.created_at).toISOString().slice(0, 10);
                if (dateMap.has(key)) dateMap.set(key, dateMap.get(key) + Number(r.total_amount || 0));
            }

            const salesArray = Array.from(dateMap.entries()).map(([date, value]) => ({
                date,
                value,
            }));

            // prepare dashboardData combined
            const combined = {
                ...summaryData,
                recentOrders,
                recentConsultants,
                lowStockProducts,
                ventas_mes_actual: summaryData.ventas_mes_actual ?? salesArray.reduce((s, x) => s + x.value, 0),
                total_ventas: summaryData.total_ventas ?? salesArray.reduce((s, x) => s + x.value, 0),
            };

            setDashboardData(combined);
            setSalesData(salesArray);
        } catch (e) {
            console.error("useDashboard error:", e);
            setError("Error obteniendo datos del dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    return {
        dashboardData,
        salesData,
        loading,
        error,
        refreshData: loadAll,
    };
}
