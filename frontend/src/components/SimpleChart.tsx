import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SimpleChart({ data }: { data: { date: string; close: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232d42" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#93a0ba" }} tickFormatter={(d) => d.slice(5, 10)} />
        <YAxis tick={{ fontSize: 10, fill: "#93a0ba" }} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: "#141b2c", border: "1px solid #232d42" }} />
        <Line type="monotone" dataKey="close" stroke="#e3a53d" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
