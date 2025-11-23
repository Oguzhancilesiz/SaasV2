"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppsToolbar() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "all");
  const [sort, setSort] = useState(sp.get("sort") ?? "created_desc");

  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);
  useEffect(() => setStatus(sp.get("status") ?? "all"), [sp]);
  useEffect(() => setSort(sp.get("sort") ?? "created_desc"), [sp]);

  function push() {
    const params = new URLSearchParams(sp.toString());
    q ? params.set("q", q) : params.delete("q");
    params.set("status", status);
    params.set("sort", sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <input
        placeholder="Ara: ad veya kod"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && push()}
        className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm"
      />
      <select value={status} onChange={(e) => { setStatus(e.target.value); }} className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm">
        <option value="all">Tümü</option>
        <option value="active">Aktif</option>
        <option value="passive">Pasif</option>
      </select>
      <select value={sort} onChange={(e) => { setSort(e.target.value); }} className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm">
        <option value="created_desc">Yeni eklenen</option>
        <option value="created_asc">Eskiden yeniye</option>
        <option value="name_asc">Ad A→Z</option>
        <option value="name_desc">Ad Z→A</option>
        <option value="code_asc">Kod A→Z</option>
        <option value="code_desc">Kod Z→A</option>
      </select>
      <button onClick={push} className="px-3 py-2 rounded-xl bg-white text-black text-sm font-medium">
        Uygula
      </button>
    </div>
  );
}
