import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";


import Login
    from "../pages/auth/Login";

import Signup
    from "../pages/auth/Signup";


import UserHome
    from "../pages/user/UserHome";

import DriverHome
    from "../pages/driver/DriverHome";

import AdminHome
    from "../pages/admin/AdminHome";


import ProtectedRoute
    from "../components/common/ProtectedRoute";


const AppRoutes = () => {

    return (

        <BrowserRouter>

            <Routes>

                {/* =====================================
                    AUTH
                ===================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                <Route
                    path="/signup"
                    element={<Signup />}
                />


                {/* =====================================
                    USER
                ===================================== */}

                <Route
                    path="/user"
                    element={

                        <ProtectedRoute
                            allowedRole="user"
                        >

                            <UserHome />

                        </ProtectedRoute>

                    }
                />


                {/* =====================================
                    DRIVER
                ===================================== */}

                <Route
                    path="/driver"
                    element={

                        <ProtectedRoute
                            allowedRole="driver"
                        >

                            <DriverHome />

                        </ProtectedRoute>

                    }
                />


                {/* =====================================
                    ADMIN
                ===================================== */}

                <Route
                    path="/admin"
                    element={

                        <ProtectedRoute
                            allowedRole="admin"
                        >

                            <AdminHome />

                        </ProtectedRoute>

                    }
                />


                {/* =====================================
                    DEFAULT
                ===================================== */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />


                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>

    );

};


export default AppRoutes;