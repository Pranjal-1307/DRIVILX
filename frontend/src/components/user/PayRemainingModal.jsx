import React, { useState } from "react";
import {
    X,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { bookingService } from "../../services/bookingService";

const PayRemainingModal = ({ isOpen, onClose, booking, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState("UPI / GPay / PhonePe");
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    if (!isOpen || !booking) return null;

    const fare = booking.fare || {};
    const remainingAmount = fare.remaining_amount || 0;

    const handlePay = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMsg("");

        try {
            const res = await bookingService.payRemaining(booking.id, {
                payment_method: paymentMethod,
                payment_id: `PAY_BAL_${Date.now()}`
            });

            if (res.success) {
                setSuccessMsg("Remaining balance paid successfully!");
                if (onPaymentSuccess) onPaymentSuccess(booking.id);
                setTimeout(() => {
                    setSuccessMsg("");
                    onClose();
                }, 1800);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Payment failed. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Pay Remaining Amount</h2>
                            <p className="text-xs text-zinc-400">Complete trip payment for Booking #{booking.id.slice(-6)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handlePay} className="p-6 space-y-5">
                    {successMsg && (
                        <div className="flex items-center gap-2 p-3 text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
                            <CheckCircle2 size={16} /> {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl">
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}

                    {/* Amount card */}
                    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Total Trip Fare:</span>
                            <span className="text-white font-semibold">₹{fare.total_fare || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Advance Paid Earlier:</span>
                            <span className="text-emerald-400 font-semibold">₹{fare.advance_amount || 0} ✓</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-white border-t border-zinc-800 pt-2">
                            <span>Remaining Balance:</span>
                            <span className="text-yellow-400 text-lg">₹{remainingAmount}</span>
                        </div>
                    </div>

                    {/* Payment methods */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 block mb-2">
                            Payment Method
                        </label>
                        <div className="space-y-2">
                            {["UPI / GPay / PhonePe / Paytm", "Debit / Credit Card", "Net Banking"].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setPaymentMethod(m)}
                                    className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                                        paymentMethod === m
                                            ? "bg-yellow-400/10 text-yellow-400 border-yellow-400 font-bold"
                                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                                    }`}
                                >
                                    <span>{m}</span>
                                    {paymentMethod === m && <CheckCircle2 size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing Balance Payment...
                            </>
                        ) : (
                            <>
                                <CreditCard size={16} />
                                Settle ₹{remainingAmount} Now
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PayRemainingModal;
