import { Slide, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const options: ToastOptions = {
  position: 'top-center',
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'colored',
  transition: Slide,
};

export default class CustomToast {
  static success(message: string) {
    toast.success(message, options);
  }

  static error(message: string) {
    toast.error(message, options);
  }

  static info(message: string) {
    toast.info(message, options);
  }
}
