// src/components/dashboard/RecentTable.jsx
import React from "react";

export default function RecentTable({ data = [], type = "orders", columns = [] }) {
    if (!data || data.length === 0) {
        return <div className="text-center py-8 text-gray-500">No hay registros recientes</div>;
    }

    if (type === "orders") {
        return (
            <div className="space-y-3">
                {data.map(row => (
                    <div key={row.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <div className="font-medium">#{row.id}</div>
                            <div className="text-sm text-gray-500">{row.user?.full_name || row.user?.email}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold">S/ {Number(row.total_amount || 0).toFixed(2)}</div>
                            <div className="text-sm text-gray-500">{row.status}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === "consultants") {
        return (
            <div className="space-y-3">
                {data.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <div className="font-medium">{c.full_name}</div>
                            <div className="text-sm text-gray-500">{c.phone}</div>
                        </div>
                        <div className="text-sm text-gray-500">{c.contract_date ? new Date(c.contract_date).toLocaleDateString() : "—"}</div>
                    </div>
                ))}
            </div>
        );
    }

    // fallback render generic rows
    return (
        <div className="space-y-3">
            {data.map((r, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded">
                    <pre className="text-xs">{JSON.stringify(r, null, 2)}</pre>
                </div>
            ))}
        </div>
    );
}
