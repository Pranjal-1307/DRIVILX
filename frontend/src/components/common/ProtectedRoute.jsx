import {
    Navigate
} from "react-router-dom";

import {
    useAuth
} from "../../context/AuthContext";


const ProtectedRoute = ({
    children,
    allowedRole
}) => {

    const {
        user
    } = useAuth();


    // Not logged in
    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );

    }


    // Wrong role
    if (
        allowedRole &&
        user.role !== allowedRole
    ) {

        if (user.role === "user") {

            return (
                <Navigate
                    to="/user"
                    replace
                />
            );

        }


        if (user.role === "driver") {

            return (
                <Navigate
                    to="/driver"
                    replace
                />
            );

        }


        if (user.role === "admin") {

            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );

        }

    }


    return children;

};


export default ProtectedRoute;