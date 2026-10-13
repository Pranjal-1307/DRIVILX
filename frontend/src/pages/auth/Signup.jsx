import { useState, useEffect } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    Car,
    UserRound,
    BriefcaseBusiness,
    Sparkles,
    UserPlus
} from "lucide-react";

import {
    signupUser
} from "../../services/authService";

import {
    useAuth
} from "../../context/AuthContext";


const Signup = () => {

    const navigate = useNavigate();

    const { user } = useAuth();


    const [form, setForm] = useState({

        name: "",

        email: "",

        password: "",

        role: "user"

    });


    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] =
        useState("");

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


    const handleChange = (event) => {

        setForm({

            ...form,

            [event.target.name]:
                event.target.value

        });

    };


    const selectRole = (role) => {

        setForm({

            ...form,

            role

        });

    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setLoading(true);

        try {

            const data =
                await signupUser(

                    form.name,

                    form.email,

                    form.password,

                    form.role

                );


            if (!data?.user) {

                setError(
                    data?.error || data?.message || "Registration failed."
                );

                return;

            }


            navigate("/login", {
                state: {
                    message: "Account created successfully! Please sign in to continue."
                }
            });

        }

        catch (err) {

            setError(

                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to create account."

            );

        }

        finally {

            setLoading(false);

        }

    };


    return (

        <div className="min-h-screen bg-[#06080d] flex overflow-hidden">


            {/* =================================================
                LEFT
            ================================================= */}

            <section className="hidden lg:flex lg:w-[48%] relative overflow-hidden">


                <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#080b12] to-[#020304]" />


                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-yellow-400/10 blur-[120px] animate-glow" />

                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-glow" />


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

                    <div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 text-yellow-300 text-sm animate-fade-right">

                            <Sparkles size={15} />

                            Welcome to the future of mobility

                        </div>


                        <h1
                            className="text-6xl xl:text-7xl font-black text-white leading-[1.02] mt-7 animate-fade-right"
                            style={{
                                animationDelay:
                                    "0.15s",
                                opacity: 0
                            }}
                        >

                            One account.
                            <br />

                            <span className="text-yellow-400">
                                Endless journeys.
                            </span>

                        </h1>


                        <p
                            className="text-gray-400 text-lg max-w-xl leading-relaxed mt-7 animate-fade-right"
                            style={{
                                animationDelay:
                                    "0.3s",
                                opacity: 0
                            }}
                        >

                            Join thousands of users and
                            professional drivers building a
                            smarter way to travel.

                        </p>


                        {/* Animated floating cards */}

                        <div className="relative h-44 mt-10">


                            <div className="absolute left-0 top-0 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 w-64 animate-float">

                                <UserRound
                                    className="text-yellow-400 mb-3"
                                    size={25}
                                />

                                <p className="text-white font-bold">
                                    Ride with confidence
                                </p>

                                <p className="text-gray-500 text-sm mt-1">
                                    Verified professional drivers.
                                </p>

                            </div>


                            <div
                                className="absolute right-5 top-12 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 w-64 animate-float-slow"
                            >

                                <BriefcaseBusiness
                                    className="text-yellow-400 mb-3"
                                    size={25}
                                />

                                <p className="text-white font-bold">
                                    Drive & earn
                                </p>

                                <p className="text-gray-500 text-sm mt-1">
                                    Turn your driving skills into income.
                                </p>

                            </div>

                        </div>

                    </div>


                    <p className="text-gray-600 text-sm">
                        © 2026 Drivix. All rights reserved.
                    </p>

                </div>

            </section>


            {/* =================================================
                SIGNUP
            ================================================= */}

            <section className="w-full lg:w-[52%] bg-[#f5f6f8] flex items-center justify-center px-5 py-10 overflow-y-auto">


                <div className="w-full max-w-lg">


                    {/* Mobile logo */}

                    <div className="lg:hidden flex justify-center mb-8">

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

                    <div className="drivix-auth-card bg-white rounded-[30px] p-8 md:p-10 border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.09)]">


                        {/* Header */}

                        <div className="mb-7">

                            <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-5">

                                <UserPlus
                                    size={23}
                                    className="text-yellow-600"
                                />

                            </div>


                            <p className="text-yellow-600 font-bold text-xs tracking-[0.2em]">
                                GET STARTED
                            </p>


                            <h2 className="text-3xl font-black text-gray-900 mt-2">
                                Sign Up
                            </h2>


                            <p className="text-gray-500 mt-2">

                                Choose how you want to use Drivix.
                            </p>

                        </div>


                        {/* Error */}

                        {error && (

                            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-scale">

                                {error}

                            </div>

                        )}


                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >


                            {/* Name */}

                            <div>

                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Full name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="John Doe"
                                    required
                                    className="drivix-input w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                                />

                            </div>


                            {/* Email */}

                            <div>

                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="you@example.com"
                                    required
                                    className="drivix-input w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                                />

                            </div>


                            {/* Password */}

                            <div>

                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Password
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        value={form.password}
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Minimum 6 characters"
                                        minLength="6"
                                        required
                                        className="drivix-input w-full px-4 py-4 pr-12 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                                    />


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                    >

                                        {showPassword
                                            ? <EyeOff size={20} />
                                            : <Eye size={20} />
                                        }

                                    </button>

                                </div>

                            </div>


                            {/* Role */}

                            <div>

                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Choose account type
                                </label>


                                <div className="grid grid-cols-2 gap-4">


                                    {/* USER */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            selectRole(
                                                "user"
                                            )
                                        }
                                        className={`drivix-role-card text-left rounded-2xl p-5 border ${form.role === "user"
                                            ? "border-yellow-400 bg-yellow-50 shadow-[0_10px_30px_rgba(250,204,21,0.12)]"
                                            : "border-gray-200 bg-gray-50"
                                            }`}
                                    >

                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${form.role === "user"
                                            ? "bg-yellow-400 text-black"
                                            : "bg-white text-gray-500"
                                            }`}>

                                            <UserRound
                                                size={21}
                                            />

                                        </div>


                                        <p className="font-black mt-4">
                                            User
                                        </p>


                                        <p className="text-xs text-gray-500 mt-1">
                                            Book a professional driver
                                        </p>


                                        {form.role === "user" && (

                                            <div className="mt-3 text-xs font-bold text-yellow-700">
                                                ✓ Selected
                                            </div>

                                        )}

                                    </button>


                                    {/* DRIVER */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            selectRole(
                                                "driver"
                                            )
                                        }
                                        className={`drivix-role-card text-left rounded-2xl p-5 border ${form.role === "driver"
                                            ? "border-yellow-400 bg-yellow-50 shadow-[0_10px_30px_rgba(250,204,21,0.12)]"
                                            : "border-gray-200 bg-gray-50"
                                            }`}
                                    >

                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${form.role === "driver"
                                            ? "bg-yellow-400 text-black"
                                            : "bg-white text-gray-500"
                                            }`}>

                                            <BriefcaseBusiness
                                                size={21}
                                            />

                                        </div>


                                        <p className="font-black mt-4">
                                            Driver
                                        </p>


                                        <p className="text-xs text-gray-500 mt-1">
                                            Provide driving services
                                        </p>


                                        {form.role === "driver" && (

                                            <div className="mt-3 text-xs font-bold text-yellow-700">
                                                ✓ Selected
                                            </div>

                                        )}

                                    </button>

                                </div>

                            </div>


                            {/* Driver notice */}

                            {form.role === "driver" && (

                                <div className="flex gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 animate-fade-up">

                                    <ShieldCheck
                                        size={22}
                                        className="text-yellow-600 shrink-0"
                                    />

                                    <div>

                                        <p className="text-sm font-bold text-yellow-800">
                                            KYC verification required
                                        </p>

                                        <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                                            Driver accounts must complete
                                            identity verification before
                                            receiving booking requests.
                                        </p>

                                    </div>

                                </div>

                            )}


                            {/* Button */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="drivix-button w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-60"
                            >

                                {loading
                                    ? "Creating account..."
                                    : "Create Account"
                                }


                                {!loading && (

                                    <ArrowRight
                                        size={19}
                                    />

                                )}

                            </button>

                        </form>


                        {/* Login */}

                        <p className="text-center text-sm text-gray-500 mt-7">

                            Already have an account?{" "}

                            <Link
                                to="/login"
                                className="font-black text-gray-900 hover:text-yellow-600 transition"
                            >
                                Sign in
                            </Link>

                        </p>

                    </div>


                    <div className="flex justify-center items-center gap-2 text-xs text-gray-400 mt-6">

                        <ShieldCheck size={14} />

                        Secure registration with Drivix

                    </div>

                </div>

            </section>

        </div>

    );

};


export default Signup;