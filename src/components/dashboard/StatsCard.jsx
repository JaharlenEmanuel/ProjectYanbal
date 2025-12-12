// src/components/dashboard/StatsCard.jsx
import React from "react";

const iconBg = {
    blue: "bg-indigo-100",
    green: "bg-emerald-100",
    purple: "bg-purple-100",
    orange: "bg-amber-100",
};

export default function StatsCard({ title, value, icon = "📊", color = "blue" }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <div className="text-sm text-gray-500">{title}</div>
                <div className="text-2xl font-bold mt-2">{value}</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg[color] || "bg-indigo-100"}`}>
                <div className="text-2xl">{icon}</div>
            </div>
        </div>
    );
}
