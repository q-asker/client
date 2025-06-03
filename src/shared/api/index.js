import CustomToast from "#shared/toast";
import axios from "axios";
const apiBaseURL = import.meta.env.VITE_BASE_URL;

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.isMultipart) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    CustomToast.error(error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    CustomToast.error(error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
