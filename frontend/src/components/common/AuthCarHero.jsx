import React, { useState, useEffect } from "react";
import {
    Car,
    ShieldCheck,
    Sparkles,
    MapPin,
    Clock,
    Navigation,
    Star,
    Zap,
    Route,
    Gauge
} from "lucide-react";

const AuthCarHero = () => {
    const [activeService, setActiveService] = useState(0);

    const services = [
        { label: "Personal Chauffeur", icon: Car, eta: "3 min", desc: "Your car driven by professional chauffeurs" },
        { label: "Airport Drop & Pickup", icon: Navigation, eta: "On Schedule", desc: "Flight-tracked timely terminal transfer" },
        { label: "Night Out / Events", icon: Sparkles, eta: "Instant Match", desc: "Safe, luxury rides after parties or dinners" },
        { label: "Outstation Trips", icon: Route, eta: "Reserved", desc: "Long distance journeys with vetted drivers" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveService((prev) => (prev + 1) % services.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [services.length]);

    const currentService = services[activeService];

    return (
        <div className="w-full my-auto py-1">
            {/* Service Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {services.map((item, idx) => {
                    const IconComp = item.icon;
                    const isActive = activeService === idx;
                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setActiveService(idx)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                                isActive
                                    ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-105"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                            }`}
                        >
                            <IconComp size={12} className={isActive ? "text-black" : "text-yellow-400"} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Stage: Dynamic Night Highway & Car Animation */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-yellow-500/20 bg-gradient-to-b from-[#0e1320] via-[#090d16] to-[#04060a] p-3.5 xl:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                {/* Background Night Sky & Grid Highlights */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
                
                {/* Ambient Top Telemetry Bar */}
                <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 font-semibold tracking-wide uppercase text-[10px]">
                            Live Driver Radar
                        </span>
                        <span className="text-gray-500 hidden md:inline">•</span>
                        <span className="text-gray-400 text-[10px] font-medium hidden md:inline">
                            {currentService.desc}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20 text-[10.5px]">
                            <Zap size={10} />
                            <span>ETA: {currentService.eta}</span>
                        </div>
                    </div>
                </div>

                {/* Animated Highway Scene */}
                <div className="relative my-3 h-36 xl:h-40 w-full rounded-xl overflow-hidden bg-[#070a12] border border-white/5 flex flex-col justify-end">
                    {/* Horizon Glow & Skyline Light Streaks */}
                    <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-indigo-950/40 via-yellow-950/15 to-transparent pointer-events-none" />
                    
                    {/* City skyline silhouettes in background */}
                    <div className="absolute top-4 inset-x-0 flex justify-around opacity-20 pointer-events-none">
                        <div className="w-12 h-12 bg-white/30 rounded-t-sm" />
                        <div className="w-16 h-16 bg-white/40 rounded-t-sm" />
                        <div className="w-10 h-10 bg-white/25 rounded-t-sm" />
                        <div className="w-20 h-20 bg-white/35 rounded-t-sm" />
                        <div className="w-14 h-14 bg-white/30 rounded-t-sm" />
                    </div>

                    {/* Speed particles whizzing left */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <span className="drivix-speed-streak" style={{ top: "25%", animationDelay: "0s" }} />
                        <span className="drivix-speed-streak" style={{ top: "45%", animationDelay: "0.6s" }} />
                        <span className="drivix-speed-streak" style={{ top: "60%", animationDelay: "0.3s" }} />
                        <span className="drivix-speed-streak" style={{ top: "78%", animationDelay: "0.9s" }} />
                    </div>

                    {/* Floating HUD Tag 1: Chauffeur Live Badge */}
                    <div className="absolute top-2.5 left-3 z-20 flex items-center gap-2 bg-[#0d121df0] backdrop-blur-md border border-yellow-400/30 px-2.5 py-1 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-fade-right">
                        <div className="w-6 h-6 rounded-md bg-yellow-400 flex items-center justify-center text-black font-extrabold text-[11px] shadow-sm">
                            MV
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-white text-[11px] font-bold leading-none">Marcus Vance</span>
                                <span className="flex items-center text-yellow-400 text-[9.5px] font-bold">
                                    <Star size={9} className="fill-yellow-400 text-yellow-400" /> 4.98
                                </span>
                            </div>
                            <span className="text-gray-400 text-[9px] leading-tight block">Executive Chauffeur • 1,420+ trips</span>
                        </div>
                    </div>

                    {/* Floating HUD Tag 2: Telemetry Speed/Route */}
                    <div className="absolute top-2.5 right-3 z-20 hidden sm:flex items-center gap-1.5 bg-[#0d121df0] backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[11px] text-gray-300">
                        <Gauge size={12} className="text-yellow-400" />
                        <span className="font-semibold text-white">54 km/h</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <Navigation size={10} /> On Route
                        </span>
                    </div>

                    {/* The Car & Headlight Rays */}
                    <div className="relative z-10 w-full flex items-center justify-center mb-4">
                        <div className="relative drivix-car-container">
                            {/* Headlight Beams illuminating forward (to the right) */}
                            <div className="drivix-headlight-beam" />
                            {/* Taillight Red Glow */}
                            <div className="drivix-taillight-glow" />
                            {/* Ground Underglow (Yellow/Amber) */}
                            <div className="drivix-car-underglow" />

                            {/* SVG Luxury Sports Sedan */}
                            <svg
                                className="w-48 h-20 xl:w-52 xl:h-22 drivix-animated-vehicle"
                                viewBox="0 0 320 120"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#1e293b" />
                                        <stop offset="40%" stopColor="#0f172a" />
                                        <stop offset="85%" stopColor="#facc15" stopOpacity="0.85" />
                                        <stop offset="100%" stopColor="#eab308" />
                                    </linearGradient>
                                    <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                                    </linearGradient>
                                    <linearGradient id="headlightGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                                        <stop offset="0%" stopColor="#fef08a" />
                                        <stop offset="100%" stopColor="#ffffff" />
                                    </linearGradient>
                                    <filter id="yellowGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Vehicle Chassis & Roofline */}
                                <path
                                    d="M20 70 Q 25 50, 60 48 L 105 45 Q 140 20, 195 20 L 235 22 Q 275 25, 295 55 L 305 68 Q 312 72, 310 82 Q 308 86, 290 86 L 270 86 Q 268 70, 248 70 Q 228 70, 226 86 L 94 86 Q 92 70, 72 70 Q 52 70, 50 86 L 25 86 Q 16 86, 16 78 Z"
                                    fill="url(#carBodyGrad)"
                                    stroke="#facc15"
                                    strokeWidth="1.5"
                                />

                                {/* Side Sleek Accent Line */}
                                <path
                                    d="M 55 60 Q 150 56, 295 62"
                                    stroke="#facc15"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    filter="url(#yellowGlow)"
                                />

                                {/* Windshield & Windows */}
                                <path
                                    d="M 112 43 Q 145 23, 192 23 L 230 25 Q 262 28, 275 52 L 195 50 Z"
                                    fill="url(#windowGrad)"
                                    stroke="#94a3b8"
                                    strokeWidth="0.8"
                                />

                                {/* Window B-pillar */}
                                <line x1="195" y1="23" x2="195" y2="50" stroke="#0f172a" strokeWidth="4" />

                                {/* Glowing Headlight */}
                                <polygon
                                    points="296,58 310,65 304,72 290,66"
                                    fill="url(#headlightGrad)"
                                    filter="url(#yellowGlow)"
                                />

                                {/* Glowing Red Taillight */}
                                <rect
                                    x="16"
                                    y="68"
                                    width="10"
                                    height="7"
                                    rx="2"
                                    fill="#ef4444"
                                    filter="drop-shadow(0 0 6px #ef4444)"
                                />

                                {/* Front Wheel Assembly */}
                                <g transform="translate(248, 86)">
                                    {/* Tire */}
                                    <circle cx="0" cy="0" r="19" fill="#090d16" stroke="#334155" strokeWidth="2.5" />
                                    {/* Rotating Alloy Rim */}
                                    <g className="drivix-wheel-spin">
                                        <circle cx="0" cy="0" r="14" fill="#1e293b" stroke="#facc15" strokeWidth="1" />
                                        <line x1="-12" y1="0" x2="12" y2="0" stroke="#facc15" strokeWidth="2" />
                                        <line x1="0" y1="-12" x2="0" y2="12" stroke="#facc15" strokeWidth="2" />
                                        <line x1="-8" y1="-8" x2="8" y2="8" stroke="#facc15" strokeWidth="1.5" />
                                        <line x1="-8" y1="8" x2="8" y2="-8" stroke="#facc15" strokeWidth="1.5" />
                                        <circle cx="0" cy="0" r="4" fill="#facc15" />
                                    </g>
                                </g>

                                {/* Rear Wheel Assembly */}
                                <g transform="translate(72, 86)">
                                    {/* Tire */}
                                    <circle cx="0" cy="0" r="19" fill="#090d16" stroke="#334155" strokeWidth="2.5" />
                                    {/* Rotating Alloy Rim */}
                                    <g className="drivix-wheel-spin">
                                        <circle cx="0" cy="0" r="14" fill="#1e293b" stroke="#facc15" strokeWidth="1" />
                                        <line x1="-12" y1="0" x2="12" y2="0" stroke="#facc15" strokeWidth="2" />
                                        <line x1="0" y1="-12" x2="0" y2="12" stroke="#facc15" strokeWidth="2" />
                                        <line x1="-8" y1="-8" x2="8" y2="8" stroke="#facc15" strokeWidth="1.5" />
                                        <line x1="-8" y1="8" x2="8" y2="-8" stroke="#facc15" strokeWidth="1.5" />
                                        <circle cx="0" cy="0" r="4" fill="#facc15" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                    </div>

                    {/* Speeding Road Surface with Moving Dashed Highway Markers */}
                    <div className="relative w-full h-11 bg-gradient-to-b from-[#151c2c] to-[#070a12] border-t-2 border-yellow-500/40">
                        {/* Continuous Moving Center Road Strip */}
                        <div className="drivix-highway-lines">
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                            <span className="drivix-road-stripe" />
                        </div>
                        {/* Road guard curb edge reflectors */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500/20 via-yellow-400 to-yellow-500/20 opacity-40" />
                    </div>
                </div>

                {/* Bottom Trust & Feature Badges */}
                <div className="grid grid-cols-3 gap-2 pt-1.5">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center transition-all hover:border-yellow-400/40 hover:bg-white/10">
                        <ShieldCheck className="text-yellow-400 mx-auto mb-0.5" size={15} />
                        <p className="text-white text-[10.5px] font-bold">100% Vetted</p>
                        <p className="text-gray-400 text-[9.5px]">Police-verified</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center transition-all hover:border-yellow-400/40 hover:bg-white/10">
                        <MapPin className="text-yellow-400 mx-auto mb-0.5" size={15} />
                        <p className="text-white text-[10.5px] font-bold">Live Tracking</p>
                        <p className="text-gray-400 text-[9.5px]">Turn-by-turn GPS</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center transition-all hover:border-yellow-400/40 hover:bg-white/10">
                        <Clock className="text-yellow-400 mx-auto mb-0.5" size={15} />
                        <p className="text-white text-[10.5px] font-bold">&lt; 5 Min Pickup</p>
                        <p className="text-gray-400 text-[9.5px]">Instant match</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthCarHero;
