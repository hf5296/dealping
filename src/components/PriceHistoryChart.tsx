"use client";

import { useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

interface PriceDataPoint {
    date: string;
    timestamp: number;
    price: number;
    retailer?: string;
}

interface PriceHistoryChartProps {
    data: PriceDataPoint[];
    currentPrice: number;
    averagePrice: number;
    allTimeLow: number;
    allTimeHigh: number;
}

type TimePeriod = "1M" | "3M" | "1Y" | "5Y" | "ALL";

const periodLabels: Record<TimePeriod, string> = {
    "1M": "1 month",
    "3M": "3 months",
    "1Y": "1 year",
    "5Y": "5 years",
    "ALL": "all time",
};

// Custom tooltip component
const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { value: number; payload: { retailer?: string } }[];
    label?: string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-600 dark:bg-gray-800">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    £{payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

export default function PriceHistoryChart({
    data,
    currentPrice,
    averagePrice,
    allTimeLow: _allTimeLow,
    allTimeHigh: _allTimeHigh,
}: PriceHistoryChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("3M");

    // Calculate the age of the oldest data point
    const dataAgeInDays = useMemo(() => {
        if (data.length === 0) return 0;
        const oldestTimestamp = Math.min(...data.map(d => d.timestamp));
        return Math.floor((Date.now() - oldestTimestamp) / (24 * 60 * 60 * 1000));
    }, [data]);

    // Filter data based on selected time period
    const filteredData = useMemo(() => {
        const now = Date.now();
        let cutoffTime: number;

        switch (selectedPeriod) {
            case "1M":
                cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "3M":
                cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case "1Y":
                cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "5Y":
                cutoffTime = now - 5 * 365 * 24 * 60 * 60 * 1000;
                break;
            case "ALL":
            default:
                cutoffTime = 0;
                break;
        }

        const filtered = data.filter((point) => point.timestamp >= cutoffTime);

        // If only 1 point in range, include the last point before the cutoff
        // so Recharts can draw a line instead of a single dot
        if (filtered.length === 1 && cutoffTime > 0) {
            const pointsBefore = data.filter((point) => point.timestamp < cutoffTime);
            if (pointsBefore.length > 0) {
                filtered.unshift(pointsBefore[pointsBefore.length - 1]);
            }
        }

        return filtered;
    }, [data, selectedPeriod]);

    // Compute stats from the actual data to ensure consistency with chart
    const { low, high, avg } = useMemo(() => {
        if (data.length === 0) return { low: currentPrice, high: currentPrice, avg: averagePrice };
        const prices = data.map(d => d.price);
        const dataLow = Math.min(...prices);
        const dataHigh = Math.max(...prices);
        const dataAvg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return {
            low: Math.round(dataLow * 100) / 100,
            high: Math.round(dataHigh * 100) / 100,
            avg: Math.round(dataAvg * 100) / 100,
        };
    }, [data, currentPrice, averagePrice]);

    // Check if selected period exceeds available data
    const periodExceedsData = useMemo(() => {
        const periodDays: Record<TimePeriod, number> = {
            "1M": 30,
            "3M": 90,
            "1Y": 365,
            "5Y": 1825,
            "ALL": Infinity,
        };
        return selectedPeriod !== "ALL" && dataAgeInDays > 0 && periodDays[selectedPeriod] > dataAgeInDays;
    }, [selectedPeriod, dataAgeInDays]);

    // Calculate Y-axis domain with nice round numbers
    const { minPrice, maxPrice, ticks } = useMemo(() => {
        if (filteredData.length === 0) {
            return { minPrice: 0, maxPrice: 100, ticks: [0, 25, 50, 75, 100] };
        }

        const prices = filteredData.map((d) => d.price);
        const dataMin = Math.min(...prices);
        const dataMax = Math.max(...prices);

        // Add some padding
        const range = dataMax - dataMin;
        const padding = range * 0.1 || dataMax * 0.1 || 1;

        let min = Math.max(0, dataMin - padding);
        let max = dataMax + padding;

        // Round to nice numbers
        const niceInterval = (max - min) / 4;
        const magnitude = Math.pow(10, Math.floor(Math.log10(niceInterval)));
        const niceStep = Math.ceil(niceInterval / magnitude) * magnitude;

        min = Math.floor(min / niceStep) * niceStep;
        max = Math.ceil(max / niceStep) * niceStep;

        // Generate 5 ticks
        const tickArray = [];
        for (let i = 0; i <= 4; i++) {
            tickArray.push(min + (max - min) * (i / 4));
        }

        return { minPrice: min, maxPrice: max, ticks: tickArray };
    }, [filteredData]);

    const periods: TimePeriod[] = ["1M", "3M", "1Y", "5Y", "ALL"];

    // Format data age for display
    const dataAgeText = useMemo(() => {
        if (dataAgeInDays < 30) return `${dataAgeInDays} days`;
        if (dataAgeInDays < 365) return `${Math.floor(dataAgeInDays / 30)} months`;
        return `${(dataAgeInDays / 365).toFixed(1)} years`;
    }, [dataAgeInDays]);

    // Price change indicator
    const priceVsAvg = avg > 0 ? ((currentPrice - avg) / avg) * 100 : 0;
    const isBelowAvg = priceVsAvg < -2;
    const isAboveAvg = priceVsAvg > 2;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Price History
                </h3>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-600">
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                                selectedPeriod === period
                                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 py-5">
                {/* Info banner when period exceeds available data */}
                {periodExceedsData && (
                    <div className="mb-4 rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                        Price history only goes back {dataAgeText}. Showing all available data.
                    </div>
                )}

                {/* Stats row */}
                <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                    <div>
                        <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
                            Current
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            £{currentPrice.toFixed(2)}
                        </p>
                        {(isBelowAvg || isAboveAvg) && (
                            <p className={`text-[11px] font-medium ${isBelowAvg ? "text-emerald-600" : "text-red-500"}`}>
                                {isBelowAvg ? `${Math.abs(Math.round(priceVsAvg))}% below avg` : `${Math.round(priceVsAvg)}% above avg`}
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
                            Average
                        </p>
                        <p className="text-lg font-semibold text-amber-500">
                            £{avg.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
                            Lowest
                        </p>
                        <p className="text-lg font-semibold text-emerald-600">
                            £{low.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
                            Highest
                        </p>
                        <p className="text-lg font-semibold text-red-500">
                            £{high.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[280px] w-full border-t border-gray-100 pt-1 dark:border-gray-700">
                    {filteredData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={filteredData}
                                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    horizontal={false}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                                    interval="preserveStartEnd"
                                    minTickGap={60}
                                />
                                <YAxis
                                    domain={[minPrice, maxPrice]}
                                    ticks={ticks}
                                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                                    tickFormatter={(value) => `£${Math.round(value)}`}
                                    width={48}
                                />
                                <Tooltip content={<CustomTooltip />} />

                                {/* Average price reference line */}
                                <ReferenceLine
                                    y={avg}
                                    stroke="#f59e0b"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.6}
                                />

                                {/* Price area + line (green) */}
                                <Area
                                    type="stepAfter"
                                    dataKey="price"
                                    stroke="#10b981"
                                    strokeWidth={1.5}
                                    fill="url(#priceGradient)"
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#10b981",
                                        stroke: "#fff",
                                        strokeWidth: 2,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                            No price data available for this period
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <div className="h-[2px] w-3.5 bg-emerald-500 rounded-full"></div>
                        <span>Price</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-[2px] w-3.5 border-t border-dashed border-amber-500 rounded-full"></div>
                        <span>Average</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
