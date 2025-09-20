import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // set to false if you don't use cookies
});

export default api;
