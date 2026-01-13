import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { InsightCard } from "./InsightCard";
import { Activity } from "lucide-react";

interface MonthlyTrendsProps {
    data: { date: string; amount: number }[];
    currencyFormatter: (value: number) => string;
}

export const MonthlyTrends = ({ data, currencyFormatter }: MonthlyTrendsProps) => {
    return (
        <InsightCard
            title="30 Day Spending Trend"
            className="md:col-span-2 min-h-[300px]"
            icon={<Activity className="w-5 h-5" />}
        >
            <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval={Math.floor(data.length / 5)}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [currencyFormatter(value), "Spent"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill="url(#colorAmount)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </InsightCard>
    );
};
