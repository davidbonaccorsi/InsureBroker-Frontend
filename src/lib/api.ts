import axios from 'axios';

// Keep port 8081 to match your Spring Boot application!
const API_BASE_URL = 'http://localhost:8081/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    // Must match the key used in AuthContext
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors and session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the backend returns 401 Unauthorized (e.g., token expired or invalid)
        if (error.response?.status === 401) {
            console.warn("Session expired or invalid. Logging out...");

            // Clear the local storage items
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');

            // Force redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);