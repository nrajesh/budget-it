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
    name: string;
    amount: number;
  };
  formatCurrency: (value: number) => string;
}

export const ActivePieShape: React.FC<ActivePieShapeProps> = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, formatCurrency } = props;
  const { name, amount } = payload;

  // Calculate the position for the text label
  const midAngle = (startAngle + endAngle) / 2;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5} // Slightly larger outer radius for active state
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="white"
        strokeWidth={2}
      />
      <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name}: ${formatCurrency(amount)}`}
      </text>
    </g>
  );
};