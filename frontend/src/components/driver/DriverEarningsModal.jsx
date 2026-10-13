import React, { useState, useEffect } from "react";
import {
    X,
    IndianRupee,
    TrendingUp,
    Wallet,
    CreditCard,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    Sparkles,
    Loader2,
    AlertCircle,
    Building,
    RefreshCw
} from "lucide-react";
import { driverService } from "../../services/driverService";

const DriverEarningsModal = ({ isOpen, onClose, onPayoutSuccess }) => {
    const [earningsData, setEarningsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [payoutMethod, setPayoutMethod] = useState("UPI Transfer");
    const [requesting, setRequesting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        fetchEarnings();
    }, [isOpen]);

    const fetchEarnings = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await driverService.getEarnings();
            if (res.success) {
                setEarningsData(res.earnings);
                if (res.earnings?.wallet_balance) {
                    setWithdrawAmount(String(Math.min(res.earnings.wallet_balance, 2000)));
                }
            }
        } catch (err) {
            console.error("Failed to load earnings", err);
            setErrorMsg("Could not fetch earnings data.");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amt = parseFloat(withdrawAmount);
        if (!amt || amt <= 0) {
            setErrorMsg("Please enter a valid amount to withdraw.");
            return;
        }

        if (earningsData && amt > earningsData.wallet_balance) {
            setErrorMsg("Withdrawal amount cannot exceed current wallet balance.");
            return;
        }

        setRequesting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await driverService.requestPayout(amt, payoutMethod);
            if (res.success) {
                setSuccessMsg(res.message || `Withdrawal request for ₹${amt} submitted!`);
                // Update local state
                setEarningsData(prev => ({
                    ...prev,
                    wallet_balance: Math.max(0, (prev?.wallet_balance || 0) - amt),
                    payouts: [res.payout, ...(prev?.payouts || [])]
                }));
                if (onPayoutSuccess) onPayoutSuccess();
                setTimeout(() => {
                    setSuccessMsg("");
                }, 4000);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to process withdrawal.");
        } finally {
            setRequesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#12141a] border border-gray-800/90 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/30">
                            <IndianRupee size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Earnings & Payouts
                                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                                    85% Payout Rate
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">Track your daily income, total earnings & withdraw to bank/UPI</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchEarnings}
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

                {/* Body */}
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                    {successMsg && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 size={18} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-400/20 rounded-2xl">
                            <p className="text-xs text-gray-400 font-semibold">TOTAL EARNINGS</p>
                            <h3 className="text-2xl font-black text-yellow-400 mt-1">
                                ₹{earningsData?.total_earnings || 0}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Sparkles size={11} className="text-yellow-400" /> Lifetime
                            </p>
                        </div>

                        <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-2xl">
                            <p className="text-xs text-gray-400 font-semibold">TODAY'S EARNINGS</p>
                            <h3 className="text-2xl font-black text-white mt-1">
                                ₹{earningsData?.today_earnings || 0}
                            </h3>
                            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                <TrendingUp size={11} /> Today's trips
                            </p>
                        </div>

                        <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-2xl col-span-2 sm:col-span-1">
                            <p className="text-xs text-gray-400 font-semibold">WALLET BALANCE</p>
                            <h3 className="text-2xl font-black text-emerald-400 mt-1">
                                ₹{earningsData?.wallet_balance || 0}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Available to withdraw</p>
                        </div>
                    </div>

                    {/* Payout Withdrawal Form */}
                    <div className="p-5 bg-[#171a22] border border-gray-800 rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Wallet size={16} className="text-yellow-400" />
                            Request Instant Payout
                        </h3>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                        Withdrawal Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="100"
                                        max={earningsData?.wallet_balance || 10000}
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                        Payout Destination
                                    </label>
                                    <select
                                        value={payoutMethod}
                                        onChange={(e) => setPayoutMethod(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                    >
                                        <option value="UPI Transfer">UPI ID (e.g. driver@oksbi)</option>
                                        <option value="Direct Bank Transfer">Registered Bank Account</option>
                                        <option value="Immediate IMPS">Immediate IMPS Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={requesting || (earningsData?.wallet_balance || 0) <= 0}
                                className="w-full py-3 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-yellow-400/20 transition disabled:opacity-50"
                            >
                                {requesting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing Payout Request...
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpRight size={16} />
                                        Withdraw ₹{withdrawAmount || 0}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Recent Payout History */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Recent Payout Transfers
                        </h4>

                        <div className="space-y-2">
                            {(earningsData?.payouts || []).map((p, idx) => (
                                <div
                                    key={p.id || idx}
                                    className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                            <Building size={16} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-200">{p.method}</p>
                                            <p className="text-gray-500">{p.date || p.requested_at || "Recent"}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-emerald-400">+₹{p.amount}</p>
                                        <span className="text-gray-400 text-xs">{p.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverEarningsModal;
