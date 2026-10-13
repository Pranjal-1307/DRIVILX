import React, { useState, useEffect } from "react";
import {
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Car,
    Clock,
    Shield,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    Sparkles
} from "lucide-react";
import { driverService } from "../../services/driverService";
import { useAuth } from "../../context/AuthContext";

const DriverProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const carOptions = ["Manual", "Automatic", "Sedan", "SUV", "Luxury Sedan", "Electric"];
    const cityOptions = ["Mumbai", "Pune", "Delhi NCR", "Bangalore", "Hyderabad", "Chennai", "Ahmedabad"];

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        city: "Mumbai",
        address: "",
        experience_years: 5,
        car_experience: ["Manual", "Automatic", "Sedan"],
        bio: "",
        emergency_contact: "",
        avatar: ""
    });

    useEffect(() => {
        if (!isOpen) return;
        fetchProfile();
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await driverService.getProfile();
            if (res.success && res.profile) {
                const p = res.profile;
                setFormData({
                    name: p.name || user?.name || "",
                    email: p.email || user?.email || "",
                    phone: p.phone || "",
                    city: p.city || "Mumbai",
                    address: p.address || "",
                    experience_years: p.experience_years || 5,
                    car_experience: p.car_experience || ["Manual", "Automatic"],
                    bio: p.bio || "",
                    emergency_contact: p.emergency_contact || "",
                    avatar: p.avatar || ""
                });
            }
        } catch (err) {
            console.error("Failed to load driver profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCarToggle = (type) => {
        setFormData(prev => {
            const exists = prev.car_experience.includes(type);
            return {
                ...prev,
                car_experience: exists
                    ? prev.car_experience.filter(t => t !== type)
                    : [...prev.car_experience, type]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await driverService.updateProfile(formData);
            if (res.success) {
                setSuccessMsg("Driver profile updated successfully!");
                // Update local storage user context
                if (user) {
                    const updatedUser = { ...user, name: formData.name, city: formData.city };
                    login(localStorage.getItem("token"), updatedUser);
                }
                if (onProfileUpdated) onProfileUpdated(res.profile);
                setTimeout(() => {
                    setSuccessMsg("");
                    onClose();
                }, 1200);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#12141a] border border-gray-800/90 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/30">
                            <User size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Driver Profile Settings</h2>
                            <p className="text-xs text-gray-400">Update your chauffeur credentials, operating city & preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Email Address (Read-only)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={formData.email}
                                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 text-sm cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Operating City
                                </label>
                                <select
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                >
                                    {cityOptions.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Driving Experience (Years)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="40"
                                    value={formData.experience_years}
                                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Emergency Contact Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.emergency_contact}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                                    placeholder="+91 91234 56789"
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Full Residential / Operating Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Street, Area, Landmark"
                                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                            />
                        </div>

                        {/* Vehicle Expertise */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Vehicle Driving Capabilities
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {carOptions.map((opt) => {
                                    const selected = formData.car_experience.includes(opt);
                                    return (
                                        <button
                                            type="button"
                                            key={opt}
                                            onClick={() => handleCarToggle(opt)}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                                selected
                                                    ? "bg-yellow-400 text-black border-yellow-400 font-bold"
                                                    : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700"
                                            }`}
                                        >
                                            {opt} {selected ? "✓" : "+"}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bio / Experience summary */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Chauffeur Bio & Experience Summary
                            </label>
                            <textarea
                                rows="3"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Describe your driving background, route knowledge, and service standards..."
                                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={saving || loading}
                                className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Saving Profile...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DriverProfileModal;
