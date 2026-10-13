import React, { useState, useEffect } from "react";
import {
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    Car,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save
} from "lucide-react";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const ProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "Mumbai",
        emergency_contact: "",
        preferred_car_type: "Manual",
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
            const res = await userService.getProfile();
            if (res.success && res.profile) {
                setFormData({
                    name: res.profile.name || user?.name || "",
                    email: res.profile.email || user?.email || "",
                    phone: res.profile.phone || "",
                    address: res.profile.address || "",
                    city: res.profile.city || "Mumbai",
                    emergency_contact: res.profile.emergency_contact || "",
                    preferred_car_type: res.profile.preferred_car_type || "Manual",
                    avatar: res.profile.avatar || ""
                });
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            // Fallback to auth context
            setFormData((prev) => ({
                ...prev,
                name: user?.name || "",
                email: user?.email || ""
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await userService.updateProfile(formData);
            if (res.success) {
                setSuccessMsg("Profile updated successfully!");
                // Update local storage and auth context if name updated
                if (res.profile) {
                    login({
                        token: localStorage.getItem("drivilx_token"),
                        user: {
                            ...user,
                            name: res.profile.name,
                            phone: res.profile.phone,
                            address: res.profile.address
                        }
                    });
                }
                if (onProfileUpdated) onProfileUpdated(res.profile);
                setTimeout(() => setSuccessMsg(""), 3500);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Profile Management</h2>
                            <p className="text-xs text-zinc-400">Manage your contact, vehicle preferences and security</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                            <Loader2 size={28} className="animate-spin text-yellow-400" />
                            <span className="text-xs">Loading profile details...</span>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                                        <User size={13} className="text-yellow-400" /> FULL NAME
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                                        <Mail size={13} className="text-yellow-400" /> EMAIL ADDRESS
                                    </label>
                                    <input
                                        type="email"
                                        disabled
                                        value={formData.email}
                                        className="w-full px-3.5 py-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-xl text-zinc-500 text-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                                        <Phone size={13} className="text-yellow-400" /> CONTACT NUMBER
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 00000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                                        <Shield size={13} className="text-emerald-400" /> EMERGENCY CONTACT
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+91 98000 11111"
                                        value={formData.emergency_contact}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                                    <MapPin size={13} className="text-yellow-400" /> DEFAULT HOME / PICKUP ADDRESS
                                </label>
                                <input
                                    type="text"
                                    placeholder="Apartment, Street, Area"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                                        CITY
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1">
                                        <Car size={13} className="text-yellow-400" /> PREFERRED TRANSMISSION
                                    </label>
                                    <select
                                        value={formData.preferred_car_type}
                                        onChange={(e) => setFormData({ ...formData, preferred_car_type: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                    >
                                        <option value="Manual">Manual Transmission</option>
                                        <option value="Automatic">Automatic Transmission</option>
                                        <option value="Both">Both (Manual & Automatic)</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm rounded-xl flex items-center gap-2 transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
