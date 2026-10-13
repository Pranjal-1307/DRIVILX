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

                <div className="relative z-10 w-full p-14 flex flex-col justify-between">


                    {/* Logo */}

                    <div className="animate-fade-right">

                        <div className="flex items-center gap-3">

                            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_0_35px_rgba(250,204,21,0.25)]">

                                <Car
                                    size={27}
                                    className="text-black drivix-car"
                                />

                            </div>

                            <span className="text-3xl font-black text-white">
                                Drivix
                            </span>

                        </div>

                    </div>


                    {/* Main */}

                    <div className="max-w-2xl">


                        <div
                            className="animate-fade-right"
                            style={{
                                animationDelay:
                                    "0.15s",
                                opacity: 0
                            }}
                        >

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 text-yellow-300 text-sm">

                                <Sparkles size={15} />

                                The smarter way to travel

                            </div>

                        </div>


                        <h1
                            className="text-6xl xl:text-7xl font-black text-white leading-[1.02] mt-7 animate-fade-right"
                            style={{
                                animationDelay:
                                    "0.25s",
                                opacity: 0
                            }}
                        >

                            Your car.
                            <br />

                            <span className="text-yellow-400">
                                Our driver.
                            </span>

                        </h1>


                        <p
                            className="text-gray-400 text-lg max-w-xl leading-relaxed mt-7 animate-fade-right"
                            style={{
                                animationDelay:
                                    "0.4s",
                                opacity: 0
                            }}
                        >

                            Experience convenient,
                            reliable and professional
                            driver services designed
                            around your journey.

                        </p>


                        {/* Stats */}

                        <div
                            className="flex gap-10 mt-10 animate-fade-up"
                            style={{
                                animationDelay:
                                    "0.55s",
                                opacity: 0
                            }}
                        >

                            <div>

                                <p className="text-3xl font-black text-white">
                                    24/7
                                </p>

                                <p className="text-gray-500 text-sm mt-1">
                                    Availability
                                </p>

                            </div>


                            <div>

                                <p className="text-3xl font-black text-white">
                                    100%
                                </p>

                                <p className="text-gray-500 text-sm mt-1">
                                    Verified
                                </p>

                            </div>


                            <div>

                                <p className="text-3xl font-black text-white">
                                    1
                                </p>

                                <p className="text-gray-500 text-sm mt-1">
                                    Simple platform
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Bottom */}

                    <div>

                        <div className="flex items-center gap-2 text-gray-500 text-sm">

                            <ShieldCheck
                                size={16}
                                className="text-yellow-400"
                            />

                            Secure & trusted authentication

                        </div>

                    </div>

                </div>


                {/* Road animation */}

                <div className="drivix-road">

                    <div className="drivix-road-line" />
                    <div className="drivix-road-line" />
                    <div className="drivix-road-line" />
                    <div className="drivix-road-line" />

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