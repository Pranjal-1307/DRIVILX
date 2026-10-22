import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Car, ShieldCheck, UserCheck, LogOut } from "lucide-react";

const Navbar = () => {
    const { user, logout } = useAuth();

    // Determine dashboard home route based on role
    const getHomeRoute = () => {
        if (!user) return "/";
        if (user.role === "admin") return "/admin";
        if (user.role === "driver") return "/driver";
        return "/user";
    };

    // Role-specific badge styling and icon
    const renderRoleBadge = (role) => {
        const normalizedRole = (role || "").toLowerCase();

        if (normalizedRole === "admin") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
                    <ShieldCheck size={13} className="text-amber-400" />
                    Admin
                </span>
            );
        }

        if (normalizedRole === "driver") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
                    <Car size={13} className="text-emerald-400" />
                    Driver
                </span>
            );
        }

        // default: user / customer
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/10">
                <UserCheck size={13} className="text-sky-400" />
                User
            </span>
        );
    };

    return (
        <nav className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 text-white shadow-xl shadow-black/25">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                {/* Logo & Brand */}
                <Link
                    to={getHomeRoute()}
                    className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl px-1 py-0.5 transition"
                >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 group-hover:scale-105 group-hover:shadow-amber-500/40 transition-all duration-200">
                        <Car size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors flex items-center">
                            DRIV<span className="text-amber-400">IX</span>
                        </span>
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1 group-hover:text-slate-300 transition-colors">
                            Mobility Network
                        </span>
                    </div>
                </Link>

                {/* User Info & Actions */}
                {user ? (
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="flex items-center gap-3">
                            {/* Avatar Icon */}
                            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-amber-400 font-bold text-sm shadow-inner">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>

                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-100 tracking-wide leading-tight">
                                    {user.name || "Active User"}
                                </p>
                                <div className="mt-0.5">
                                    {renderRoleBadge(user.role)}
                                </div>
                            </div>

                            {/* Mobile-only role badge */}
                            <div className="sm:hidden">
                                {renderRoleBadge(user.role)}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-rose-600 text-slate-200 hover:text-white px-3.5 sm:px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700/80 hover:border-rose-500 transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
                            title="Sign out of DRIVIX"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20"
                        >
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;