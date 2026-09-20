import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { PieChart as PieIcon, ShieldCheck, Check, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { DECISION_OUTCOME_DATA } from '../../data/analyticsData';

interface DecisionBreakdownDonutProps {
  reducedMotion?: boolean;
}

// Active shape renderer with subtle outward expansion on hover
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#131316"
        strokeWidth={3}
      />
    </g>
  );
};

export const DecisionBreakdownDonut: React.FC<DecisionBreakdownDonutProps> = ({
  reducedMotion = false,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const activeItem = DECISION_OUTCOME_DATA[activeIndex] || DECISION_OUTCOME_DATA[0];

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
            <PieIcon className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white">
            Decision Outcome Distribution
          </h2>
        </div>
        <p className="text-xs text-[#828296]">
          Autonomous triage resolution breakdown across all 1.48M processed authorizations.
        </p>
      </div>

      {/* Chart & Center Label */}
      <div className="relative w-full h-56 sm:h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DECISION_OUTCOME_DATA}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={3}
              dataKey="value"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              isAnimationActive={!reducedMotion}
              animationDuration={850}
              animationEasing="ease-out"
            >
              {DECISION_OUTCOME_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#131316"
                  strokeWidth={2}
                  className="cursor-pointer transition-transform duration-200"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[10px] uppercase tracking-wider font-mono text-[#8E8EA2]">
            {activeItem.name}
          </span>
          <span
            className="text-2xl font-bold font-heading tracking-tight"
            style={{ color: activeItem.color }}
          >
            {activeItem.value}%
          </span>
          <span className="text-[10px] font-mono text-[#6E6E82]">
            {activeItem.count.toLocaleString()} txns
          </span>
        </div>
      </div>

      {/* Interactive Legend with hover link */}
      <div className="space-y-1.5 pt-2 border-t border-[#1E1E26]">
        {DECISION_OUTCOME_DATA.map((item, index) => {
          const isSelected = activeIndex === index;
          return (
            <div
              key={item.key}
              onMouseEnter={() => setActiveIndex(index)}
              className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#1C1C26] border border-[#2F2F3E] text-white shadow-xs'
                  : 'hover:bg-[#16161E] text-[#8C8CA0]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium truncate text-xs">{item.name}</span>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                <span className="text-[#6E6E82] hidden sm:inline">
                  {item.count.toLocaleString()}
                </span>
                <span
                  className="font-bold px-1.5 py-0.5 rounded text-[11px]"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  {item.value}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
