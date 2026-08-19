// import { Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { selectToken } from "../store/slices/authSlice";
// import { isSessionExpired } from "../utils/sessionManager";

// const ProtectedRoute = ({ children }) => {

//     const token = useSelector(selectToken);

//     const localToken = localStorage.getItem("token");

//     if (!token || !localToken) {

//         return <Navigate to="/" replace />;

//     }

//     if (isSessionExpired()) {

//         localStorage.clear();

//         return <Navigate to="/" replace />;

//     }

//     return children;
// };

// export default ProtectedRoute;



//new code with refresh automaticlly- 

import { Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { useEffect } from "react";
import { isSessionExpired } from "../utils/sessionManager";

const ProtectedRoute = ({ children }) => {
    const dispatch = useDispatch();

    const token = localStorage.getItem("token");

    useEffect(() => {
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem("token");

            if (!currentToken || isSessionExpired()) {
                dispatch(logout());
                window.location.href = "/";
            }
        }, 1000); // check every second

        return () => clearInterval(interval);
    }, [dispatch]);

    if (!token || isSessionExpired()) {
        dispatch(logout());
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;

