import React, { useState } from "react";
import {
    Car,
    Phone,
    Star,
    ShieldCheck,
    Navigation,
    Clock,
    MapPin,
    CreditCard,
    CheckCircle2,
    Sparkles,
    AlertCircle,
    ChevronRight,
    Loader2,
    Radio,
    Radar
} from "lucide-react";
import { bookingService } from "../../services/bookingService";

const STATUS_PROGRESS = [
    { key: "driver_assigned", label: "Driver Assigned", desc: "Matched with top chauffeur" },
    { key: "on_the_way", label: "On The Way", desc: "Driver heading to your pickup" },
    { key: "arrived", label: "Driver Arrived", desc: "Waiting at your vehicle" },
    { key: "in_progress", label: "Trip In Progress", desc: "Enjoy your comfortable journey" },
    { key: "completed", label: "Trip Completed", desc: "Reached destination safely" }
];

const ActiveTripCard = ({
    booking,
    onStatusUpdate,
    onPayRemainingClick,
    onReviewClick
}) => {
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusNote, setStatusNote] = useState("");

    if (!booking) return null;

    const currentStatus = booking.status || "searching";
    const driver = booking.driver;
    const fare = booking.fare || {};

    const handleAdvanceTripSimulation = async (nextStatus) => {
        setUpdatingStatus(true);
        try {
            const res = await bookingService.updateTripStatus(booking.id, nextStatus);
            if (res.success) {
                onStatusUpdate(nextStatus);
                setStatusNote(`Trip updated to ${nextStatus.replace('_', ' ')}!`);
                setTimeout(() => setStatusNote(""), 4000);
            }
        } catch (err) {
            console.error("Status update error", err);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getNextStatus = () => {
        switch (currentStatus) {
            case "driver_assigned":
                return "on_the_way";
            case "on_the_way":
                return "arrived";
            case "arrived":
                return "in_progress";
            case "in_progress":
                return "completed";
            default:
                return null;
        }
    };

    const nextStatus = getNextStatus();

    // -------------------------------------------------------------
    // STATE 1: SEARCHING / PENDING DRIVER (No driver assigned yet)
    // -------------------------------------------------------------
    if (!driver || currentStatus === "searching" || currentStatus === "pending_advance") {
        return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131620] via-[#0f1118] to-[#090a0f] border border-yellow-500/30 shadow-2xl p-6 md:p-8 text-white mb-8 animate-fadeIn">
                {/* Background ambient glow */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-yellow-400/10 border border-yellow-400/25 rounded-2xl mb-6">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                        </span>
                        <span className="text-xs md:text-sm font-black text-yellow-400 flex items-center gap-1.5 tracking-wider uppercase">
                            <Sparkles size={16} /> BROADCASTING TO VERIFIED DRIVERS
                        </span>
                    </div>
                    <span className="text-xs px-3 py-1 bg-yellow-400 text-black font-extrabold rounded-lg uppercase tracking-wider shadow">
                        Finding Driver
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left: Radar / Sonar Search Animation */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4 relative overflow-hidden">
                        {/* Radar Pulse Circles */}
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-yellow-400/20 animate-ping" style={{ animationDuration: "3s" }} />
                            <div className="absolute inset-4 rounded-full border-2 border-yellow-400/40 animate-ping" style={{ animationDuration: "2s" }} />
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500/20 to-yellow-400/30 border-2 border-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                                <Car size={32} className="text-yellow-400 animate-pulse" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white">Searching for Nearby Chauffeur</h3>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                                Matching your trip with an Admin-approved, KYC-verified professional driver in your area.
                            </p>
                        </div>

                        <div className="w-full pt-3 border-t border-zinc-800 flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                            <ShieldCheck size={16} />
                            <span>100% Admin KYC Verified Only</span>
                        </div>
                    </div>

                    {/* Right: Booking Summary & Live Status */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Route Info */}
                        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3 text-xs">
                            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2.5">
                                <span>Vehicle: <strong className="text-white">{booking.vehicle_type || "Sedan"}</strong></span>
                                <span>Service: <strong className="text-yellow-400">{booking.trip_type_name || "City Drive"}</strong></span>
                            </div>

                            <div className="space-y-2 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:to-yellow-400">
                                <div className="relative">
                                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Pickup Location</p>
                                    <p className="text-sm font-bold text-white">{booking.pickup}</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-yellow-400 ring-4 ring-yellow-400/20" />
                                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Destination</p>
                                    <p className="text-sm font-bold text-white">{booking.destination}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Status Note */}
                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <p className="font-bold text-white">Advance Booking Paid</p>
                                    <p className="text-zinc-400 text-[11px]">₹{fare.advance_amount || 0} Confirmed</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-zinc-400 text-[11px]">Total Est. Fare</p>
                                <p className="font-black text-sm text-yellow-400">₹{fare.total_fare || 0}</p>
                            </div>
                        </div>

                        <div className="p-3.5 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-xs text-yellow-300 flex items-start gap-2.5">
                            <Clock size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                            <span>
                                Driver details (Photo, Name, Phone, Rating & Vehicle info) will become visible here the moment an Admin-verified driver accepts your request.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // STATE 2: DRIVER ASSIGNED (Driver accepted & KYC verified)
    // -------------------------------------------------------------
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141722] via-[#0f1118] to-[#090a0f] border border-yellow-400/40 shadow-2xl p-6 md:p-8 text-white mb-8 animate-fadeIn">
            {/* Top Driver Assigned Notification Alert Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-6">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs md:text-sm font-black text-emerald-400 flex items-center gap-1.5 tracking-wide uppercase">
                        <ShieldCheck size={18} /> DRIVER ACCEPTED & KYC VERIFIED
                    </span>
                </div>
                <span className="text-xs px-3 py-1 bg-yellow-400 text-black font-extrabold rounded-lg uppercase tracking-wider shadow">
                    {currentStatus.replace("_", " ")}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Driver Details Card */}
                <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <img
                            src={driver.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
                            alt={driver.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-400 shadow-md"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">{driver.name}</h3>
                                <ShieldCheck size={16} className="text-emerald-400" />
                            </div>
                            <span className="inline-block text-[11px] px-2 py-0.5 mt-1 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-bold">
                                {driver.badge || "Verified Pro Driver"}
                            </span>
                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                                <span className="flex items-center text-yellow-400 font-bold">
                                    <Star size={13} className="fill-yellow-400 mr-0.5" /> {driver.rating || 4.9}
                                </span>
                                <span>•</span>
                                <span>{driver.total_trips || 50}+ rides</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800">
                        <div className="p-2.5 bg-zinc-800/60 rounded-xl">
                            <span className="text-zinc-400 block text-[10px]">License Number</span>
                            <span className="font-mono font-medium text-white">{driver.license_number || "DL-0420180039211"}</span>
                        </div>
                        <div className="p-2.5 bg-zinc-800/60 rounded-xl">
                            <span className="text-zinc-400 block text-[10px]">ETA Arrival</span>
                            <span className="font-bold text-emerald-400">~{driver.eta_minutes || 8} mins away</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <a
                            href={`tel:${driver.phone}`}
                            className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition"
                        >
                            <Phone size={14} className="text-black" /> Call Driver ({driver.phone})
                        </a>
                    </div>
                </div>

                {/* Right: Route & Trip Milestones */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Route Details */}
                    <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                            <span>Vehicle: <strong className="text-white">{booking.vehicle_type}</strong></span>
                            <span>Service: <strong className="text-yellow-400">{booking.trip_type_name || "City Drive"}</strong></span>
                        </div>
                        <div className="flex items-start gap-2 text-zinc-200">
                            <MapPin size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] text-zinc-400 uppercase">Pickup: </span>
                                <span>{booking.pickup}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-zinc-200">
                            <Navigation size={14} className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] text-zinc-400 uppercase">Destination: </span>
                                <span>{booking.destination}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        {STATUS_PROGRESS.map((s, idx) => {
                            const isPastOrCurrent =
                                STATUS_PROGRESS.findIndex((x) => x.key === currentStatus) >= idx;
                            return (
                                <div
                                    key={s.key}
                                    className={`p-2 rounded-xl border transition ${
                                        isPastOrCurrent
                                            ? "bg-yellow-400/10 border-yellow-400 text-yellow-400 font-bold"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                    }`}
                                >
                                    <div className="text-[10px] opacity-75">{idx + 1}</div>
                                    <div className="text-[11px] truncate">{s.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Simulation & Payment Actions */}
                    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs text-zinc-400">Advance Paid: </span>
                                <span className="text-xs font-bold text-emerald-400">₹{fare.advance_amount || 0} ✓</span>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-400">Remaining Balance: </span>
                                <span className="text-xs font-bold text-yellow-400">₹{fare.remaining_amount || 0}</span>
                            </div>
                        </div>

                        {statusNote && (
                            <div className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                                {statusNote}
                            </div>
                        )}

                        {/* Interactive Controls */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {nextStatus && (
                                <button
                                    onClick={() => handleAdvanceTripSimulation(nextStatus)}
                                    disabled={updatingStatus}
                                    className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                                >
                                    {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                                    Simulate Next Step: {nextStatus.replace('_', ' ').toUpperCase()}
                                </button>
                            )}

                            {currentStatus === "completed" && !booking.remaining_paid && (
                                <button
                                    onClick={() => onPayRemainingClick(booking)}
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
                                >
                                    <CreditCard size={14} /> Pay Remaining Amount (₹{fare.remaining_amount || 0})
                                </button>
                            )}

                            {currentStatus === "completed" && booking.remaining_paid && !booking.review && (
                                <button
                                    onClick={() => onReviewClick(booking)}
                                    className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition"
                                >
                                    <Star size={14} className="fill-black" /> Rate & Review Driver
                                </button>
                            )}

                            {currentStatus === "completed" && booking.remaining_paid && booking.review && (
                                <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                                    <CheckCircle2 size={14} /> Trip Completed, Paid & Reviewed ({booking.review.rating}★)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveTripCard;
