import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * LineChart component for visualizing data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to visualize
 * @param {Array} props.lines - Line configurations
 * @param {string} props.xAxisDataKey - Data key for the X axis
 * @param {string} props.yAxisLabel - Label for the Y axis
 * @param {string} props.xAxisLabel - Label for the X axis
 * @param {string} props.title - Chart title
 * @param {boolean} props.connectNulls - Whether to connect lines over null values
 * @param {boolean} props.showGrid - Whether to show the grid
 * @param {string} props.className - Additional CSS classes
 */
const LineChart = ({
  data = [],
  lines = [],
  xAxisDataKey = 'name',
  yAxisLabel,
  xAxisLabel,
  title,
  connectNulls = false,
  showGrid = true,
  className,
}) => {
  // Default colors if not provided in lines config
  const defaultColors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
  ];

  // Ensure lines have colors
  const linesWithColors = lines.map((line, index) => ({
    ...line,
    color: line.color || defaultColors[index % defaultColors.length],
    type: line.type || 'monotone',
    strokeWidth: line.strokeWidth || 2,
    dot: line.dot !== undefined ? line.dot : true,
  }));

  return (
    <div className={`w-full ${className || ''}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 40,
            bottom: 40,
          }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          )}
          <XAxis 
            dataKey={xAxisDataKey} 
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : null} 
          />
          <YAxis 
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : null} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }} 
          />
          <Legend />
          {linesWithColors.map((line) => (
            <Line
              key={line.dataKey}
              type={line.type}
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              dot={line.dot}
              activeDot={{ r: 6 }}
              connectNulls={connectNulls}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart; 