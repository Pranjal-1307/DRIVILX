import React, { useState, useEffect } from "react";
import {
    X,
    ShieldCheck,
    Upload,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Camera,
    CreditCard,
    Car,
    Loader2,
    Sparkles
} from "lucide-react";
import { driverService } from "../../services/driverService";

const DriverKYCModal = ({ isOpen, onClose, onKYCUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [kycForm, setKycForm] = useState({
        pan_number: "ABCDE1234F",
        aadhaar_number: "XXXX-XXXX-4892",
        license_number: "DL-0420180039211",
        license_expiry: "2030-12-31",
        status: "verified",
        documents: {
            license_front: { name: "Driving_License_Front.jpg", status: "approved", uploaded: true },
            license_back: { name: "Driving_License_Back.jpg", status: "approved", uploaded: true },
            aadhaar_card: { name: "Aadhaar_Document.pdf", status: "approved", uploaded: true },
            address_proof: { name: "Electricity_Bill.pdf", status: "approved", uploaded: true },
            driver_photo: { name: "Driver_Selfie.jpg", status: "approved", uploaded: true }
        }
    });

    useEffect(() => {
        if (!isOpen) return;
        fetchKYCDetails();
    }, [isOpen]);

    const fetchKYCDetails = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await driverService.getKYC();
            if (res.success && res.kyc) {
                setKycForm({
                    pan_number: res.kyc.pan_number || "",
                    aadhaar_number: res.kyc.aadhaar_number || "",
                    license_number: res.kyc.license_number || "",
                    license_expiry: res.kyc.license_expiry || "",
                    status: res.status || "verified",
                    documents: res.kyc.documents || kycForm.documents
                });
            }
        } catch (err) {
            console.error("Failed to load KYC", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentUploadSim = (docKey, filename) => {
        setKycForm(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [docKey]: {
                    name: filename || `${docKey}_uploaded.pdf`,
                    status: "under_review",
                    uploaded: true
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await driverService.submitKYC(kycForm);
            if (res.success) {
                setSuccessMsg(res.message || "KYC documents submitted successfully!");
                setKycForm(prev => ({ ...prev, status: "under_review" }));
                if (onKYCUpdated) onKYCUpdated("under_review");
                setTimeout(() => {
                    setSuccessMsg("");
                }, 4000);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to submit KYC. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const docItems = [
        { key: "license_front", label: "Driving License (Front)", icon: Car, hint: "Must show clear photo and DL number" },
        { key: "license_back", label: "Driving License (Back)", icon: Car, hint: "Must show vehicle class endorsements" },
        { key: "aadhaar_card", label: "Aadhaar Card / Voter ID", icon: CreditCard, hint: "Government issued identity proof" },
        { key: "address_proof", label: "Current Address Proof", icon: FileText, hint: "Electricity bill, rent agreement, or bank passbook" },
        { key: "driver_photo", label: "Driver Selfie / Portrait", icon: Camera, hint: "Clear front-facing photo with white/plain background" },
    ];

    const uploadedCount = Object.values(kycForm.documents || {}).filter(d => d.uploaded).length;
    const progressPercent = Math.min(100, Math.round((uploadedCount / docItems.length) * 100));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#12141a] border border-gray-800/90 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Top Glowing Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center border border-yellow-400/30">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Driver KYC Verification
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                    kycForm.status === "verified"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : kycForm.status === "under_review"
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                }`}>
                                    {kycForm.status === "verified" ? "Verified" : kycForm.status === "under_review" ? "Under Review" : "Action Required"}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">Complete verification to accept bookings and unlock highest payouts</p>
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
                    {/* Progress Bar */}
                    <div className="bg-gray-900/80 border border-gray-800/80 rounded-2xl p-4">
                        <div className="flex justify-between items-center text-xs mb-2">
                            <span className="text-gray-300 font-medium flex items-center gap-1.5">
                                <Sparkles size={14} className="text-yellow-400" />
                                KYC Completion Progress
                            </span>
                            <span className="text-yellow-400 font-bold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-yellow-500 to-amber-400 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {successMsg && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 size={18} className="shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* KYC Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Identity Input fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Driving License Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={kycForm.license_number}
                                    onChange={(e) => setKycForm({ ...kycForm, license_number: e.target.value })}
                                    placeholder="e.g. DL-0420180039211"
                                    className="w-full px-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    License Expiry Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={kycForm.license_expiry}
                                    onChange={(e) => setKycForm({ ...kycForm, license_expiry: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Aadhaar Card Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={kycForm.aadhaar_number}
                                    onChange={(e) => setKycForm({ ...kycForm, aadhaar_number: e.target.value })}
                                    placeholder="XXXX-XXXX-XXXX"
                                    className="w-full px-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    PAN Card Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={kycForm.pan_number}
                                    onChange={(e) => setKycForm({ ...kycForm, pan_number: e.target.value })}
                                    placeholder="ABCDE1234F"
                                    className="w-full px-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition"
                                />
                            </div>
                        </div>

                        {/* Upload Required Documents */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Upload size={16} className="text-yellow-400" />
                                Required Document Uploads
                            </h3>

                            <div className="space-y-3">
                                {docItems.map((doc) => {
                                    const Icon = doc.icon;
                                    const currentDoc = kycForm.documents?.[doc.key];
                                    const isUploaded = currentDoc?.uploaded;

                                    return (
                                        <div
                                            key={doc.key}
                                            className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-2xl flex items-center justify-between hover:border-gray-700 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-800 text-yellow-400 flex items-center justify-center shrink-0">
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-200">{doc.label}</h4>
                                                    <p className="text-xs text-gray-500">{currentDoc?.name || doc.hint}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {isUploaded ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                                        <CheckCircle2 size={13} />
                                                        {currentDoc.status === "approved" ? "Approved" : "Under Review"}
                                                    </span>
                                                ) : null}

                                                <label className="cursor-pointer px-3 py-1.5 bg-gray-800 hover:bg-yellow-400 hover:text-black text-gray-300 text-xs font-semibold rounded-xl border border-gray-700 transition flex items-center gap-1.5">
                                                    <Upload size={13} />
                                                    {isUploaded ? "Replace" : "Upload"}
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleDocumentUploadSim(doc.key, file.name);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting || loading}
                                className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30 transition disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Submitting KYC Documents...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        Submit KYC Verification
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

export default DriverKYCModal;
