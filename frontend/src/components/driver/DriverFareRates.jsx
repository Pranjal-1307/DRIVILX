import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { driverService } from "../../services/driverService";

const TYPES = ["Hatchback", "Sedan", "SUV", "Luxury"];
export default function DriverFareRates({isOpen,onClose}) {
  const [rates,setRates]=useState({Hatchback:"",Sedan:"",SUV:"",Luxury:""}); const [error,setError]=useState(""); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  useEffect(()=>{if(isOpen)driverService.getFareRates().then(r=>setRates(p=>({...p,...r.fare_per_km}))).catch(()=>{});},[isOpen]);
  if(!isOpen)return null;
  const submit=async e=>{e.preventDefault();setSaving(true);setError("");try{const r=await driverService.updateFareRates(Object.fromEntries(TYPES.map(t=>[t,Number(rates[t])])));setRates(r.fare_per_km);setSaved(true)}catch(e){setError(e.response?.data?.error||"Could not save rates") }finally{setSaving(false)}};
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-gray-700 bg-gray-950 p-6 text-white"><div className="flex justify-between"><h2 className="text-lg font-bold">Your per-kilometer fares</h2><button type="button" onClick={onClose}><X/></button></div><p className="text-xs text-gray-400">Set ₹1–₹500 per km for each vehicle. Rates apply to new quotes only.</p>{TYPES.map(t=><label key={t} className="flex items-center justify-between gap-4 text-sm">{t}<input required type="number" min="1" max="500" step="0.5" value={rates[t]} onChange={e=>setRates({...rates,[t]:e.target.value})} className="w-32 rounded-lg border border-gray-700 bg-gray-900 p-2" placeholder="₹ / km"/></label>)}{error&&<p className="text-sm text-red-400">{error}</p>}{saved&&<p className="text-sm text-emerald-400">Fare rates saved.</p>}<button disabled={saving} className="w-full rounded-xl bg-yellow-400 p-3 font-bold text-black">{saving?"Saving…":"Save fares"}</button></form></div>
}
