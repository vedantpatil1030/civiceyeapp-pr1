import axios from "axios";
import { getAccessToken, refreshTokens } from "./authService";

const api = axios.create({
    baseURL : "http://localhost:8000/api/v1",
});

//Attach Token before request
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

//Handle Expired Token
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const newAccessToken = await refreshTokens();
            if (newAccessToken) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            }
    }
    return Promise.reject(error);
    }
);

export default api;