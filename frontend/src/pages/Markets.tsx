import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Markets() {
  const { data: sectors } = useQuery({ queryKey: ["sectors"], queryFn: () => api.sectors().then((r) => r.data) });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Sectors</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(sectors ?? []).map((s: any) => (
          <div key={s.sector} className="card">
            <div className="font-medium mb-2">{s.sector}</div>
            <div className="flex flex-wrap gap-2">
              {s.companies.map((t: string) => (
                <Link key={t} to={`/stocks/${t}`} className="text-xs bg-white/5 rounded px-2 py-1 hover:bg-white/10">{t}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
