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
    console.log(error.code, error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    CustomToast.error(error.message);
     console.log("Axios Error 전체 ▶", error);

    // 에러를 JSON으로도 찍어볼 수 있습니다. (순환 참조가 있으면 주의)
    try {
      console.log("Axios Error.toJSON() ▶", error.toJSON());
    } catch (e) {
      console.warn("error.toJSON() 출력 중 예외 발생:", e);
    }

    // error.request나 error.config 같은 속성들도 찍어보세요.
    console.log("▶ request 객체 ▶", error.request);
    console.log("▶ config ▶", error.config);
    console.log("▶ response ▶", error.response);

    return Promise.reject(error);

  }
);

export default axiosInstance;
