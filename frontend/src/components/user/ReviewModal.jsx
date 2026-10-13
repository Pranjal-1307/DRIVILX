import React, { useState } from "react";
import {
    X,
    Star,
    ShieldCheck,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles
} from "lucide-react";
import { bookingService } from "../../services/bookingService";

const REVIEW_TAGS = [
    "Punctual & On-Time",
    "Smooth & Safe Driving",
    "Polite & Professional",
    "Expert Route Knowledge",
    "Well Groomed",
    "Clean & Careful with Car"
];

const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState(["Punctual & On-Time", "Smooth & Safe Driving"]);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    if (!isOpen || !booking) return null;

    const driver = booking.driver || {
        name: "Rajesh Kumar",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        badge: "Verified Chauffeur"
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg("");

        try {
            const res = await bookingService.submitReview(booking.id, {
                rating,
                comment,
                tags: selectedTags
            });

            if (res.success) {
                setSuccessMsg("Thank you! Your review has been recorded.");
                if (onReviewSubmitted) onReviewSubmitted(res.review);
                setTimeout(() => {
                    setSuccessMsg("");
                    onClose();
                }, 2000);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                            <Star size={20} className="fill-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Rate & Review Driver</h2>
                            <p className="text-xs text-zinc-400">Share your experience to help us maintain top service</p>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

                    {/* Driver summary */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                        <img
                            src={driver.avatar}
                            alt={driver.name}
                            className="w-12 h-12 rounded-full object-cover border border-yellow-400"
                        />
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                {driver.name}
                                <ShieldCheck size={14} className="text-emerald-400" />
                            </h4>
                            <p className="text-xs text-zinc-400">{driver.badge || "Verified Chauffeur"} • Trip #{booking.id.slice(-6)}</p>
                        </div>
                    </div>

                    {/* Interactive Star Rating */}
                    <div className="text-center space-y-2 py-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                            How was your trip experience?
                        </label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition transform hover:scale-125 focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        className={`${
                                            (hoverRating || rating) >= star
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-zinc-700"
                                        } transition`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-yellow-400">
                            {rating === 5 ? "Excellent (5.0 ★)" : rating === 4 ? "Very Good (4.0 ★)" : rating === 3 ? "Average (3.0 ★)" : "Needs Improvement"}
                        </p>
                    </div>

                    {/* Quick Review Tags */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                            What went well?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {REVIEW_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                                        selectedTags.includes(tag)
                                            ? "bg-yellow-400/10 text-yellow-400 border-yellow-400 font-bold"
                                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment text */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                            <MessageSquare size={13} className="text-yellow-400" /> FEEDBACK OR NOTES (OPTIONAL)
                        </label>
                        <textarea
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about the driver's punctuality, car handling, and behavior..."
                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Submit Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
