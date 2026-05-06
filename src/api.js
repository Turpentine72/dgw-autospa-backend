const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiFetch = (endpoint, options) => fetch(`${API_BASE}${endpoint}`, options);