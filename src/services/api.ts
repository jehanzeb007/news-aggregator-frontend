import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  withCredentials: true, // only needed if Laravel uses cookies
});

// Optional: Auto set bearer token if you store it in localStorage
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
