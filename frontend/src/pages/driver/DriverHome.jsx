import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
    MapPin,
    Car,
    IndianRupee,
    Clock3,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    TrendingUp,
    ClipboardCheck,
    Navigation,
    User,
    Star,
    Power,
    RefreshCw,
    AlertCircle,
    Bell,
    PhoneCall
} from "lucide-react";

import DriverKYCModal from "../../components/driver/DriverKYCModal";
import DriverProfileModal from "../../components/driver/DriverProfileModal";
import DriverRequestsModal from "../../components/driver/DriverRequestsModal";
import DriverActiveTripModal from "../../components/driver/DriverActiveTripModal";
import DriverHistoryModal from "../../components/driver/DriverHistoryModal";
import DriverEarningsModal from "../../components/driver/DriverEarningsModal";
import { driverService } from "../../services/driverService";

const DriverHome = () => {
    const { user } = useAuth();

    // Modals
    const [isKYCOpen, setIsKYCOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);
    const [isActiveTripOpen, setIsActiveTripOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isEarningsOpen, setIsEarningsOpen] = useState(false);

    // Dynamic state
    const [driverProfile, setDriverProfile] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [stats, setStats] = useState({
        requestsCount: 0,
        completedTrips: 0,
        totalEarnings: 0,
        rating: 4.9,
        status: "available",
        kycStatus: "verified"
    });
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    useEffect(() => {
        loadDashboardData();
        // Periodic refresh every 15s for live city requests and trip updates
        const interval = setInterval(loadDashboardData, 15000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            // Profile & stats
            const profileRes = await driverService.getProfile();
            if (profileRes.success && profileRes.profile) {
                const p = profileRes.profile;
                setDriverProfile(p);
                setStats(prev => ({
                    ...prev,
                    completedTrips: p.total_trips || 0,
                    totalEarnings: p.total_earnings || 0,
                    rating: p.rating || 4.9,
                    status: p.status || "available",
                    kycStatus: p.kyc_status || "verified"
                }));
            }

            // Active trip check
            const tripRes = await driverService.getActiveTrip();
            if (tripRes.success) {
                setActiveTrip(tripRes.active_trip);
            }

            // Pending requests count
            const reqRes = await driverService.getRequests();
            if (reqRes.success && reqRes.requests) {
                setPendingRequestsCount(reqRes.requests.length);
                setStats(prev => ({ ...prev, requestsCount: reqRes.requests.length }));
            }
        } catch (err) {
            console.error("Failed to load driver dashboard data", err);
        }
    };

    const handleToggleStatus = async () => {
        setTogglingStatus(true);
        try {
            const nextStatus = stats.status === "available" ? "offline" : "available";
            const res = await driverService.toggleStatus(nextStatus);
            if (res.success) {
                setStats(prev => ({ ...prev, status: res.status }));
                showToast(`You are now ${res.status.toUpperCase()}`);
            }
        } catch (err) {
            console.error("Failed to toggle status", err);
            showToast("Failed to toggle status");
        } finally {
            setTogglingStatus(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 3500);
    };

    const isAvailable = stats.status === "available";
    const isBusy = stats.status === "busy" || Boolean(activeTrip);

    return (
        <div className="drivix-dashboard driver-dashboard min-h-screen bg-[#0d0f14] text-white">
            <Navbar />

            {/* Toast message */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-yellow-400 text-black px-4 py-2.5 rounded-2xl font-bold shadow-xl flex items-center gap-2 animate-bounce">
                    <Sparkles size={16} />
                    <span>{toastMessage}</span>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-5 md:px-6 py-8 md:py-10 space-y-8">
                {/* =====================================================
                    HERO SECTION
                ===================================================== */}
                <section className="driver-hero drivix-reveal relative overflow-hidden rounded-3xl p-6 md:p-10 border border-gray-800/80 bg-gradient-to-br from-[#161922] via-[#12141c] to-[#0e1017]">
                    <div className="driver-grid" />
                    <div className="driver-glow driver-glow-one" />
                    <div className="driver-glow driver-glow-two" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-2xl space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="dashboard-badge flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-full text-xs font-black">
                                    <Sparkles size={14} />
                                    DRIVIX DRIVER PARTNER PORTAL
                                </div>
                                <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700">
                                    <MapPin size={12} className="text-yellow-400" />
                                    {driverProfile?.city || user?.city || "Mumbai"} Zone
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                Welcome back,{" "}
                                <span className="text-yellow-400">
                                    {driverProfile?.name || user?.name || "Professional Chauffeur"}
                                </span>
                            </h1>

                            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                                Manage city booking notifications, accept passenger requests, verify trip OTPs, and track real-time 85% payout earnings.
                            </p>

                            <div className="flex flex-wrap gap-3 pt-3">
                                <button
                                    onClick={() => setIsRequestsOpen(true)}
                                    className="drivix-primary-button px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-yellow-400/20 transition transform hover:-translate-y-0.5"
                                >
                                    <Navigation size={18} />
                                    View Booking Requests
                                    {pendingRequestsCount > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-black text-yellow-400 rounded-full text-xs font-black">
                                            {pendingRequestsCount}
                                        </span>
                                    )}
                                    <ArrowRight size={16} />
                                </button>

                                <button
                                    onClick={() => setIsEarningsOpen(true)}
                                    className="drivix-outline-button px-5 py-3 rounded-2xl bg-gray-800/90 hover:bg-gray-700 text-white font-bold text-sm border border-gray-700 flex items-center gap-2 transition transform hover:-translate-y-0.5"
                                >
                                    <TrendingUp size={18} className="text-yellow-400" />
                                    Track Earnings & Payouts
                                </button>

                                <button
                                    onClick={() => setIsProfileOpen(true)}
                                    className="px-4 py-3 rounded-2xl bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-semibold border border-gray-700/60 flex items-center gap-2 transition"
                                >
                                    <User size={16} />
                                    Update Profile
                                </button>
                            </div>
                        </div>

                        {/* Interactive Status & Online Switch Widget */}
                        <div className="driver-status-card bg-[#1a1d27]/90 border border-gray-800 rounded-3xl p-6 text-center shrink-0 w-full lg:w-72 shadow-xl backdrop-blur-sm">
                            <div className="driver-status-ring mx-auto w-20 h-20 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center relative">
                                <Car size={34} className={isAvailable ? "text-yellow-400 animate-pulse" : "text-gray-500"} />
                                <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#1a1d27] ${
                                    isBusy
                                        ? "bg-amber-500"
                                        : isAvailable
                                        ? "bg-emerald-500 animate-ping"
                                        : "bg-gray-500"
                                }`} />
                            </div>

                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">
                                AVAILABILITY STATUS
                            </p>

                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                    isBusy ? "bg-amber-400" : isAvailable ? "bg-emerald-400" : "bg-gray-500"
                                }`} />
                                <span className="text-white font-extrabold text-base capitalize">
                                    {isBusy ? "On Active Trip" : stats.status}
                                </span>
                            </div>

                            <p className="text-gray-400 text-xs mt-1">
                                {isBusy
                                    ? "Currently fulfilling an assigned ride"
                                    : isAvailable
                                    ? "Receiving city booking offers"
                                    : "You are offline to new rides"}
                            </p>

                            <button
                                onClick={handleToggleStatus}
                                disabled={togglingStatus || isBusy}
                                className={`w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                                    isAvailable
                                        ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                } disabled:opacity-50`}
                            >
                                <Power size={14} />
                                {togglingStatus ? "Updating..." : isAvailable ? "Go Offline" : "Go Online & Available"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    ACTIVE TRIP ALERT BANNER (If trip ongoing)
                ===================================================== */}
                {activeTrip && (
                    <section className="p-5 rounded-3xl bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border border-yellow-400/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black shrink-0 shadow-md">
                                <Car size={24} />
                            </div>
                            <div>
                                <span className="text-xs px-2.5 py-0.5 rounded-md bg-yellow-400/20 text-yellow-400 font-extrabold border border-yellow-400/30">
                                    TRIP IN PROGRESS • {activeTrip.status.replace("_", " ").toUpperCase()}
                                </span>
                                <h3 className="text-base font-black text-white mt-1">
                                    Passenger: {activeTrip.user_name} ({activeTrip.trip_type_name})
                                </h3>
                                <p className="text-xs text-gray-300">
                                    From: <strong className="text-white">{activeTrip.pickup}</strong> → To: <strong className="text-white">{activeTrip.destination}</strong>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsActiveTripOpen(true)}
                            className="px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs shrink-0 flex items-center justify-center gap-2 shadow-md shadow-yellow-400/30 transition"
                        >
                            Open Live Trip Manager
                            <ArrowRight size={15} />
                        </button>
                    </section>
                )}

                {/* =====================================================
                    KYC VERIFICATION CARD
                ===================================================== */}
                <section className="drivix-reveal">
                    <div className={`driver-verification-card p-6 rounded-3xl bg-[#151720] border flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                        stats.kycStatus === "verified"
                            ? "border-emerald-500/30"
                            : stats.kycStatus === "rejected"
                            ? "border-rose-500/40"
                            : "border-amber-500/30"
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                                stats.kycStatus === "verified"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : stats.kycStatus === "rejected"
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}>
                                <ShieldCheck size={28} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">
                                        DRIVER KYC & ENROLLMENT
                                    </p>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                        stats.kycStatus === "verified"
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                            : stats.kycStatus === "rejected"
                                            ? "bg-rose-500/10 text-rose-400 border-rose-500/40"
                                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    }`}>
                                        {stats.kycStatus === "verified"
                                            ? "KYC Approved by Admin"
                                            : stats.kycStatus === "rejected"
                                            ? "KYC Rejected by Admin"
                                            : stats.kycStatus === "under_review"
                                            ? "KYC Under Admin Review"
                                            : "KYC Pending Submission"}
                                    </span>
                                </div>
                                <h2 className="text-lg font-black text-white mt-0.5">
                                    {stats.kycStatus === "verified"
                                        ? "Government KYC & License Verified"
                                        : stats.kycStatus === "rejected"
                                        ? "Documents Rejected — Please Re-submit"
                                        : stats.kycStatus === "under_review"
                                        ? "KYC Submission Awaiting Admin Approval"
                                        : "KYC Incomplete — Submit Documents to Accept Rides"}
                                </h2>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    {stats.kycStatus === "verified"
                                        ? "Driving License & ID Proofs Active • Eligible to accept passenger bookings"
                                        : stats.kycStatus === "rejected"
                                        ? "Your submitted documents were not approved. Open KYC manager to review feedback and re-upload."
                                        : "Admin KYC approval is mandatory before you can view and accept booking requests."}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsKYCOpen(true)}
                            className="px-5 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-yellow-400 hover:text-yellow-300 text-xs font-extrabold border border-gray-700 flex items-center justify-center gap-2 transition"
                        >
                            <ClipboardCheck size={16} />
                            Manage KYC & Documents
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </section>

                {/* =====================================================
                    LIVE STATISTICS
                ===================================================== */}
                <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 drivix-reveal">
                    {/* Booking requests */}
                    <div
                        onClick={() => setIsRequestsOpen(true)}
                        className="p-5 rounded-2xl bg-[#151720] border border-gray-800 hover:border-yellow-400/40 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition">
                                <Navigation size={20} />
                            </div>
                            <span className="text-xs font-bold text-yellow-400 group-hover:underline flex items-center gap-1">
                                Open <ArrowRight size={12} />
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-4">City Booking Requests</p>
                        <h2 className="text-3xl font-black text-white mt-1">{stats.requestsCount}</h2>
                        <p className="text-xs text-gray-500 mt-1">Available in {driverProfile?.city || "Mumbai"}</p>
                    </div>

                    {/* Completed Trips */}
                    <div
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-5 rounded-2xl bg-[#151720] border border-gray-800 hover:border-gray-700 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-gray-800 text-gray-200 flex items-center justify-center group-hover:scale-110 transition">
                                <Clock3 size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 group-hover:text-white flex items-center gap-1">
                                View <ArrowRight size={12} />
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-4">Completed Rides</p>
                        <h2 className="text-3xl font-black text-white mt-1">{stats.completedTrips}</h2>
                        <p className="text-xs text-gray-500 mt-1">Total trips fulfilled</p>
                    </div>

                    {/* Lifetime Earnings */}
                    <div
                        onClick={() => setIsEarningsOpen(true)}
                        className="p-5 rounded-2xl bg-[#151720] border border-gray-800 hover:border-emerald-500/40 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                                <IndianRupee size={20} />
                            </div>
                            <span className="text-xs font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
                                Payouts <ArrowRight size={12} />
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-4">Driver Earnings</p>
                        <h2 className="text-3xl font-black text-emerald-400 mt-1">₹{stats.totalEarnings}</h2>
                        <p className="text-xs text-gray-500 mt-1">85% Net Partner Share</p>
                    </div>

                    {/* Driver Rating */}
                    <div
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-5 rounded-2xl bg-[#151720] border border-gray-800 hover:border-yellow-400/40 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 group-hover:text-white flex items-center gap-1">
                                Ratings <ArrowRight size={12} />
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-4">Customer Rating</p>
                        <h2 className="text-3xl font-black text-yellow-400 mt-1">{stats.rating}★</h2>
                        <p className="text-xs text-gray-500 mt-1">Top Tier Chauffeur</p>
                    </div>
                </section>

                {/* =====================================================
                    DRIVER TOOL MODULES
                ===================================================== */}
                <section className="space-y-4 drivix-reveal">
                    <div>
                        <p className="text-xs font-extrabold text-yellow-400 uppercase tracking-wider">
                            DRIVER CONTROL CENTER
                        </p>
                        <h2 className="text-2xl font-black text-white mt-1">
                            Everything you need on duty
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {/* Tool 1 */}
                        <div
                            onClick={() => setIsRequestsOpen(true)}
                            className="p-6 rounded-3xl bg-[#151720] border border-gray-800 hover:border-yellow-400/40 transition-all cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="text-lg font-black text-white mt-5">Booking Requests</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                    Review real-time passenger booking alerts in your city, check pickup & drop distances, and accept rides.
                                </p>
                            </div>
                            <button className="mt-5 px-4 py-2.5 rounded-xl bg-gray-800 group-hover:bg-yellow-400 group-hover:text-black text-gray-300 text-xs font-bold transition flex items-center justify-between">
                                <span>Browse Requests ({pendingRequestsCount})</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>

                        {/* Tool 2 */}
                        <div
                            onClick={() => {
                                if (activeTrip) setIsActiveTripOpen(true);
                                else setIsHistoryOpen(true);
                            }}
                            className="p-6 rounded-3xl bg-[#151720] border border-gray-800 hover:border-yellow-400/40 transition-all cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-800 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition">
                                    <Car size={24} />
                                </div>
                                <h3 className="text-lg font-black text-white mt-5">My Assigned Trips</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                    View active journeys, manage OTP start codes, progress stages (En route, Arrived, In-Progress), and complete trips.
                                </p>
                            </div>
                            <button className="mt-5 px-4 py-2.5 rounded-xl bg-gray-800 group-hover:bg-yellow-400 group-hover:text-black text-gray-300 text-xs font-bold transition flex items-center justify-between">
                                <span>{activeTrip ? "Manage Ongoing Ride" : "Trip History & Receipts"}</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>

                        {/* Tool 3 */}
                        <div
                            onClick={() => setIsEarningsOpen(true)}
                            className="p-6 rounded-3xl bg-[#151720] border border-gray-800 hover:border-yellow-400/40 transition-all cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                                    <IndianRupee size={24} />
                                </div>
                                <h3 className="text-lg font-black text-white mt-5">Driver Earnings & Payouts</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                    Track today's and weekly revenue, wallet balances, trip fares, and request instant bank/UPI payouts.
                                </p>
                            </div>
                            <button className="mt-5 px-4 py-2.5 rounded-xl bg-gray-800 group-hover:bg-yellow-400 group-hover:text-black text-gray-300 text-xs font-bold transition flex items-center justify-between">
                                <span>Track Earnings</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modals */}
            <DriverKYCModal
                isOpen={isKYCOpen}
                onClose={() => setIsKYCOpen(false)}
                onKYCUpdated={(newStatus) => {
                    setStats(prev => ({ ...prev, kycStatus: newStatus }));
                    showToast("KYC status updated!");
                }}
            />

            <DriverProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onProfileUpdated={(updated) => {
                    setDriverProfile(updated);
                    showToast("Profile details saved!");
                }}
            />

            <DriverRequestsModal
                isOpen={isRequestsOpen}
                onClose={() => setIsRequestsOpen(false)}
                driverCity={driverProfile?.city || "Mumbai"}
                onRequestAccepted={(bookingId) => {
                    showToast("Booking accepted! Loading live ride...");
                    loadDashboardData();
                    setIsActiveTripOpen(true);
                }}
            />

            <DriverActiveTripModal
                isOpen={isActiveTripOpen}
                onClose={() => setIsActiveTripOpen(false)}
                onTripStatusChanged={(status) => {
                    showToast(`Trip status: ${status.replace("_", " ").toUpperCase()}`);
                    loadDashboardData();
                }}
            />

            <DriverHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />

            <DriverEarningsModal
                isOpen={isEarningsOpen}
                onClose={() => setIsEarningsOpen(false)}
                onPayoutSuccess={() => {
                    showToast("Payout initiated successfully!");
                    loadDashboardData();
                }}
            />
        </div>
    );
};

export default DriverHome;