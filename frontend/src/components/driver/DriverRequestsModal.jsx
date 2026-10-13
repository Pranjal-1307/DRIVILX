import React, { useState, useEffect } from "react";
import {
    X,
    MapPin,
    Navigation,
    Clock,
    IndianRupee,
    Car,
    User,
    Phone,
    Check,
    Ban,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Sparkles,
    Filter,
    ShieldAlert,
    ShieldCheck
} from "lucide-react";
import { driverService } from "../../services/driverService";

const DriverRequestsModal = ({ isOpen, onClose, driverCity, onRequestAccepted }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState(driverCity || "All");
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [kycStatus, setKycStatus] = useState("verified");
    const [kycApproved, setKycApproved] = useState(true);
    const [kycNotice, setKycNotice] = useState("");

    const cities = ["All", "Mumbai", "Pune", "Delhi NCR", "Bangalore", "Hyderabad", "Chennai", "Ahmedabad"];

    useEffect(() => {
        if (!isOpen) return;
        fetchRequests();
    }, [isOpen, selectedCity]);

    const fetchRequests = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const cityParam = selectedCity === "All" ? "" : selectedCity;
            const res = await driverService.getRequests(cityParam);
            if (res.success) {
                setRequests(res.requests || []);
                setKycApproved(res.kyc_approved !== false);
                setKycStatus(res.kyc_status || "verified");
                if (res.message && res.kyc_approved === false) {
                    setKycNotice(res.message);
                } else {
                    setKycNotice("");
                }
            }
        } catch (err) {
            console.error("Failed to load requests", err);
            setErrorMsg("Could not fetch requests. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bookingId, action) => {
        if (action === "accept" && !kycApproved) {
            setErrorMsg("KYC verification required. You cannot accept rides until Admin approves your KYC.");
            return;
        }

        setActionLoadingId(bookingId);
        setStatusMsg("");
        setErrorMsg("");
        try {
            const res = await driverService.takeActionOnRequest(bookingId, action);
            if (res.success) {
                if (action === "accept") {
                    setStatusMsg("Trip accepted successfully! You are now assigned.");
                    if (onRequestAccepted) onRequestAccepted(bookingId);
                    setTimeout(() => {
                        onClose();
                    }, 1200);
                } else {
                    setRequests(prev => prev.filter(r => r.id !== bookingId));
                    setStatusMsg("Request declined.");
                    setTimeout(() => setStatusMsg(""), 2000);
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || `Failed to ${action} booking.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-[#12141a] border border-gray-800/90 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Top Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/30">
                            <Navigation size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Booking Requests & Notifications
                                {kycApproved && (
                                    <span className="bg-yellow-400/20 text-yellow-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-yellow-400/30">
                                        {requests.length} Available
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gray-400">Review city-wise booking offers and accept your next ride</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchRequests}
                            disabled={loading}
                            title="Refresh Requests"
                            className="w-9 h-9 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin text-yellow-400" : ""} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* KYC Warning Banner if not verified */}
                {!kycApproved && (
                    <div className="p-4 bg-amber-950/40 border-b border-amber-800/50 text-amber-300 flex items-center gap-3 text-xs">
                        <ShieldAlert size={20} className="text-amber-400 shrink-0" />
                        <div>
                            <span className="font-bold block">KYC Verification Required (Status: {kycStatus.toUpperCase()})</span>
                            <span className="text-amber-300/80">{kycNotice || "Your KYC documents must be reviewed and approved by the Admin before you can receive or accept passenger ride requests."}</span>
                        </div>
                    </div>
                )}

                {/* City Filter Tabs */}
                <div className="px-6 py-3 bg-gray-900/60 border-b border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 shrink-0 mr-1">
                        <Filter size={13} /> City:
                    </span>
                    {cities.map((c) => (
                        <button
                            key={c}
                            onClick={() => setSelectedCity(c)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition ${
                                selectedCity === c
                                    ? "bg-yellow-400 text-black font-bold"
                                    : "bg-gray-800 text-gray-400 hover:text-white"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Body Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    {statusMsg && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 size={18} />
                            <span>{statusMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {!kycApproved ? (
                        <div className="py-12 text-center text-gray-400 bg-gray-900/40 rounded-2xl border border-gray-800/80 p-6 space-y-3">
                            <ShieldAlert size={42} className="text-amber-400 mx-auto" />
                            <h3 className="text-base font-bold text-white">KYC Approval Pending</h3>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                You cannot accept customer ride requests until your identity and driving license documents are verified and approved by the DRIVIX Admin team.
                            </p>
                        </div>
                    ) : loading && requests.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <RefreshCw size={28} className="animate-spin text-yellow-400 mx-auto mb-3" />
                            <p className="text-sm">Fetching real-time booking requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-gray-900/40 rounded-2xl border border-gray-800/80">
                            <Navigation size={36} className="text-gray-600 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-gray-300">No Booking Requests Right Now</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                Keep your status set to "Available" or switch to "All Cities" to see nearby passenger requests.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => {
                                const isActioning = actionLoadingId === req.id;

                                return (
                                    <div
                                        key={req.id}
                                        className="p-5 bg-[#171a22] border border-gray-800 rounded-2xl hover:border-yellow-400/40 transition shadow-lg relative overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Route & Passenger Details */}
                                            <div className="space-y-3 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-bold border border-yellow-400/20">
                                                        {req.trip_type_name}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium flex items-center gap-1">
                                                        <Car size={13} /> {req.vehicle_type}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar size={13} /> {req.booking_date} • {req.booking_time}
                                                    </span>
                                                </div>

                                                {/* Pickup & Destination Timeline */}
                                                <div className="space-y-2 relative pl-5 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:to-yellow-400">
                                                    <div className="relative">
                                                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                                                        <p className="text-xs text-gray-400 font-semibold">PICKUP</p>
                                                        <p className="text-sm font-bold text-white line-clamp-1">{req.pickup}</p>
                                                    </div>

                                                    <div className="relative">
                                                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-yellow-400 ring-4 ring-yellow-400/20" />
                                                        <p className="text-xs text-gray-400 font-semibold">DROP-OFF</p>
                                                        <p className="text-sm font-bold text-white line-clamp-1">{req.destination}</p>
                                                    </div>
                                                </div>

                                                {/* Customer note / passenger */}
                                                <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                                                    <span className="flex items-center gap-1.5 font-medium text-gray-300">
                                                        <User size={14} className="text-yellow-400" />
                                                        {req.user_name}
                                                    </span>
                                                    <span>•</span>
                                                    <span>~{req.distance_km} km ({req.duration_mins} mins)</span>
                                                </div>
                                            </div>

                                            {/* Fare & Action Buttons */}
                                            <div className="flex md:flex-col justify-between items-end gap-3 shrink-0 border-t md:border-t-0 md:border-l border-gray-800 pt-3 md:pt-0 md:pl-5">
                                                <div className="text-left md:text-right">
                                                    <p className="text-xs text-gray-400 font-semibold">YOUR EARNING</p>
                                                    <p className="text-2xl font-black text-yellow-400">₹{req.driver_earning}</p>
                                                    <p className="text-xs text-gray-500">Trip Fare: ₹{req.estimated_fare}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(req.id, "decline")}
                                                        disabled={isActioning}
                                                        className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs font-bold border border-gray-700 transition flex items-center gap-1"
                                                    >
                                                        <Ban size={14} />
                                                        Decline
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction(req.id, "accept")}
                                                        disabled={isActioning}
                                                        className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/20 transition flex items-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {isActioning ? (
                                                            <RefreshCw size={14} className="animate-spin" />
                                                        ) : (
                                                            <Check size={14} />
                                                        )}
                                                        Accept Ride
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverRequestsModal;
