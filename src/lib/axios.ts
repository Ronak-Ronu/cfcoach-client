import axios, { AxiosError } from 'axios';

const instance = axios.create({
  // baseURL: 'http://localhost:5000/api',
  baseURL:  import.meta.env.VITE_BACKEND_API_URL+'/api',

});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export { AxiosError };