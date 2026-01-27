"use client";

import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
    placeholder?: string;
    className?: string;
    size?: "default" | "large";
    initialQuery?: string;
}

const SEARCH_HISTORY_KEY = "dealping_search_history";
const MAX_HISTORY_ITEMS = 5;

// Get search history from local storage
function getSearchHistory(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch {
        return [];
    }
}

// Save search to history
function saveToHistory(query: string): void {
    if (typeof window === "undefined") return;
    try {
        const history = getSearchHistory();
        // Remove if already exists (to move to top)
        const filtered = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
        // Add to beginning
        const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
        // Ignore storage errors
    }
}

// Remove item from history
function removeFromHistory(query: string): string[] {
    if (typeof window === "undefined") return [];
    try {
        const history = getSearchHistory();
        const newHistory = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    } catch {
        return [];
    }
}

export default function SearchBar({
    placeholder = "Search for any product...",
    className = "",
    size = "default",
    initialQuery = "",
}: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load history on mount
    useEffect(() => {
        setHistory(getSearchHistory());
    }, []);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowHistory(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            saveToHistory(query.trim());
            setShowHistory(false);
            // Use window.location for full page reload to fetch fresh server data
            window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
        }
    };

    const handleHistoryClick = (item: string) => {
        setQuery(item);
        saveToHistory(item);
        setShowHistory(false);
        window.location.href = `/search?q=${encodeURIComponent(item)}`;
    };

    const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
        e.stopPropagation();
        const newHistory = removeFromHistory(item);
        setHistory(newHistory);
    };

    const handleClearHistory = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(SEARCH_HISTORY_KEY);
            setHistory([]);
        }
    };

    const sizeClasses = size === "large"
        ? "h-16 text-lg pl-14 pr-6"
        : "h-12 text-base pl-12 pr-4";

    const iconSize = size === "large" ? "w-6 h-6 left-5" : "w-5 h-5 left-4";

    // Filter history based on current query
    const filteredHistory = query.trim()
        ? history.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        : history;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit}>
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
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowHistory(true)}
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

            {/* Search history dropdown */}
            {showHistory && filteredHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 dark:border-gray-700">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Recent Searches
                        </span>
                        <button
                            onClick={handleClearHistory}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            Clear all
                        </button>
                    </div>
                    <ul>
                        {filteredHistory.map((item, index) => (
                            <li key={index}>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleHistoryClick(item)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleHistoryClick(item); }}
                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <svg
                                        className="h-4 w-4 flex-shrink-0 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                                        {item}
                                    </span>
                                    <button
                                        onClick={(e) => handleRemoveHistory(e, item)}
                                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label="Remove from history"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
