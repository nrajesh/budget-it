"use client";

import React from "react";
import { Sector } from "recharts";

interface ActivePieShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name: string;
    amount: number;
  };
  value: number;
  formatCurrency: (amount: number) => string;
}

export const ActivePieShape = ({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  value,
  formatCurrency,
}: ActivePieShapeProps) => {
  // Increase outerRadius for the expanded effect
  const expandedOuterRadius = outerRadius + 20; // Increased expansion

  return (
    <g>
      {/* Expanded Sector */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={expandedOuterRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-200 ease-out"
      />
      {/* Border for the expanded sector */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={expandedOuterRadius + 2} // Slightly larger for a border effect
        outerRadius={expandedOuterRadius + 6}
        fill={fill}
        className="transition-all duration-200 ease-out opacity-50" // Slightly transparent border
      />

      {/* Centered text for name */}
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#333" className="text-lg font-bold">
        {payload.name}
      </text>
      {/* Centered text for amount */}
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333" className="text-md">
        {formatCurrency(value)}
      </text>
    </g>
  );
};