import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface SkillData {
  subject: string;
  value: number;
}

interface SkillRadarProps {
  data: SkillData[];
  fixedScale?: boolean;
}

const SkillRadar: React.FC<SkillRadarProps> = ({ data, fixedScale = true }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="70%"
        data={data}
      >
        <PolarGrid gridType="circle" />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis
          angle={30}
          domain={fixedScale ? [0, 100] : undefined}
          tickFormatter={(tick) => Math.round(tick).toString()}
          tickCount={6} // rings at 0, 20, 40, 60, 80, 100
        />
        <Radar
          name="Average"
          dataKey="value"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default SkillRadar;
