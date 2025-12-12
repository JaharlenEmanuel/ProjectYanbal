// src/components/dashboard/SalesChart.jsx
import React from "react";

/**
 * data: [{ date: 'YYYY-MM-DD', value: number }, ...] length 30
 */
export default function SalesChart({ data = [] }) {
    if (!data || data.length === 0) {
        return <div className="py-8 text-center text-gray-500">No hay datos de ventas</div>;
    }

    const max = Math.max(...data.map(d => d.value), 1);

    return (
        <div>
            <div className="flex items-end gap-2 h-48">
                {data.map((d, idx) => {
                    const height = (d.value / max) * 100; // percent
                    const label = new Date(d.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
                    return (
                        <div key={d.date} className="flex-1 flex flex-col items-center">
                            <div
                                title={`S/ ${d.value.toFixed(2)}`}
                                style={{ height: `${Math.max(6, height)}%` }}
                                className="w-full max-w-[26px] rounded-t-md bg-linear-to-t from-purple-500 to-purple-300"
                            />
                            <div className="text-xs mt-2 text-gray-500">{label}</div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 text-sm text-gray-500">Ventas diarias</div>
        </div>
    );
}
