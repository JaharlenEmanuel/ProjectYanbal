// src/components/Spinner.jsx
import React from "react";

export default function Spinner() {
    return (
        <div className="w-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
    );
}
