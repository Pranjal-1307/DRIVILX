import React, { useState } from "react";
import { X, MapPin, Calendar, Clock, Car, Loader2, AlertCircle } from "lucide-react";
import { bookingService } from "../../services/bookingService";
import LocationSearch from "../common/LocationSearch";
import OSMMap from "../common/OSMMap";

const VEHICLES = ["Hatchback", "Sedan", "SUV", "Luxury"];
export default function BookingModal({ isOpen, onClose, onBookingSuccess }) {
  const [pickup, setPickup] = useState(null), [destination, setDestination] = useState(null);
  const [tripType, setTripType] = useState("city_ride"), [vehicleType, setVehicleType] = useState("Sedan");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0,10)), [bookingTime, setBookingTime] = useState("Immediate");
  const [notes, setNotes] = useState(""), [quotes, setQuotes] = useState([]), [route, setRoute] = useState(null), [city, setCity] = useState("");
  const [selected, setSelected] = useState(null), [loading, setLoading] = useState(false), [processing, setProcessing] = useState(false), [error, setError] = useState("");
  if (!isOpen) return null;
  const estimate = async () => {
    if (!pickup || !destination) { setError("Search and select both pickup and destination locations."); return; }
    setLoading(true); setError(""); setSelected(null);
    try {
      const res = await bookingService.estimateFare({ pickup: pickup.address, pickup_city: pickup.city, destination: destination.address, pickup_coords: {lat:pickup.lat,lng:pickup.lng}, dest_coords: {lat:destination.lat,lng:destination.lng}, vehicle_type: vehicleType, trip_type: tripType });
      setQuotes(res.quotes || []); setRoute(res.route); setCity(res.pickup_city);
      if (!res.quotes?.length) setError(`No available verified ${vehicleType} drivers with a fare configured in ${res.pickup_city}.`);
    } catch (e) { setError(e.response?.data?.error || "Could not calculate an actual road route. Please retry."); setQuotes([]); setRoute(null); }
    finally { setLoading(false); }
  };
  const confirm = async () => {
    if (!selected) { setError("Choose a fare offer to send your request to matching drivers."); return; }
    setProcessing(true); setError("");
    try {
      const created = await bookingService.createBooking({ pickup: pickup.address, pickup_city: pickup.city, destination: destination.address, pickup_coords:{lat:pickup.lat,lng:pickup.lng}, dest_coords:{lat:destination.lat,lng:destination.lng}, rate_per_km:selected.rate_per_km, booking_date:bookingDate, booking_time:bookingTime, trip_type:tripType, vehicle_type:vehicleType, notes });
      onBookingSuccess({bookingId:created.booking_id, fare:created.fare}); onClose();
    } catch(e) { setError(e.response?.data?.error || "Booking could not be confirmed. Refresh quotes and try again."); }
    finally { setProcessing(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"><section className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white">
    <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4"><div><h2 className="font-bold">Book a Driver</h2><p className="text-xs text-gray-400">OpenStreetMap locations • road distance from OSRM</p></div><button onClick={onClose} aria-label="Close"><X/></button></header>
    <div className="max-h-[78vh] space-y-4 overflow-y-auto p-5">
      {error && <div className="flex gap-2 rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300"><AlertCircle size={18}/>{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2"><LocationSearch label="Pickup" value={pickup} onSelect={setPickup}/><LocationSearch label="Destination" value={destination} onSelect={setDestination}/></div>
      <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs text-gray-300">Vehicle<select value={vehicleType} onChange={e=>{setVehicleType(e.target.value);setQuotes([]);setSelected(null)}} className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900 p-2.5 text-sm text-white">{VEHICLES.map(v=><option key={v}>{v}</option>)}</select></label><label className="text-xs text-gray-300">Trip type<select value={tripType} onChange={e=>setTripType(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900 p-2.5 text-sm text-white">{[["city_ride","City Ride"],["outstation","Outstation"],["hourly","Hourly"],["night_ride","Night Ride"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-xs text-gray-300"><Calendar size={13} className="inline"/> Date<input type="date" value={bookingDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setBookingDate(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900 p-2.5 text-sm"/></label></div>
      <label className="block text-xs text-gray-300"><Clock size={13} className="inline"/> Pickup time<input value={bookingTime} onChange={e=>setBookingTime(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900 p-2.5 text-sm"/></label>
      {pickup && <OSMMap pickup={pickup} destination={destination} geometry={route?.route_geometry} height={260}/>}
      {route && <p className="rounded-xl bg-yellow-400/10 p-3 text-sm text-yellow-200">{city} pickup · {route.distance_km} km road route · {route.duration_mins} min estimated</p>}
      <button onClick={estimate} disabled={loading} className="w-full rounded-xl bg-yellow-400 p-3 font-bold text-black disabled:opacity-60">{loading?<><Loader2 className="mr-2 inline animate-spin" size={16}/>Routing…</>:"Find route and driver fares"}</button>
      {quotes.length>0 && <div className="space-y-2"><h3 className="font-semibold">Available fare offers in {city}</h3><p className="text-xs text-gray-400">Choose a price. Matching verified drivers will receive your request. You will pay the advance only after a driver accepts.</p>{quotes.map(q=><button key={q.rate_per_km} onClick={()=>setSelected(q)} className={`w-full rounded-xl border p-3 text-left ${selected?.rate_per_km===q.rate_per_km?"border-yellow-400 bg-yellow-400/10":"border-gray-700 bg-gray-900"}`}><div className="flex items-center justify-between"><span className="font-semibold">{q.vehicle_type} · ₹{q.rate_per_km}/km · {q.available_drivers_count} available driver{q.available_drivers_count===1?"":"s"}</span><span className="font-black text-yellow-300">₹{q.fare.total_fare}</span></div><p className="mt-1 text-xs text-gray-400">{q.fare.distance_km} km · {q.fare.duration_mins} min · includes existing service and tax charges</p></button>)}</div>}
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes for your driver (optional)" className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm"/>
            {selected && <button onClick={confirm} disabled={processing} className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-black disabled:opacity-60">{processing?"Sending driver request…":`Send request to drivers`}</button>}
      <p className="text-center text-[11px] text-gray-500">Map data © OpenStreetMap contributors. Public Nominatim searches are submitted on request to respect service limits.</p>
    </div>
  </section></div>;
}
