import axios from "axios";

export const api = axios.create({
    baseURL: "http://192.168.29.91:8000/api/",
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

export const controlEntity = async (entityId: number, command: any) => {
    const response = await api.post(`/entities/${entityId}/control/`, command);
    return response.data;
};
