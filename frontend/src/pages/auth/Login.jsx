import { useState, useEffect } from "react";
import {
    Link,
    useNavigate,
    useLocation
} from "react-router-dom";

import {
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    Car,
    Sparkles,
    LockKeyhole
} from "lucide-react";

import {
    loginUser
} from "../../services/authService";

import {
    useAuth
} from "../../context/AuthContext";

import AuthCarHero from "../../components/common/AuthCarHero";


const Login = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const { user, login } = useAuth();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState(location.state?.message || "");

    const [loading, setLoading] =
        useState(false);


    useEffect(() => {

        if (user) {

            if (user.role === "admin") {

                navigate("/admin");

            } else if (user.role === "driver") {

                navigate("/driver");

            } else {

                navigate("/user");

            }

        }

    }, [user, navigate]);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setLoading(true);

        try {

            const data =
                await loginUser(
                    email,
                    password
                );


            if (!data?.token || !data?.user) {

                setError(
                    data?.error || data?.message || "Login failed."
                );

                return;
            }


            login(data);


            if (
                data.user.role ===
                "admin"
            ) {

                navigate("/admin");

            }

            else if (
                data.user.role ===
                "driver"
            ) {

                navigate("/driver");

            }

            else {

                navigate("/user");

            }

        }

        catch (err) {

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to login."
            );

        }

        finally {

            setLoading(false);

        }

    };


    return (

        <div className="min-h-screen bg-[#06080d] flex overflow-hidden">


            {/* =================================================
                LEFT ANIMATED WORLD
            ================================================= */}

            <section className="hidden lg:flex lg:w-[52%] relative overflow-hidden">


                {/* Background */}

                <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#080b12] to-[#020304]" />


                {/* Glow */}

                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-yellow-400/10 blur-[120px] animate-glow" />

                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-glow" />


                {/* Grid */}

                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                        backgroundSize:
                            "55px 55px"
                    }}
                />


                {/* Particles */}

                <span
                    className="drivix-particle"
                    style={{
                        top: "20%",
                        left: "15%"
                    }}
                />

                <span
                    className="drivix-particle"
                    style={{
                        top: "35%",
                        left: "75%",
                        animationDelay: "1s"
                    }}
                />

                <span
                    className="drivix-particle"
                    style={{
                        top: "70%",
                        left: "30%",
                        animationDelay: "2s"
                    }}
                />

                <span
                    className="drivix-particle"
                    style={{
                        top: "55%",
                        left: "85%",
                        animationDelay: "3s"
                    }}
                />


                {/* Content */}
                <div className="relative z-10 w-full p-6 xl:p-8 2xl:p-10 flex flex-col justify-between">

                    {/* Logo */}
                    <div className="animate-fade-right">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_0_35px_rgba(250,204,21,0.35)]">
                                <Car
                                    size={25}
                                    className="text-black"
                                />
                            </div>
                            <span className="text-2xl xl:text-3xl font-black text-white tracking-tight">
                                Drivix
                            </span>
                        </div>
                    </div>

                    {/* Middle Section: Hero Text & Dynamic Car Animation */}
                    <div className="w-full my-auto py-1">
                        <div className="animate-fade-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/25 bg-yellow-400/10 text-yellow-300 text-[11px] font-semibold tracking-wide">
                                <Sparkles size={13} className="text-yellow-400" />
                                <span>THE SMARTER WAY TO COMMUTE</span>
                            </div>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.05] mt-3 animate-fade-right">
                            Your car.{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">
                                Our driver.
                            </span>
                        </h1>

                        <p className="text-gray-400 text-xs xl:text-sm max-w-lg leading-relaxed mt-2 mb-3 animate-fade-right">
                            Professional, verified on-demand chauffeurs for your personal vehicle. Track your chauffeur in real time with guaranteed safety.
                        </p>

                        {/* Animated Night Highway & Luxury Car Feature */}
                        <div className="animate-scale">
                            <AuthCarHero />
                        </div>
                    </div>

                    {/* Bottom Stats & Trust */}
                    <div className="pt-2 border-t border-white/5 animate-fade-up">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <ShieldCheck
                                    size={16}
                                    className="text-yellow-400"
                                />
                                <span>256-bit encrypted authentication • Verified Drivers</span>
                            </div>
                            <span className="text-gray-500 hidden xl:inline text-[11px]">
                                Drivix Mobility Network
                            </span>
                        </div>
                    </div>

                </div>

            </section>


            {/* =================================================
                LOGIN
            ================================================= */}

            <section className="w-full lg:w-[48%] bg-[#f5f6f8] flex items-center justify-center p-5 md:p-10">


                <div className="w-full max-w-md">


                    {/* Mobile logo */}

                    <div className="lg:hidden flex justify-center mb-8 animate-scale">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center">

                                <Car
                                    size={24}
                                    className="text-black"
                                />

                            </div>

                            <span className="text-3xl font-black">
                                Drivix
                            </span>

                        </div>

                    </div>


                    {/* Card */}

                    <div className="drivix-auth-card bg-white border border-gray-100 rounded-[30px] p-8 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.09)]">


                        {/* Header */}

                        <div className="mb-8">

                            <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-5">

                                <LockKeyhole
                                    className="text-yellow-600"
                                    size={23}
                                />

                            </div>


                            <p className="text-yellow-600 font-bold text-xs tracking-[0.2em]">
                                WELCOME BACK
                            </p>


                            <h2 className="text-3xl font-black text-gray-900 mt-2">
                                Sign in
                            </h2>


                            <p className="text-gray-500 mt-2">
                                Continue your journey with Drivix.
                            </p>

                        </div>


                        {/* Success Message */}

                        {successMessage && (

                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-scale flex items-center justify-between">

                                <span>{successMessage}</span>

                                <button
                                    type="button"
                                    onClick={() => setSuccessMessage("")}
                                    className="text-emerald-700 font-bold ml-2 hover:opacity-75"
                                >
                                    ✕
                                </button>

                            </div>

                        )}


                        {/* Error */}

                        {error && (

                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-scale">

                                {error}

                            </div>

                        )}


                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >


                            {/* Email */}

                            <div>

                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="you@example.com"
                                    required
                                    className="drivix-input w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                                />

                            </div>


                            {/* Password */}

                            <div>

                                <div className="flex justify-between mb-2">

                                    <label className="text-sm font-bold text-gray-700">
                                        Password
                                    </label>

                                    <button
                                        type="button"
                                        className="text-xs text-gray-400 hover:text-black"
                                    >
                                        Forgot password?
                                    </button>

                                </div>


                                <div className="relative">

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter password"
                                        required
                                        className="drivix-input w-full px-4 py-4 pr-12 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                                    />


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
                                    >

                                        {showPassword
                                            ? <EyeOff size={20} />
                                            : <Eye size={20} />
                                        }

                                    </button>

                                </div>

                            </div>


                            {/* Button */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="drivix-button w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-60"
                            >

                                {loading
                                    ? "Signing in..."
                                    : "Sign In"
                                }

                                {!loading && (
                                    <ArrowRight
                                        size={19}
                                    />
                                )}

                            </button>


                        </form>


                        {/* Divider */}

                        <div className="flex items-center gap-4 my-7">

                            <div className="h-px bg-gray-200 flex-1" />

                            <span className="text-xs text-gray-400">
                                OR
                            </span>

                            <div className="h-px bg-gray-200 flex-1" />

                        </div>


                        {/* Signup */}

                        <p className="text-center text-sm text-gray-500">

                            New to Drivix?{" "}

                            <Link
                                to="/signup"
                                className="font-black text-gray-900 hover:text-yellow-600 transition"
                            >
                                Create an account
                            </Link>

                        </p>

                    </div>


                    <p className="text-center text-xs text-gray-400 mt-6">

                        <ShieldCheck
                            size={14}
                            className="inline mr-1"
                        />

                        Your account is protected with secure authentication.

                    </p>

                </div>

            </section>

        </div>

    );

};


export default Login;