import axios from "axios";

export const api = axios.create({
    baseURL: "http://10.113.86.170:8000/api/",
    timeout: 8000,
    headers: {
        "Content-Type": "application/json",
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Token ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
};
