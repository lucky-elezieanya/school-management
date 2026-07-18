"use client";

import { ChartSnapshot } from "@/app/types/result-snapshot";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  chart: ChartSnapshot;
}

export default function PerformanceChart({ chart }: Props) {
  return (
    <div
      className="
        border
        border-[#555]
        p-2
        mt-2
      "
    >
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chart.data}
            margin={{
              top: 25,
              right: 15,
              left: 0,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="subjectCode"
              interval={0}
              angle={0}
              tick={{ fontSize: 8 }}
              height={22}
            />

            <YAxis fontSize={9} />

            <Tooltip
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.subject ?? ""
              }
            />

            <Legend
              verticalAlign="top"
              align="center"
              wrapperStyle={{
                fontSize: 11,
                paddingBottom: 8,
              }}
            />

            <Bar
              dataKey="student"
              name="Subject Score"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
            />

            <Bar
              dataKey="average"
              name="Average"
              fill="#7c3aed"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
