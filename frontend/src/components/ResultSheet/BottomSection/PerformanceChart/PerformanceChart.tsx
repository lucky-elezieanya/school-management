"use client";

import { SubjectResult } from "@/app/types/result-snapshot";
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
  subjects: SubjectResult[];
}

export default function PerformanceChart({ subjects }: Props) {
  const chartData = subjects.map((subject) => ({
    subject: subject.subjectName,
    subjectCode: subject.subjectCode,
    student: subject.totalScore,
    average: subject.subjectAverage ?? 0,
  }));

  return (
    <div className="border-[0.5px] border-gray-400 p-2 mt-2">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%" barGap={0.8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="subjectCode"
              interval={0}
              tick={{ fontSize: 8 }}
              height={22}
            />

            <YAxis tick={{ fontSize: 9 }} />

            <Tooltip
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.subject ?? ""
              }
            />

            <Legend verticalAlign="top" align="center" />

            <Bar dataKey="student" name="Subject Score" fill="#3b82f6" />

            <Bar dataKey="average" name="Average" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
