import {
    Link
} from "react-router-dom";

import {
    useAuth
} from "../../context/AuthContext";


const Navbar = () => {

    const {
        user,
        logout
    } = useAuth();


    return (

        <nav className="bg-white border-b border-gray-200">

            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo */}

                <Link
                    to="/"
                    className="text-2xl font-bold tracking-tight"
                >
                    Drivix
                </Link>


                {/* User */}

                {user && (

                    <div className="flex items-center gap-5">

                        <div className="text-right">

                            <p className="font-semibold">
                                {user.name}
                            </p>

                            <p className="text-xs text-gray-500 capitalize">
                                {user.role}
                            </p>

                        </div>


                        <button
                            onClick={logout}
                            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
                        >
                            Logout
                        </button>

                    </div>

                )}

            </div>

        </nav>

    );

};


export default Navbar;