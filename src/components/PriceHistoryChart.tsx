"use client";

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

interface PriceHistoryChartProps {
    data: {
        date: string;
        price: number;
        retailer?: string;
    }[];
    currentPrice: number;
    averagePrice: number;
    allTimeLow: number;
    allTimeHigh: number;
}

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
                {payload[0].payload.retailer && (
                    <p className="text-xs text-gray-400">{payload[0].payload.retailer}</p>
                )}
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
    // Determine price range for Y axis
    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices, allTimeLow) * 0.95;
    const maxPrice = Math.max(...prices, allTimeHigh) * 1.05;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Price History
                </h3>
                <div className="flex gap-2">
                    {["1M", "3M", "1Y", "5Y"].map((period, idx) => (
                        <button
                            key={period}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${idx === 3
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

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
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[minPrice, maxPrice]}
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `£${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Average price reference line */}
                        <ReferenceLine
                            y={averagePrice}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            label={{
                                value: "Avg",
                                position: "right",
                                fontSize: 12,
                                fill: "#f59e0b",
                            }}
                        />

                        {/* All-time low reference line */}
                        <ReferenceLine
                            y={allTimeLow}
                            stroke="#10b981"
                            strokeDasharray="5 5"
                        />

                        {/* Price line */}
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: "#10b981",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-emerald-500"></div>
                    <span>Price History</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 border-t-2 border-dashed border-amber-500"></div>
                    <span>Average Price</span>
                </div>
            </div>
        </div>
    );
}
