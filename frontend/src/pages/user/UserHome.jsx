import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
    Car,
    ClipboardList,
    CreditCard,
    MapPin,
    CalendarDays,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Clock3,
    ChevronRight,
    Bell,
    User,
    Star,
    CheckCircle2,
    Zap,
    Navigation,
    PhoneCall,
    Award
} from "lucide-react";

import BookingModal from "../../components/user/BookingModal";
import ActiveTripCard from "../../components/user/ActiveTripCard";
import ProfileModal from "../../components/user/ProfileModal";
import BookingHistoryModal from "../../components/user/BookingHistoryModal";
import PayRemainingModal from "../../components/user/PayRemainingModal";
import ReviewModal from "../../components/user/ReviewModal";
import NotificationDrawer from "../../components/user/NotificationDrawer";
import { bookingService } from "../../services/bookingService";
import { userService } from "../../services/userService";

const UserHome = () => {
    const { user, login } = useAuth();

    // Modals state
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isNotifsOpen, setIsNotifsOpen] = useState(false);
    const [payRemainingBooking, setPayRemainingBooking] = useState(null);
    const [reviewBooking, setReviewBooking] = useState(null);

    // Dynamic data
    const [activeTrip, setActiveTrip] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [stats, setStats] = useState({
        totalRides: 0,
        completedRides: 0,
        totalSpent: 0,
        activeRides: 0
    });
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [toastMessage, setToastMessage] = useState("");

    // Load initial user data and bookings with live polling for active/searching trips
    useEffect(() => {
        fetchDashboardData();
        fetchNotificationsCount();

        // Polling every 4 seconds to live-sync driver acceptance & trip progression
        const interval = setInterval(() => {
            fetchDashboardData();
            fetchNotificationsCount();
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await bookingService.getMyBookings();
            if (res.success && res.bookings) {
                const list = res.bookings;
                setRecentBookings(list.slice(0, 5));

                // Find currently active trip (if any)
                const active = list.find((b) =>
                    ["pending_advance", "searching", "driver_assigned", "on_the_way", "arrived", "in_progress"].includes(b.status) ||
                    (b.status === "completed" && (!b.remaining_paid || !b.review))
                );
                setActiveTrip(active || null);

                // Calculate dynamic stats
                const completed = list.filter((b) => b.status === "completed");
                const spent = completed.reduce((acc, curr) => acc + (curr.fare?.total_fare || 0), 0);
                const activeCount = list.filter((b) =>
                    ["searching", "driver_assigned", "on_the_way", "arrived", "in_progress"].includes(b.status)
                ).length;

                setStats({
                    totalRides: list.length,
                    completedRides: completed.length,
                    totalSpent: spent,
                    activeRides: activeCount
                });
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        }
    };

    const fetchNotificationsCount = async () => {
        try {
            const res = await bookingService.getNotifications();
            if (res.success && res.notifications) {
                const unread = res.notifications.filter((n) => !n.is_read).length;
                setUnreadNotifsCount(unread);
            }
        } catch (err) {
            console.error("Failed to load notification count", err);
        }
    };

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 5000);
    };

    // Handle new booking completed
    const handleBookingSuccess = ({ bookingId, driver, fare }) => {
        if (driver && driver.name) {
            triggerToast(`🎉 Booking confirmed! ${driver.name} has been assigned.`);
        } else {
            triggerToast(`🎉 Advance payment confirmed! Searching for nearby verified drivers...`);
        }
        fetchDashboardData();
        fetchNotificationsCount();
    };

    return (
        <div className="drivix-dashboard user-dashboard min-h-screen bg-[#070709] text-white">
            <Navbar />

            {/* Notification & Profile Quick Bar */}
            <div className="max-w-7xl mx-auto px-5 md:px-6 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Chauffeur Network: <strong className="text-white">Active & Ready</strong></span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsNotifsOpen(true)}
                        className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-400/40 text-zinc-300 hover:text-white transition"
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadNotifsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black shadow">
                                {unreadNotifsCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-400/40 text-xs font-semibold text-zinc-200 transition"
                    >
                        <User size={15} className="text-yellow-400" />
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-5 md:px-6 py-6 md:py-8 space-y-8">
                
                {/* Toast Notification Banner */}
                {toastMessage && (
                    <div className="flex items-center justify-between p-4 bg-yellow-400 text-black font-bold rounded-2xl shadow-xl animate-fadeIn">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} />
                            <span>{toastMessage}</span>
                        </div>
                        <button onClick={() => setToastMessage("")} className="text-black/70 hover:text-black">✕</button>
                    </div>
                )}

                {/* ACTIVE LIVE TRIP TRACKER (If active trip exists) */}
                {activeTrip && (
                    <ActiveTripCard
                        booking={activeTrip}
                        onPayRemainingClick={(b) => setPayRemainingBooking(b)}
                        onReviewClick={(b) => setReviewBooking(b)}
                    />
                )}

                {/* HERO SECTION */}
                <section className="user-hero drivix-reveal relative overflow-hidden rounded-3xl p-8 md:p-12 border border-zinc-800/90 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black">
                    <div className="user-hero-grid" />
                    <div className="user-glow user-glow-one" />
                    <div className="user-glow user-glow-two" />

                    <div className="relative z-10 max-w-3xl space-y-6">
                        <div className="dashboard-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold tracking-wider">
                            <Sparkles size={14} />
                            DRIVIX DYNAMIC USER PORTAL
                        </div>

                        <div>
                            <p className="text-zinc-400 text-sm">Welcome back,</p>
                            <h1 className="text-3xl sm:text-5xl font-black text-white mt-1 leading-tight tracking-tight">
                                Hello, <span className="text-yellow-400">{user?.name || "Customer"}</span> 👋
                            </h1>
                        </div>

                        <p className="text-zinc-300 max-w-xl text-sm sm:text-base leading-relaxed">
                            Book a certified professional driver for your personal car on-demand. Enjoy doorstep pickup, transparent route fare estimates, and safe verified journeys.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <button
                                onClick={() => setIsBookingOpen(true)}
                                className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-2xl flex items-center gap-2.5 shadow-xl shadow-yellow-400/20 transition transform hover:-translate-y-0.5 text-sm"
                            >
                                <Car size={18} />
                                Book a Driver Now
                                <ArrowRight size={16} />
                            </button>

                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold rounded-2xl flex items-center gap-2 text-sm transition"
                            >
                                <ClipboardList size={17} />
                                My Bookings & History
                            </button>

                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="px-5 py-3.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-2xl flex items-center gap-2 text-sm transition"
                            >
                                <User size={16} className="text-yellow-400" />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </section>

                {/* DYNAMIC METRICS / STATS */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                            <span>TOTAL BOOKINGS</span>
                            <ClipboardList size={16} className="text-yellow-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-white mt-2">{stats.totalRides}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Lifetime journeys booked</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                            <span>COMPLETED TRIPS</span>
                            <CheckCircle2 size={16} className="text-emerald-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{stats.completedRides}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Successfully finished rides</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                            <span>TOTAL SPENT</span>
                            <CreditCard size={16} className="text-yellow-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-white mt-2">₹{stats.totalSpent}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Across all completed rides</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                            <span>ACTIVE RIDES</span>
                            <Car size={16} className="text-cyan-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2">{stats.activeRides}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{stats.activeRides > 0 ? "Ride in progress" : "No active trip"}</p>
                    </div>
                </section>

                {/* QUICK ACTION CARDS */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => setIsBookingOpen(true)}
                        className="p-6 rounded-2xl bg-gradient-to-b from-yellow-400/10 to-zinc-900 border border-yellow-400/30 hover:border-yellow-400 cursor-pointer transition transform hover:-translate-y-1 space-y-3 group"
                    >
                        <div className="p-3 w-fit rounded-xl bg-yellow-400 text-black shadow-lg">
                            <Car size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition">Create Booking Request</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Specify pickup, drop location, select date & time, view real-time dynamic fare estimation, and pay advance booking amount.
                        </p>
                        <div className="text-xs font-bold text-yellow-400 flex items-center gap-1 pt-1">
                            Book Driver Now <ArrowRight size={14} />
                        </div>
                    </div>

                    <div
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition transform hover:-translate-y-1 space-y-3 group"
                    >
                        <div className="p-3 w-fit rounded-xl bg-zinc-800 text-yellow-400 border border-zinc-700">
                            <ClipboardList size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition">History & Payments</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Access full logs of upcoming and completed journeys, invoices, transaction receipts, and settle remaining amounts.
                        </p>
                        <div className="text-xs font-bold text-zinc-300 flex items-center gap-1 pt-1">
                            View All Bookings <ArrowRight size={14} />
                        </div>
                    </div>

                    <div
                        onClick={() => setIsProfileOpen(true)}
                        className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition transform hover:-translate-y-1 space-y-3 group"
                    >
                        <div className="p-3 w-fit rounded-xl bg-zinc-800 text-emerald-400 border border-zinc-700">
                            <ShieldCheck size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition">Profile & Preferences</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Manage your contact information, emergency contacts, saved default pickup address, and preferred car transmission type.
                        </p>
                        <div className="text-xs font-bold text-zinc-300 flex items-center gap-1 pt-1">
                            Manage Profile <ArrowRight size={14} />
                        </div>
                    </div>
                </section>

                {/* RECENT BOOKINGS PREVIEW TABLE */}
                <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400">
                                <Clock3 size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Recent Activity & Trips</h3>
                                <p className="text-xs text-zinc-400">Your latest driver assignments and trip records</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1"
                        >
                            View All ({stats.totalRides}) <ChevronRight size={14} />
                        </button>
                    </div>

                    {recentBookings.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 space-y-2">
                            <p className="text-xs">No recent trips found. Create your first booking!</p>
                            <button
                                onClick={() => setIsBookingOpen(true)}
                                className="px-4 py-2 bg-yellow-400 text-black font-bold text-xs rounded-xl"
                            >
                                Book Now
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentBookings.map((b) => (
                                <div
                                    key={b.id}
                                    className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <MapPin size={13} className="text-emerald-400" />
                                            <span className="font-semibold text-white truncate max-w-xs">{b.pickup}</span>
                                            <span className="text-zinc-500">→</span>
                                            <span className="font-semibold text-white truncate max-w-xs">{b.destination}</span>
                                        </div>
                                        <div className="text-zinc-500 text-[11px]">
                                            {b.booking_date} • {b.vehicle_type} • {b.driver?.name || "Driver Assigned"}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-white">₹{b.fare?.total_fare || 0}</p>
                                            <span className="text-[10px] text-zinc-400 capitalize">{b.status?.replace("_", " ")}</span>
                                        </div>

                                        {b.status === "completed" && !b.remaining_paid && (
                                            <button
                                                onClick={() => setPayRemainingBooking(b)}
                                                className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs"
                                            >
                                                Pay Balance
                                            </button>
                                        )}

                                        {b.status === "completed" && b.remaining_paid && !b.review && (
                                            <button
                                                onClick={() => setReviewBooking(b)}
                                                className="px-3 py-1.5 bg-yellow-400 text-black font-bold rounded-lg text-xs flex items-center gap-1"
                                            >
                                                <Star size={11} className="fill-black" /> Rate Driver
                                            </button>
                                        )}

                                        {b.review && (
                                            <span className="text-yellow-400 text-[11px] font-bold flex items-center gap-0.5">
                                                <Star size={11} className="fill-yellow-400" /> {b.review.rating}★
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* MODALS */}
            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                onBookingSuccess={handleBookingSuccess}
            />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onProfileUpdated={() => fetchDashboardData()}
            />

            <BookingHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                onPayRemaining={(b) => setPayRemainingBooking(b)}
                onReviewClick={(b) => setReviewBooking(b)}
            />

            <PayRemainingModal
                isOpen={!!payRemainingBooking}
                booking={payRemainingBooking}
                onClose={() => setPayRemainingBooking(null)}
                onPaymentSuccess={() => {
                    triggerToast("Remaining payment completed successfully!");
                    fetchDashboardData();
                    fetchNotificationsCount();
                }}
            />

            <ReviewModal
                isOpen={!!reviewBooking}
                booking={reviewBooking}
                onClose={() => setReviewBooking(null)}
                onReviewSubmitted={() => {
                    triggerToast("Thank you! Your driver review was recorded.");
                    fetchDashboardData();
                }}
            />

            <NotificationDrawer
                isOpen={isNotifsOpen}
                onClose={() => setIsNotifsOpen(false)}
                onNotificationClick={() => {
                    setIsNotifsOpen(false);
                    setIsHistoryOpen(true);
                }}
            />
        </div>
    );
};

export default UserHome;
