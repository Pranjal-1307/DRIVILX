import React, { useState, useEffect } from "react";
import {
    X,
    Clock,
    MapPin,
    Car,
    Star,
    CheckCircle2,
    Calendar,
    IndianRupee,
    User,
    RefreshCw,
    Search
} from "lucide-react";
import { driverService } from "../../services/driverService";

const DriverHistoryModal = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        fetchHistory();
    }, [isOpen]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await driverService.getTripHistory();
            if (res.success) {
                setHistory(res.history || []);
            }
        } catch (err) {
            console.error("Failed to load driver trip history", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filtered = history.filter(h =>
        (h.pickup || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.destination || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.user_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-[#12141a] border border-gray-800/90 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/30">
                            <Clock size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Booking & Trip History
                                <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-gray-700">
                                    {history.length} Trips
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">Review your past completed rides and customer ratings</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchHistory}
                            disabled={loading}
                            className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin text-yellow-400" : ""} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-gray-900/50 border-b border-gray-800">
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by customer, pickup, or destination..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white text-xs focus:outline-none focus:border-yellow-400"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
                    {loading && history.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <RefreshCw size={28} className="animate-spin text-yellow-400 mx-auto mb-3" />
                            <p className="text-sm">Loading trip history...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-gray-900/40 rounded-2xl border border-gray-800">
                            <Clock size={36} className="text-gray-600 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-gray-300">No Past Trips Found</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                Once you complete rides, your ride summaries, earnings, and ratings will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-5 bg-[#171a22] border border-gray-800 rounded-2xl hover:border-gray-700 transition"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                                                item.status === "completed"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}>
                                                {item.status === "completed" ? "Completed" : "Cancelled"}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar size={13} /> {item.created_at || item.booking_date}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs text-gray-400">Earned: </span>
                                            <span className="text-base font-black text-yellow-400">₹{item.driver_earning}</span>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                            <span className="text-gray-400 font-medium">Pickup: </span>
                                            <span className="text-gray-200 font-semibold">{item.pickup}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1 shrink-0" />
                                            <span className="text-gray-400 font-medium">Drop: </span>
                                            <span className="text-gray-200 font-semibold">{item.destination}</span>
                                        </div>
                                    </div>

                                    {/* Customer & Rating info */}
                                    <div className="mt-3 pt-3 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <User size={13} className="text-yellow-400" />
                                            <span>Passenger: <strong className="text-gray-200">{item.user_name}</strong></span>
                                        </div>

                                        {item.review ? (
                                            <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20 font-bold">
                                                <Star size={13} fill="currentColor" />
                                                <span>{item.review.rating}★ Rated</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">No review left</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverHistoryModal;
