import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";

export default function LocationSearch({ label, value, onSelect, placeholder = "Search any Indian address or place" }) {
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const requestSequence = useRef(0);
  useEffect(() => {
    requestSequence.current += 1;
    setQuery(value?.address || ""); setResults([]); setError(""); setBusy(false); setSearched(false);
  }, [value?.address]);
  const search = async () => {
    const original = query.trim();
    const requestId = ++requestSequence.current;
    if (original.length < 3) { setResults([]); setSearched(false); return; }
    setBusy(true); setError(""); setResults([]); setSearched(true);
    const parts = original.split(",").map(part => part.trim()).filter(Boolean);
    const candidates = [original];
    if (parts.length > 2) candidates.push(parts.slice(0, 2).join(", "));
    const words = original.replaceAll(",", " ").split(/\s+/).filter(Boolean);
    if (words.length > 4) candidates.push(words.slice(0, 4).join(" "));
    try {
      for (const candidate of [...new Set(candidates)]) {
        const res = await api.get(`/bookings/locations/search/?q=${encodeURIComponent(candidate)}`);
        if (requestId !== requestSequence.current) return;
        const found = res.data.results || [];
        if (found.length) { setResults(found); return; }
      }
    } catch (e) {
      if (requestId === requestSequence.current) setError(e.response?.data?.error || "Location search is unavailable. Try again.");
    } finally {
      if (requestId === requestSequence.current) setBusy(false);
    }
  };
  return <div className="relative space-y-1.5">
    {label && <label className="text-xs font-bold text-gray-300">{label}</label>}
    <div className="flex gap-2">
      <input value={query} onChange={e => { requestSequence.current += 1; setBusy(false); setQuery(e.target.value); setResults([]); setSearched(false); setError(""); if (value) onSelect(null); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(); } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white" />
      <button type="button" onClick={search} disabled={busy} className="rounded-xl bg-yellow-400 px-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "…" : "Search"}</button>
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
    {results.length > 0 && <ul className="absolute z-[1000] top-full mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-700 bg-gray-950 shadow-xl">{results.map(place => <li key={place.place_id}><button type="button" onClick={() => { onSelect(place); setQuery(place.address); setResults([]); }} className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"><span className="block line-clamp-2">{place.address}</span><span className="text-xs text-gray-500">{place.city || "India"}</span></button></li>)}</ul>}
    {searched && !busy && !error && results.length === 0 && <p className="text-xs text-amber-300">No matching mapped place found. Try “society name, nearby area, city” or a nearby landmark. Newly built societies may not yet be in OpenStreetMap.</p>}
  </div>;
}
