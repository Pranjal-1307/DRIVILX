import {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";


const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(() => {

        const savedUser = localStorage.getItem("drivilx_user");

        try {

            return savedUser ? JSON.parse(savedUser) : null;

        } catch {

            return null;

        }

    });

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        const savedUser = localStorage.getItem("drivilx_user");

        if (savedUser) {

            try {

                setUser(JSON.parse(savedUser));

            } catch {

                setUser(null);

            }

        }

        setLoading(false);

    }, []);


    const login = (data) => {

        if (data?.token) {

            localStorage.setItem("drivilx_token", data.token);

        }

        if (data?.user) {

            localStorage.setItem("drivilx_user", JSON.stringify(data.user));

            setUser(data.user);

        }

    };


    const logout = () => {

        localStorage.removeItem("drivilx_token");

        localStorage.removeItem("drivilx_user");

        setUser(null);

    };


    return (

        <AuthContext.Provider value={{ user, login, logout, loading }}>

            {children}

        </AuthContext.Provider>

    );

};


export const useAuth = () => {

    const context = useContext(AuthContext);

    if (!context) {

        throw new Error("useAuth must be used within an AuthProvider");

    }

    return context;

};


export default AuthContext;