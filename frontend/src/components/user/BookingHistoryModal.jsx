import React, { useState, useEffect } from "react";
import {
    X,
    ClipboardList,
    MapPin,
    Navigation,
    CreditCard,
    Star,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    Eye,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { bookingService } from "../../services/bookingService";

const BookingHistoryModal = ({
    isOpen,
    onClose,
    onPayRemaining,
    onReviewClick
}) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all"); // all, active, completed, cancelled
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        fetchBookings();
    }, [isOpen]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await bookingService.getMyBookings();
            if (res.success) {
                setBookings(res.bookings || []);
            }
        } catch (err) {
            console.error("Failed to load booking history", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter((b) => {
        if (filter === "all") return true;
        if (filter === "active") return ["driver_assigned", "on_the_way", "arrived", "in_progress"].includes(b.status);
        if (filter === "completed") return b.status === "completed";
        if (filter === "cancelled") return b.status === "cancelled";
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Booking & Payment History</h2>
                            <p className="text-xs text-zinc-400">View past journeys, receipts and settle pending balances</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/30 text-xs">
                    {[
                        { key: "all", label: `All Rides (${bookings.length})` },
                        { key: "active", label: "Active Trips" },
                        { key: "completed", label: "Completed" },
                        { key: "cancelled", label: "Cancelled" }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                                filter === tab.key
                                    ? "bg-yellow-400 text-black shadow-sm"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                            <Loader2 size={32} className="animate-spin text-yellow-400" />
                            <span className="text-xs">Fetching your booking logs...</span>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="py-16 text-center text-zinc-400 space-y-2">
                            <ClipboardList size={40} className="mx-auto text-zinc-600 mb-2" />
                            <h3 className="text-base font-semibold text-white">No bookings found</h3>
                            <p className="text-xs max-w-sm mx-auto text-zinc-500">
                                You haven't booked any trips matching this filter yet. Ready for your next journey?
                            </p>
                        </div>
                    ) : (
                        filteredBookings.map((b) => {
                            const fare = b.fare || {};
                            return (
                                <div
                                    key={b.id}
                                    className="p-5 bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl transition space-y-3"
                                >
                                    {/* Top Row: Date, ID, Status */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Clock size={13} className="text-yellow-400" />
                                            <span>{b.booking_date} • {b.booking_time}</span>
                                            <span className="font-mono text-[11px] text-zinc-500">#{b.id.slice(-6)}</span>
                                        </div>
                                        <span className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                            b.status === "completed"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                : b.status === "cancelled"
                                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                                : "bg-yellow-400/10 text-yellow-400 border-yellow-400/30 animate-pulse"
                                        }`}>
                                            {b.status?.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Middle: Route & Driver */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                                        <div className="md:col-span-7 space-y-1.5">
                                            <div className="flex items-start gap-2 text-zinc-200">
                                                <MapPin size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                                                <span className="truncate">{b.pickup}</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-zinc-200">
                                                <Navigation size={13} className="text-red-400 mt-0.5 shrink-0" />
                                                <span className="truncate">{b.destination}</span>
                                            </div>
                                            <div className="text-[11px] text-zinc-400 pt-1">
                                                Vehicle: <strong className="text-white">{b.vehicle_type}</strong> • Service: <strong className="text-yellow-400">{b.trip_type_name}</strong>
                                            </div>
                                        </div>

                                        <div className="md:col-span-5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                                            {b.driver ? (
                                                <div className="flex items-center gap-2.5">
                                                    <img
                                                        src={b.driver.avatar}
                                                        alt={b.driver.name}
                                                        className="w-8 h-8 rounded-full object-cover border border-yellow-400"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-white text-xs flex items-center gap-1">
                                                            {b.driver.name}
                                                            <ShieldCheck size={12} className="text-emerald-400" />
                                                        </div>
                                                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                            <Star size={10} className="text-yellow-400 fill-yellow-400" /> {b.driver.rating} • {b.driver.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-500 italic">Driver not assigned yet</span>
                                            )}

                                            <div className="pt-2 border-t border-zinc-800 flex justify-between text-[11px]">
                                                <span className="text-zinc-400">Total Fare:</span>
                                                <span className="font-bold text-white">₹{fare.total_fare || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom: Payment Breakdown & Action Buttons */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
                                        <div className="flex items-center gap-3 text-[11px]">
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Advance: ₹{fare.advance_amount || 0} Paid
                                            </span>
                                            {b.remaining_paid ? (
                                                <span className="text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Balance: ₹{fare.remaining_amount || 0} Paid
                                                </span>
                                            ) : (
                                                <span className="text-yellow-400">
                                                    Balance: ₹{fare.remaining_amount || 0} Pending
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Pay Remaining Button */}
                                            {b.status === "completed" && !b.remaining_paid && (
                                                <button
                                                    onClick={() => {
                                                        onPayRemaining(b);
                                                        onClose();
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs flex items-center gap-1 transition"
                                                >
                                                    <CreditCard size={12} /> Pay Balance ₹{fare.remaining_amount}
                                                </button>
                                            )}

                                            {/* Rate & Review Button */}
                                            {b.status === "completed" && b.remaining_paid && !b.review && (
                                                <button
                                                    onClick={() => {
                                                        onReviewClick(b);
                                                        onClose();
                                                    }}
                                                    className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-lg text-xs flex items-center gap-1 transition"
                                                >
                                                    <Star size={12} className="fill-black" /> Rate Driver
                                                </button>
                                            )}

                                            {b.review && (
                                                <span className="text-[11px] text-yellow-400 flex items-center gap-1 font-semibold">
                                                    <Star size={11} className="fill-yellow-400" /> Rated {b.review.rating}★
                                                </span>
                                            )}

                                            <button
                                                onClick={() => setSelectedReceipt(b)}
                                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center gap-1 transition border border-zinc-700"
                                            >
                                                <Eye size={12} /> Receipt
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Receipt Modal Overlay */}
                {selectedReceipt && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4 text-white shadow-2xl">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                <div>
                                    <h3 className="font-bold text-base text-yellow-400">DRIVIX TAX INVOICE</h3>
                                    <p className="text-[10px] text-zinc-400">Booking #{selectedReceipt.id.slice(-8)}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReceipt(null)}
                                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Date & Time:</span>
                                    <span className="text-white">{selectedReceipt.booking_date} {selectedReceipt.booking_time}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Route:</span>
                                    <span className="text-white text-right max-w-[200px] truncate">{selectedReceipt.pickup} → {selectedReceipt.destination}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Vehicle Category:</span>
                                    <span className="text-white">{selectedReceipt.vehicle_type}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Advance Txn ID:</span>
                                    <span className="font-mono text-zinc-300">{selectedReceipt.advance_payment_id || "PAID"}</span>
                                </div>
                                {selectedReceipt.remaining_paid && (
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Balance Txn ID:</span>
                                        <span className="font-mono text-zinc-300">{selectedReceipt.remaining_payment_id}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Base Fare:</span>
                                    <span>₹{selectedReceipt.fare?.base_price || 0}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Distance Charge:</span>
                                    <span>₹{selectedReceipt.fare?.distance_cost || 0}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>GST (5%):</span>
                                    <span>₹{selectedReceipt.fare?.tax || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-white border-t border-zinc-800 pt-1.5">
                                    <span>Total Amount:</span>
                                    <span className="text-yellow-400">₹{selectedReceipt.fare?.total_fare || 0}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs rounded-xl transition"
                            >
                                Close Receipt
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingHistoryModal;
