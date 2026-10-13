import React, { useState, useEffect } from "react";
import {
    X,
    Car,
    Navigation,
    PhoneCall,
    CheckCircle2,
    Clock,
    IndianRupee,
    User,
    KeyRound,
    AlertCircle,
    Loader2,
    ShieldCheck,
    ArrowRight,
    MapPin
} from "lucide-react";
import { driverService } from "../../services/driverService";

const DriverActiveTripModal = ({ isOpen, onClose, onTripStatusChanged }) => {
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [otpInput, setOtpInput] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        fetchActiveTrip();
    }, [isOpen]);

    const fetchActiveTrip = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await driverService.getActiveTrip();
            if (res.success) {
                setTrip(res.active_trip);
            }
        } catch (err) {
            console.error("Failed to load active trip", err);
            setErrorMsg("Could not load active trip.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (nextStatus) => {
        if (!trip) return;
        setUpdating(true);
        setErrorMsg("");
        setStatusMsg("");

        try {
            const res = await driverService.updateTripStatus(trip.id, nextStatus, otpInput);
            if (res.success) {
                setStatusMsg(res.message || `Trip status updated to ${nextStatus}`);
                setTrip(prev => ({ ...prev, status: nextStatus }));
                if (onTripStatusChanged) onTripStatusChanged(nextStatus);
                if (nextStatus === "completed" || nextStatus === "cancelled") {
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to update trip status.");
        } finally {
            setUpdating(false);
        }
    };

    if (!isOpen) return null;

    const stages = [
        { key: "driver_assigned", label: "Assigned", desc: "Booking confirmed" },
        { key: "on_the_way", label: "En Route", desc: "Heading to pickup" },
        { key: "arrived", label: "Arrived", desc: "At pickup location" },
        { key: "in_progress", label: "In Progress", desc: "Driving to destination" },
        { key: "completed", label: "Completed", desc: "Trip finished" },
    ];

    const currentStageIndex = trip ? stages.findIndex(s => s.key === trip.status) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#12141a] border border-gray-800/90 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/30">
                            <Car size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Active Assigned Trip
                                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    Live Session
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">Manage trip navigation, start OTP & status updates</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                    {statusMsg && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 size={18} />
                            <span>{statusMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 text-center text-gray-400">
                            <Loader2 size={28} className="animate-spin text-yellow-400 mx-auto mb-3" />
                            <p className="text-sm">Loading active trip session...</p>
                        </div>
                    ) : !trip ? (
                        <div className="py-12 text-center text-gray-400 bg-gray-900/40 rounded-2xl border border-gray-800">
                            <Car size={36} className="text-gray-600 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-gray-300">No Active Assigned Trips</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                You currently have no ongoing trips. Check "Booking Requests" to accept new bookings.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Trip Progress Stepper */}
                            <div className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    Trip Execution Workflow
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {stages.slice(0, 4).map((stage, idx) => {
                                        const isPast = currentStageIndex > idx;
                                        const isCurrent = currentStageIndex === idx;

                                        return (
                                            <div key={stage.key} className="space-y-1">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        isPast || isCurrent
                                                            ? "bg-yellow-400"
                                                            : "bg-gray-800"
                                                    }`}
                                                />
                                                <p
                                                    className={`text-xs font-bold ${
                                                        isCurrent
                                                            ? "text-yellow-400"
                                                            : isPast
                                                            ? "text-gray-300"
                                                            : "text-gray-600"
                                                    }`}
                                                >
                                                    {stage.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Customer Profile Card */}
                            <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-lg border border-yellow-400/30">
                                        {trip.user_name?.[0] || "C"}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{trip.user_name}</h4>
                                        <p className="text-xs text-gray-400">Passenger • {trip.vehicle_type} ({trip.trip_type_name})</p>
                                        <span className="text-xs text-yellow-400 font-semibold mt-0.5 block">
                                            Start OTP: <span className="font-mono bg-yellow-400/20 px-1.5 py-0.5 rounded border border-yellow-400/30 font-bold">{trip.start_otp || "4921"}</span>
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={`tel:${trip.user_phone}`}
                                    className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-yellow-400 hover:text-black text-gray-200 text-xs font-bold border border-gray-700 transition flex items-center gap-1.5"
                                >
                                    <PhoneCall size={14} />
                                    Call Customer
                                </a>
                            </div>

                            {/* Route Details */}
                            <div className="p-4 bg-[#161821] rounded-2xl border border-gray-800 space-y-3">
                                <div className="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:to-yellow-400">
                                    <div className="relative">
                                        <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                                        <p className="text-xs text-gray-400 font-semibold">PICKUP LOCATION</p>
                                        <p className="text-sm font-bold text-white">{trip.pickup}</p>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-yellow-400 ring-4 ring-yellow-400/20" />
                                        <p className="text-xs text-gray-400 font-semibold">DESTINATION</p>
                                        <p className="text-sm font-bold text-white">{trip.destination}</p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                                    <span>Distance: ~{trip.fare?.distance_km || 12} km</span>
                                    <span>Your Earning: <strong className="text-yellow-400 font-black text-sm">₹{trip.driver_earning}</strong></span>
                                </div>
                            </div>

                            {/* OTP Entry when arrived */}
                            {trip.status === "arrived" && (
                                <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                                        <KeyRound size={15} />
                                        <span>Ask passenger for 4-Digit Start OTP:</span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="Enter customer Start OTP (e.g. 4921)"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-900 border border-yellow-400/50 rounded-xl text-yellow-400 font-mono text-center font-bold tracking-widest text-base focus:outline-none"
                                    />
                                </div>
                            )}

                            {/* Primary Action Button */}
                            <div>
                                {trip.status === "driver_assigned" && (
                                    <button
                                        onClick={() => handleUpdateStatus("on_the_way")}
                                        disabled={updating}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition"
                                    >
                                        {updating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                                        Start Moving (On the Way to Pickup)
                                    </button>
                                )}

                                {trip.status === "on_the_way" && (
                                    <button
                                        onClick={() => handleUpdateStatus("arrived")}
                                        disabled={updating}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition"
                                    >
                                        {updating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                                        I Have Arrived at Pickup Location
                                    </button>
                                )}

                                {trip.status === "arrived" && (
                                    <button
                                        onClick={() => handleUpdateStatus("in_progress")}
                                        disabled={updating}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                                    >
                                        {updating ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                        Verify OTP & Start Ride
                                    </button>
                                )}

                                {trip.status === "in_progress" && (
                                    <button
                                        onClick={() => handleUpdateStatus("completed")}
                                        disabled={updating}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition"
                                    >
                                        {updating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        Complete Trip & Collect ₹{trip.fare?.remaining_amount || trip.driver_earning}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverActiveTripModal;
