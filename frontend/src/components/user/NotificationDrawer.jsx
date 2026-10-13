import React, { useState, useEffect } from "react";
import {
    X,
    Bell,
    CheckCheck,
    Car,
    CreditCard,
    Star,
    Sparkles,
    Loader2
} from "lucide-react";
import { bookingService } from "../../services/bookingService";

const NotificationDrawer = ({ isOpen, onClose, onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        fetchNotifs();
    }, [isOpen]);

    const fetchNotifs = async () => {
        setLoading(true);
        try {
            const res = await bookingService.getNotifications();
            if (res.success) {
                setNotifications(res.notifications || []);
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await bookingService.markNotificationsRead();
            setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark notifications read", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col text-white shadow-2xl animate-slideLeft">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold">Notifications</h2>
                            <p className="text-xs text-zinc-400">Driver updates & booking alerts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleMarkAllRead}
                            title="Mark all as read"
                            className="p-2 text-xs text-yellow-400 hover:text-yellow-300 rounded-lg hover:bg-zinc-800 transition flex items-center gap-1"
                        >
                            <CheckCheck size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                            <Loader2 size={28} className="animate-spin text-yellow-400" />
                            <span className="text-xs">Fetching alerts...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-16 text-center text-zinc-500 space-y-2">
                            <Bell size={36} className="mx-auto text-zinc-700 mb-2" />
                            <p className="text-sm font-semibold text-zinc-400">No notifications yet</p>
                            <p className="text-xs max-w-xs mx-auto">
                                You'll receive real-time alerts when a driver is assigned or your trip status updates.
                            </p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => {
                                    if (onNotificationClick) onNotificationClick(n);
                                }}
                                className={`p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                                    n.is_read
                                        ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900"
                                        : "bg-yellow-400/5 border-yellow-400/30 text-zinc-200 hover:bg-yellow-400/10 shadow-sm"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                        <Sparkles size={13} className="text-yellow-400" /> {n.title}
                                    </h4>
                                    <span className="text-[10px] text-zinc-500">{n.created_at}</span>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationDrawer;
