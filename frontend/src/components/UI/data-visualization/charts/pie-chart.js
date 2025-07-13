import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * PieChart component for visualizing data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to visualize
 * @param {string} props.dataKey - Data key for the values
 * @param {string} props.nameKey - Data key for the names
 * @param {Array} props.colors - Colors for the pie slices
 * @param {string} props.title - Chart title
 * @param {boolean} props.donut - Whether to render as a donut chart
 * @param {number} props.innerRadius - Inner radius for donut charts
 * @param {number} props.outerRadius - Outer radius for the chart
 * @param {string} props.className - Additional CSS classes
 */
const PieChart = ({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  colors,
  title,
  donut = false,
  innerRadius = 60,
  outerRadius = 80,
  className,
}) => {
  // Default colors if not provided
  const defaultColors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f43f5e', // rose-500
    '#14b8a6', // teal-500
    '#8b5cf6', // violet-500
  ];

  // Use provided colors or defaults
  const pieColors = colors || defaultColors;

  return (
    <div className={`w-full ${className || ''}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart
          margin={{
            top: 20,
            right: 30,
            left: 30,
            bottom: 20,
          }}
        >
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={outerRadius}
            innerRadius={donut ? innerRadius : 0}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={pieColors[index % pieColors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => value}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }} 
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart; 