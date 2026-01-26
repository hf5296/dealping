"use client";

import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
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
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-1 text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-emerald-600">
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
    allTimeLow,
    allTimeHigh,
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

        return data.filter((point) => point.timestamp >= cutoffTime);
    }, [data, selectedPeriod]);

    // Check if selected period exceeds available data
    const periodExceedsData = useMemo(() => {
        const periodDays: Record<TimePeriod, number> = {
            "1M": 30,
            "3M": 90,
            "1Y": 365,
            "5Y": 1825,
            "ALL": Infinity,
        };
        return selectedPeriod !== "ALL" && periodDays[selectedPeriod] > dataAgeInDays;
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

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Price History
                </h3>
                <div className="flex gap-2">
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                selectedPeriod === period
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Info banner when period exceeds available data */}
            {periodExceedsData && (
                <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    <span className="font-medium">Note:</span> Price history for this product only goes back {dataAgeText}.
                    Showing all available data.
                </div>
            )}

            {/* Stats row */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-500">Current</p>
                    <p className="text-xl font-bold text-emerald-600">
                        £{currentPrice.toFixed(2)}
                    </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-500">Average</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                        £{averagePrice.toFixed(2)}
                    </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                    <p className="text-xs font-medium uppercase text-emerald-600">
                        All-Time Low
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                        £{allTimeLow.toFixed(2)}
                    </p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="text-xs font-medium uppercase text-red-500">
                        All-Time High
                    </p>
                    <p className="text-xl font-bold text-red-500">
                        £{allTimeHigh.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full">
                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={filteredData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151"
                                strokeOpacity={0.2}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={50}
                            />
                            <YAxis
                                domain={[minPrice, maxPrice]}
                                ticks={ticks}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `£${Math.round(value)}`}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Average price reference line */}
                            <ReferenceLine
                                y={averagePrice}
                                stroke="#f59e0b"
                                strokeDasharray="5 5"
                                strokeOpacity={0.7}
                            />

                            {/* Price line */}
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    fill: "#10b981",
                                    stroke: "#fff",
                                    strokeWidth: 2,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        No price data available for this period
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-emerald-500"></div>
                    <span>Price</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 border-t-2 border-dashed border-amber-500"></div>
                    <span>Average</span>
                </div>
            </div>
        </div>
    );
}
