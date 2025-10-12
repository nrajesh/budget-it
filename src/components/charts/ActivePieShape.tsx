"use client";

import React from 'react';
import { Sector } from 'recharts';

interface ActivePieShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name?: string; // For categories/vendors in CategoryPieChart
    category?: string; // For SpendingCategoriesChart
    vendor?: string; // For SpendingByVendorChart
    amount: number;
  };
  formatCurrency: (value: number) => string;
  onCenterClick: () => void; // To reset activeIndex by clicking center
}

export const ActivePieShape = (props: ActivePieShapeProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, formatCurrency, onCenterClick } = props;
  const name = payload.name || payload.category || payload.vendor;
  const amount = payload.amount;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-200 ease-in-out"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-200 ease-in-out"
      />
      {name && (
        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fill="#333" className="font-bold text-lg">
          {name}
        </text>
      )}
      <text x={cx} y={cy + 15} textAnchor="middle" dominantBaseline="central" fill="#666" className="text-md">
        {formatCurrency(amount)}
      </text>
      {/* Invisible circle in the center to capture clicks for resetting */}
      <circle
        cx={cx}
        cy={cy}
        r={innerRadius} // Use innerRadius to cover the center area
        fill="transparent"
        onClick={onCenterClick}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
};