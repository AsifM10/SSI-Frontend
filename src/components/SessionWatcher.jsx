import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import {
    isSessionExpired,
    clearSession,
} from "../utils/sessionManager";

const SessionWatcher = () => {

    const dispatch = useDispatch();

    useEffect(() => {

        const interval = setInterval(() => {

            if (isSessionExpired()) {

                clearSession();

                dispatch(logout());

                window.location.href = "/";
            }

        }, 5000);

        return () => clearInterval(interval);

    }, [dispatch]);

    return null;
};

export default SessionWatcher;