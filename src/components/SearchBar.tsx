"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
    placeholder?: string;
    className?: string;
    size?: "default" | "large";
}

export default function SearchBar({
    placeholder = "Search for any product...",
    className = "",
    size = "default",
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const sizeClasses = size === "large"
        ? "h-16 text-lg pl-14 pr-6"
        : "h-12 text-base pl-12 pr-4";

    const iconSize = size === "large" ? "w-6 h-6 left-5" : "w-5 h-5 left-4";

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <div className="relative">
                {/* Search icon */}
                <svg
                    className={`absolute ${iconSize} top-1/2 -translate-y-1/2 text-gray-400`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${sizeClasses} rounded-full border border-gray-200 bg-white shadow-sm 
            focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
            dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
            dark:focus:border-emerald-400`}
                />

                {/* Search button */}
                <button
                    type="submit"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500 
            px-4 ${size === "large" ? "py-2.5" : "py-2"} font-medium text-white 
            hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                >
                    Search
                </button>
            </div>
        </form>
    );
}
