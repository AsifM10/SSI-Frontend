// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://10.210.12.12:8080",
// });

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;



//new code with D- 
import axios from "axios";
import { clearSession } from "../utils/sessionManager";

const api = axios.create({

    baseURL: "http://10.210.12.12:8080",
    timeout: 30000,

});

api.interceptors.request.use(

    (config) => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers.Authorization = `Bearer ${token}`;

        }

        return config;

    },

    (error) => Promise.reject(error)

);

api.interceptors.response.use(

    (response) => response,

    (error) => {

        const status = error.response?.status;

        const url = error.config?.url || "";

        if (status === 401 && !url.includes("/auth/login")) {

            clearSession();

            window.location.href = "/";

        }

        return Promise.reject(error);

    }

);

export default api;
export const sendOtp = async ({ email, purpose }) => {
    const response = await api.post("/auth/otp/send", { email, purpose });
    return response.data;
};
