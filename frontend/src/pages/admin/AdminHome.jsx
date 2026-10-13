import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/navbar/Navbar";
import { adminService } from "../../services/adminService";
import {
    Users,
    Car,
    CalendarCheck,
    IndianRupee,
    ShieldCheck,
    BarChart3,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    Filter,
    RefreshCw,
    TrendingUp,
    Clock,
    MapPin,
    Phone,
    Mail,
    FileText,
    Trash2,
    UserX,
    UserCheck,
    Sparkles,
    Eye,
    ChevronRight,
    ArrowUpRight,
    Award,
    ShieldAlert,
    Star,
    Layers,
    Percent
} from "lucide-react";

const AdminHome = () => {
    const [activeTab, setActiveTab] = useState("overview"); // overview, kyc, users, drivers, bookings
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState(null);

    // Analytics State
    const [analytics, setAnalytics] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Users State
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState("");
    const [userStatusFilter, setUserStatusFilter] = useState("all");

    // Drivers State
    const [drivers, setDrivers] = useState([]);
    const [driverSearch, setDriverSearch] = useState("");
    const [driverKycFilter, setDriverKycFilter] = useState("all");
    const [driverStatusFilter, setDriverStatusFilter] = useState("all");

    // Bookings State
    const [bookings, setBookings] = useState([]);
    const [bookingStatusFilter, setBookingStatusFilter] = useState("all");

    // Modals
    const [rejectModal, setRejectModal] = useState({ open: false, driverId: null, driverName: "", reason: "" });
    const [deleteModal, setDeleteModal] = useState({ open: false, type: "", id: null, name: "" });
    const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Fetch all Admin Data
    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, usersRes, driversRes, bookingsRes] = await Promise.all([
                adminService.getAnalytics().catch(() => ({ analytics: null })),
                adminService.getUsers().catch(() => ({ users: [] })),
                adminService.getDrivers().catch(() => ({ drivers: [] })),
                adminService.getBookings().catch(() => ({ bookings: [] }))
            ]);

            if (analyticsRes?.analytics) setAnalytics(analyticsRes.analytics);
            if (usersRes?.users) setUsers(usersRes.users);
            if (driversRes?.drivers) setDrivers(driversRes.drivers);
            if (bookingsRes?.bookings) setBookings(bookingsRes.bookings);
        } catch (err) {
            showToast("Failed to load some dashboard data", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleManualRefresh = () => {
        setRefreshing(true);
        fetchAdminData();
    };

    // =========================================================================
    // KYC ACTIONS
    // =========================================================================
    const handleApproveKYC = async (driverId, driverName) => {
        try {
            await adminService.updateDriverKYC(driverId, "approve");
            showToast(`KYC Approved for ${driverName}! Driver is now verified.`);
            // Update local state
            setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, kyc_status: "verified", badge: "Verified Pro Driver" } : d));
            if (analytics?.summary) {
                setAnalytics(prev => ({
                    ...prev,
                    summary: { ...prev.summary, pending_kyc: Math.max(0, prev.summary.pending_kyc - 1) }
                }));
            }
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to approve KYC", "error");
        }
    };

    const handleOpenRejectModal = (driver) => {
        setRejectModal({
            open: true,
            driverId: driver.id,
            driverName: driver.name,
            reason: ""
        });
    };

    const handleConfirmRejectKYC = async () => {
        if (!rejectModal.driverId) return;
        try {
            await adminService.updateDriverKYC(rejectModal.driverId, "reject", rejectModal.reason);
            showToast(`KYC for ${rejectModal.driverName} has been rejected.`);
            setDrivers(prev => prev.map(d => d.id === rejectModal.driverId ? { ...d, kyc_status: "rejected", rejection_reason: rejectModal.reason } : d));
            setRejectModal({ open: false, driverId: null, driverName: "", reason: "" });
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to reject KYC", "error");
        }
    };

    // =========================================================================
    // USER ACTIONS (SUSPEND & DELETE)
    // =========================================================================
    const handleToggleUserSuspend = async (user) => {
        const targetSuspended = !user.is_suspended;
        try {
            await adminService.suspendUser(user.id, targetSuspended);
            showToast(`User ${user.name} ${targetSuspended ? "suspended" : "activated"} successfully.`);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_suspended: targetSuspended } : u));
        } catch (err) {
            showToast(err.response?.data?.error || "Action failed", "error");
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await adminService.deleteUser(userId);
            showToast("User deleted successfully.");
            setUsers(prev => prev.filter(u => u.id !== userId));
            setDeleteModal({ open: false, type: "", id: null, name: "" });
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to delete user", "error");
        }
    };

    // =========================================================================
    // DRIVER ACTIONS (SUSPEND & DELETE)
    // =========================================================================
    const handleToggleDriverSuspend = async (driver) => {
        const targetSuspended = !driver.is_suspended;
        try {
            await adminService.suspendDriver(driver.id, targetSuspended);
            showToast(`Driver ${driver.name} ${targetSuspended ? "suspended" : "activated"} successfully.`);
            setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, is_suspended: targetSuspended } : d));
        } catch (err) {
            showToast(err.response?.data?.error || "Action failed", "error");
        }
    };

    const handleDeleteDriver = async (driverId) => {
        try {
            await adminService.deleteDriver(driverId);
            showToast("Driver removed successfully.");
            setDrivers(prev => prev.filter(d => d.id !== driverId));
            setDeleteModal({ open: false, type: "", id: null, name: "" });
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to delete driver", "error");
        }
    };

    // =========================================================================
    // FILTERED LISTS
    // =========================================================================
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                user.phone.includes(userSearch) ||
                user.city.toLowerCase().includes(userSearch.toLowerCase());
            
            if (!matchesSearch) return false;
            if (userStatusFilter === "active") return !user.is_suspended;
            if (userStatusFilter === "suspended") return user.is_suspended;
            return true;
        });
    }, [users, userSearch, userStatusFilter]);

    const filteredDrivers = useMemo(() => {
        return drivers.filter(driver => {
            const matchesSearch =
                driver.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                driver.email.toLowerCase().includes(driverSearch.toLowerCase()) ||
                driver.phone.includes(driverSearch) ||
                driver.city.toLowerCase().includes(driverSearch.toLowerCase()) ||
                driver.license_number.toLowerCase().includes(driverSearch.toLowerCase());

            if (!matchesSearch) return false;
            if (driverKycFilter !== "all" && driver.kyc_status !== driverKycFilter) return false;
            if (driverStatusFilter === "active" && driver.is_suspended) return false;
            if (driverStatusFilter === "suspended" && !driver.is_suspended) return false;
            if (["available", "busy", "offline"].includes(driverStatusFilter) && driver.status !== driverStatusFilter) return false;
            return true;
        });
    }, [drivers, driverSearch, driverKycFilter, driverStatusFilter]);

    const pendingKycDrivers = useMemo(() => {
        return drivers.filter(d => ["pending", "under_review", "submitted"].includes(d.kyc_status));
    }, [drivers]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (bookingStatusFilter !== "all" && b.status !== bookingStatusFilter) return false;
            return true;
        });
    }, [bookings, bookingStatusFilter]);

    // Max Monthly Bookings for chart bar percentage scaling
    const maxMonthlyBookings = useMemo(() => {
        if (!analytics?.monthly_data) return 100;
        const maxVal = Math.max(...analytics.monthly_data.map(d => d.bookings || 0));
        return maxVal > 0 ? maxVal : 100;
    }, [analytics]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
            <Navbar />

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
                    toast.type === "error"
                        ? "bg-rose-900/90 text-rose-100 border-rose-700"
                        : "bg-emerald-900/90 text-emerald-100 border-emerald-700"
                }`}>
                    {toast.type === "error" ? <AlertTriangle size={20} className="text-rose-400" /> : <CheckCircle2 size={20} className="text-emerald-400" />}
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* =========================================================================
                    HEADER HERO SECTION
                ========================================================================= */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-10 border border-slate-800 shadow-2xl mb-8">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
                                <Sparkles size={14} /> Platform Control Engine
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                                DRIVIX <span className="text-amber-400">Admin Portal</span>
                            </h1>
                            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
                                Real-time oversight, KYC approvals, dynamic driver/user management, and revenue analytics.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={refreshing ? "animate-spin text-amber-400" : ""} />
                                {refreshing ? "Refreshing..." : "Sync Live Data"}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 sm:gap-4 mt-8 border-t border-slate-800/80 pt-6 overflow-x-auto no-scrollbar">
                        {[
                            { id: "overview", label: "Dashboard Analytics", icon: BarChart3 },
                            { id: "kyc", label: `Driver KYC Review (${pendingKycDrivers.length})`, icon: ShieldCheck, badge: pendingKycDrivers.length > 0 },
                            { id: "users", label: `Manage Users (${users.length})`, icon: Users },
                            { id: "drivers", label: `Manage Drivers (${drivers.length})`, icon: Car },
                            { id: "bookings", label: `All Bookings (${bookings.length})`, icon: CalendarCheck },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                        isActive
                                            ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-bold"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                    }`}
                                >
                                    <Icon size={17} />
                                    {tab.label}
                                    {tab.badge && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-rose-500 text-white rounded-full font-bold animate-pulse">
                                            {pendingKycDrivers.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* =========================================================================
                    TAB 1: DASHBOARD ANALYTICS
                ========================================================================= */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        {/* Summary Metrics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                                        <Users size={22} />
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp size={12} className="mr-1" /> {analytics?.summary?.user_growth || "+18%"}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black text-white mt-4">{analytics?.summary?.total_users ?? users.length}</h3>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Total Registered Customers</p>
                            </div>

                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
                                        <Car size={22} />
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp size={12} className="mr-1" /> {analytics?.summary?.driver_growth || "+12%"}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black text-white mt-4">{analytics?.summary?.total_drivers ?? drivers.length}</h3>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Enrolled Drivers</p>
                            </div>

                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                        <CalendarCheck size={22} />
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp size={12} className="mr-1" /> {analytics?.summary?.booking_growth || "+25%"}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black text-white mt-4">{analytics?.summary?.total_bookings ?? bookings.length}</h3>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Total Bookings Completed</p>
                            </div>

                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                        <IndianRupee size={22} />
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp size={12} className="mr-1" /> {analytics?.summary?.revenue_growth || "+30%"}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black text-emerald-400 mt-4">
                                    ₹{Number(analytics?.summary?.total_revenue || 0).toLocaleString("en-IN")}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Gross Booking Value</p>
                            </div>
                        </div>

                        {/* Revenue Share & Commission Engine */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/30 p-6 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-300">DRIVIX Net Commission (15%)</h4>
                                    <Percent size={18} className="text-amber-400" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-3">
                                    ₹{Number(analytics?.summary?.platform_revenue || 0).toLocaleString("en-IN")}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">Platform gross profit retained from trip commissions</p>
                            </div>

                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-300">Driver Total Payouts (85%)</h4>
                                    <IndianRupee size={18} className="text-sky-400" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-sky-400 mt-3">
                                    ₹{Number(analytics?.summary?.driver_payouts || 0).toLocaleString("en-IN")}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">Direct earnings disbursed to verified partner chauffeurs</p>
                            </div>

                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-300">Active Live Trips</h4>
                                    <Clock size={18} className="text-emerald-400" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-3">
                                    {analytics?.summary?.active_bookings ?? 0} In Progress
                                </p>
                                <p className="text-xs text-slate-400 mt-2">Current live rides ongoing across all operating regions</p>
                            </div>
                        </div>

                        {/* Monthly Booking Trends & Driver Enrollment Visualization */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Monthly Breakdown Chart (2 Cols) */}
                            <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <TrendingUp size={20} className="text-amber-400" /> Monthly Bookings & Revenue Trend
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">Breakdown of ride demand and gross turnover across months</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
                                        {[new Date().getFullYear(), new Date().getFullYear() - 1].map(yr => (
                                            <button
                                                key={yr}
                                                onClick={() => setSelectedYear(yr)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                                    selectedYear === yr ? "bg-amber-400 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-white"
                                                }`}
                                            >
                                                {yr}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Bar Visualization */}
                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-end h-56 pt-8 pb-2 border-b border-slate-800">
                                    {(analytics?.monthly_data || []).map((item) => {
                                        const heightPercent = Math.min(100, Math.max(12, Math.round((item.bookings / maxMonthlyBookings) * 100)));
                                        return (
                                            <div key={item.month} className="flex flex-col items-center h-full justify-end group relative">
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 text-white text-[10px] p-2 rounded-lg pointer-events-none z-20 whitespace-nowrap shadow-xl">
                                                    <p className="font-bold text-amber-400">{item.month}</p>
                                                    <p>{item.bookings} Bookings</p>
                                                    <p>₹{item.revenue.toLocaleString()} Rev</p>
                                                </div>

                                                <div className="w-full max-w-[28px] bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                                                    <div
                                                        style={{ height: `${heightPercent}%` }}
                                                        className="w-full bg-gradient-to-t from-amber-500 to-amber-300 group-hover:from-amber-400 group-hover:to-amber-200 transition-all rounded-t-md"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400 mt-2">{item.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-400 mt-4 px-2">
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded bg-amber-400" /> Booking Volume
                                    </span>
                                    <span>Average Monthly Growth: <strong className="text-emerald-400">+22.4%</strong></span>
                                </div>
                            </div>

                            {/* Driver & User Enrollment Trajectory */}
                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Award size={20} className="text-sky-400" /> Driver Enrollment Trend
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Driver vs Customer onboarding trajectory</p>

                                    <div className="space-y-4 mt-6">
                                        {(analytics?.monthly_data?.slice(-4) || []).map((m) => (
                                            <div key={m.month} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                                                    <span>{m.month} Growth</span>
                                                    <span className="text-amber-400">+{m.driver_enrollments} Drivers / +{m.user_enrollments} Users</span>
                                                </div>
                                                <div className="w-full bg-slate-700/50 h-2 rounded-full mt-2 overflow-hidden flex">
                                                    <div
                                                        style={{ width: `${Math.min(100, m.driver_enrollments * 8)}%` }}
                                                        className="bg-sky-400 h-full"
                                                        title="Drivers"
                                                    />
                                                    <div
                                                        style={{ width: `${Math.min(100, m.user_enrollments * 5)}%` }}
                                                        className="bg-amber-400 h-full"
                                                        title="Users"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-sky-400" /> Drivers</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400" /> Customers</span>
                                </div>
                            </div>
                        </div>

                        {/* Peak Booking Trends & Top Cities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Peak Hour Trends */}
                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                                    <Clock size={20} className="text-amber-400" /> Peak Booking Trends (Hourly Heatmap)
                                </h3>
                                <p className="text-xs text-slate-400 mb-5">Times of day with highest driver requests</p>

                                <div className="space-y-3.5">
                                    {(analytics?.peak_hours || []).map((slot) => (
                                        <div key={slot.slot} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className="text-slate-200">{slot.slot}</span>
                                                <span className="text-amber-400 font-bold">{slot.percentage}% Share</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${slot.percentage}%` }}
                                                    className={`h-full rounded-full ${
                                                        slot.percentage > 30
                                                            ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                                            : "bg-gradient-to-r from-amber-500 to-amber-400"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* City Share & Yearly Comparison */}
                            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                                        <MapPin size={20} className="text-emerald-400" /> City-wise Booking Distribution
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-5">Major metro markets contribution</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        {(analytics?.top_cities || [
                                            { city: "Mumbai", share: 42 },
                                            { city: "Pune", share: 25 },
                                            { city: "Delhi NCR", share: 18 },
                                            { city: "Bengaluru", share: 15 }
                                        ]).map(city => (
                                            <div key={city.city} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
                                                <p className="text-2xl font-black text-amber-400">{city.share}%</p>
                                                <p className="text-xs font-bold text-slate-300 mt-1">{city.city}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                    <span>Highest Demand Hub: <strong className="text-amber-400">Mumbai MMR</strong></span>
                                    <span>Fleet Utilization: <strong className="text-emerald-400">89.2%</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    TAB 2: DRIVER KYC & ENROLLMENT REVIEW
                ========================================================================= */}
                {activeTab === "kyc" && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ShieldCheck size={22} className="text-amber-400" /> Driver KYC & Enrollment Verification
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Review licenses, police verifications and approve or reject partner drivers</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold">
                                    {pendingKycDrivers.length} Pending Actions
                                </span>
                            </div>
                        </div>

                        {drivers.length === 0 ? (
                            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                                <Car size={40} className="mx-auto text-slate-600 mb-3" />
                                <p className="text-slate-400 font-medium">No driver enrollments registered yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {drivers.map(driver => {
                                    const isPending = ["pending", "under_review", "submitted"].includes(driver.kyc_status);
                                    const isVerified = driver.kyc_status === "verified";
                                    const isRejected = driver.kyc_status === "rejected";

                                    return (
                                        <div
                                            key={driver.id}
                                            className={`rounded-2xl border p-5 transition-all shadow-xl ${
                                                isPending
                                                    ? "bg-gradient-to-br from-slate-900 to-amber-950/20 border-amber-500/40"
                                                    : isVerified
                                                    ? "bg-slate-900 border-slate-800"
                                                    : "bg-slate-900 border-rose-900/40"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-lg overflow-hidden">
                                                        {driver.avatar ? (
                                                            <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            driver.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                                                            {driver.name}
                                                            {isVerified && <CheckCircle2 size={16} className="text-emerald-400" />}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} className="text-amber-400" /> {driver.city || "Mumbai"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    isVerified
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                        : isRejected
                                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                                                }`}>
                                                    {driver.kyc_status}
                                                </span>
                                            </div>

                                            {/* Details & Documents */}
                                            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 my-4 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Contact</span>
                                                    <p className="text-slate-200 font-semibold">{driver.phone}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Driving License</span>
                                                    <p className="text-amber-400 font-mono font-bold">{driver.license_number || "DL-0420199482"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Experience</span>
                                                    <p className="text-slate-200 font-semibold">{driver.experience_years || 4} Years</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Vehicles</span>
                                                    <p className="text-slate-200 font-semibold">{(driver.car_experience || ["Manual", "Automatic"]).join(", ")}</p>
                                                </div>
                                            </div>

                                            {/* Document Checklist Badges */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                                    <FileText size={11} className="text-amber-400" /> License Card
                                                </span>
                                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                                    <ShieldCheck size={11} className="text-sky-400" /> Aadhar / ID
                                                </span>
                                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                                    <CheckCircle2 size={11} className="text-emerald-400" /> Police Verified
                                                </span>
                                            </div>

                                            {isRejected && driver.rejection_reason && (
                                                <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60 mb-4">
                                                    <strong>Rejection Note:</strong> {driver.rejection_reason}
                                                </p>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                                <button
                                                    onClick={() => handleApproveKYC(driver.id, driver.name)}
                                                    disabled={isVerified}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                        isVerified
                                                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95"
                                                    }`}
                                                >
                                                    <CheckCircle2 size={14} /> {isVerified ? "Approved" : "Approve KYC"}
                                                </button>

                                                <button
                                                    onClick={() => handleOpenRejectModal(driver)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-rose-900/30 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-all active:scale-95"
                                                >
                                                    <XCircle size={14} /> Reject
                                                </button>

                                                <button
                                                    onClick={() => setSelectedDriverDetails(driver)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                                                    title="View Full Profile"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* =========================================================================
                    TAB 3: MANAGE USERS (VIEW / DELETE / SUSPEND)
                ========================================================================= */}
                {activeTab === "users" && (
                    <div className="space-y-6">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <div className="relative flex-1 max-w-md">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by name, email, phone, city..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Status:</span>
                                {["all", "active", "suspended"].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setUserStatusFilter(st)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                                            userStatusFilter === st
                                                ? "bg-amber-400 text-slate-950 font-bold"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Contact</th>
                                            <th className="px-6 py-4">City</th>
                                            <th className="px-6 py-4">Bookings</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                    No users match your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white">{user.name}</p>
                                                                <p className="text-xs text-slate-400">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-300">
                                                        {user.phone || "Not provided"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-300">
                                                        {user.city || "Mumbai"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-amber-400">
                                                        {user.total_bookings} Rides
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                            user.is_suspended
                                                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                        }`}>
                                                            {user.is_suspended ? "Suspended" : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleToggleUserSuspend(user)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                    user.is_suspended
                                                                        ? "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                                                                        : "bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800"
                                                                }`}
                                                            >
                                                                {user.is_suspended ? (
                                                                    <span className="flex items-center gap-1"><UserCheck size={13} /> Activate</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1"><UserX size={13} /> Suspend</span>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({ open: true, type: "user", id: user.id, name: user.name })}
                                                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900/60 transition-all"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    TAB 4: MANAGE DRIVERS (VIEW / DELETE / SUSPEND)
                ========================================================================= */}
                {activeTab === "drivers" && (
                    <div className="space-y-6">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <div className="relative flex-1 max-w-md">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search drivers by name, phone, license..."
                                    value={driverSearch}
                                    onChange={(e) => setDriverSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-slate-400 font-medium">Status:</span>
                                {["all", "available", "busy", "offline", "suspended"].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setDriverStatusFilter(st)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                                            driverStatusFilter === st
                                                ? "bg-amber-400 text-slate-950 font-bold"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drivers Table */}
                        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Driver</th>
                                            <th className="px-6 py-4">License & City</th>
                                            <th className="px-6 py-4">Performance</th>
                                            <th className="px-6 py-4">KYC Status</th>
                                            <th className="px-6 py-4">Fleet Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {filteredDrivers.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                    No drivers match your filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDrivers.map(driver => (
                                                <tr key={driver.id} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold overflow-hidden">
                                                                {driver.avatar ? (
                                                                    <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    driver.name.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white flex items-center gap-1.5">
                                                                    {driver.name}
                                                                </p>
                                                                <p className="text-xs text-slate-400">{driver.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-300">
                                                        <p className="font-mono text-amber-400">{driver.license_number}</p>
                                                        <p className="text-slate-400">{driver.city || "Mumbai"}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                                                            <Star size={13} className="fill-amber-400" /> {driver.rating || 4.9}
                                                        </div>
                                                        <p className="text-slate-400">{driver.total_trips} trips</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                            driver.kyc_status === "verified"
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                                : driver.kyc_status === "rejected"
                                                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                                        }`}>
                                                            {driver.kyc_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                            driver.is_suspended
                                                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                                : driver.status === "available"
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                                : "bg-slate-700 text-slate-300"
                                                        }`}>
                                                            {driver.is_suspended ? "Suspended" : driver.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleToggleDriverSuspend(driver)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                    driver.is_suspended
                                                                        ? "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                                                                        : "bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800"
                                                                }`}
                                                            >
                                                                {driver.is_suspended ? "Activate" : "Suspend"}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({ open: true, type: "driver", id: driver.id, name: driver.name })}
                                                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900/60 transition-all"
                                                                title="Delete Driver"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    TAB 5: ALL BOOKINGS LIVE MONITOR
                ========================================================================= */}
                {activeTab === "bookings" && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CalendarCheck size={22} className="text-amber-400" /> Platform Booking Monitor
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Live tracking of all user driver reservations</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {["all", "completed", "confirmed", "searching", "cancelled"].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setBookingStatusFilter(st)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                                            bookingStatusFilter === st
                                                ? "bg-amber-400 text-slate-950 font-bold"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredBookings.length === 0 ? (
                                <div className="col-span-2 text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                                    <CalendarCheck size={40} className="mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-400 font-medium">No bookings found for this filter.</p>
                                </div>
                            ) : (
                                filteredBookings.map(b => (
                                    <div key={b.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                                                    {b.booking_id}
                                                </span>
                                                <p className="text-xs text-slate-400 mt-1">{b.created_at}</p>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                b.status === "completed"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                    : b.status === "confirmed"
                                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                                                    : b.status === "cancelled"
                                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                            }`}>
                                                {b.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="text-slate-400">Customer:</span>
                                                <strong className="text-slate-200">{b.user_name} ({b.user_phone})</strong>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Car size={14} className="text-amber-400" />
                                                <span className="text-slate-400">Driver:</span>
                                                <strong className="text-slate-200">{b.driver_name} ({b.driver_phone})</strong>
                                            </div>
                                            <div className="flex items-start gap-2 pt-1">
                                                <MapPin size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                                <span className="text-slate-300 line-clamp-1">{b.pickup_address} → {b.dropoff_address}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                                            <span className="text-slate-400">Package: <strong className="text-slate-200">{b.package_type}</strong></span>
                                            <span className="text-base font-black text-emerald-400">₹{b.total_fare}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* =========================================================================
                MODAL: REJECT KYC REASON
            ========================================================================= */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <ShieldAlert size={24} />
                            <h3 className="text-lg font-bold text-white">Reject KYC for {rejectModal.driverName}</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                            Please provide a specific reason for rejecting the driver verification. This note will be sent directly to the driver's notification feed.
                        </p>
                        <textarea
                            rows="3"
                            placeholder="e.g. Expired driving license copy, blurry ID photo, police verification missing..."
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                        />
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setRejectModal({ open: false, driverId: null, driverName: "", reason: "" })}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRejectKYC}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                MODAL: DELETE CONFIRMATION
            ========================================================================= */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <Trash2 size={24} />
                            <h3 className="text-lg font-bold text-white">Delete {deleteModal.type === "driver" ? "Driver" : "User"}?</h3>
                        </div>
                        <p className="text-xs text-slate-300">
                            Are you sure you want to permanently remove <strong>{deleteModal.name}</strong> from DRIVIX database? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeleteModal({ open: false, type: "", id: null, name: "" })}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteModal.type === "driver") handleDeleteDriver(deleteModal.id);
                                    else handleDeleteUser(deleteModal.id);
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all"
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                MODAL: DRIVER FULL PROFILE VIEW
            ========================================================================= */}
            {selectedDriverDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                                    {selectedDriverDetails.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{selectedDriverDetails.name}</h3>
                                    <p className="text-xs text-amber-400 font-mono">{selectedDriverDetails.license_number}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDriverDetails(null)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500">Email</span>
                                <p className="text-slate-200 font-medium">{selectedDriverDetails.email}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500">Phone</span>
                                <p className="text-slate-200 font-medium">{selectedDriverDetails.phone}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500">City / Operating Zone</span>
                                <p className="text-slate-200 font-medium">{selectedDriverDetails.city || "Mumbai"}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500">Experience</span>
                                <p className="text-slate-200 font-medium">{selectedDriverDetails.experience_years || 4} Years</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500">Total Rides</span>
                                <p className="text-amber-400 font-bold">{selectedDriverDetails.total_trips || 0} Completed</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500">Rating</span>
                                <p className="text-amber-400 font-bold">★ {selectedDriverDetails.rating || 4.9} / 5.0</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setSelectedDriverDetails(null)}
                                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHome;