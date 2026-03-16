import axios from 'axios';
import axiosInstance from '#shared/api';

/** 파일을 서버에 업로드 (PDF: 프리사인 URL, 비PDF: 직접 업로드) */
export async function uploadFileToServer(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf';

  if (isPdf) {
    return uploadPdfViaPresign(file);
  }
  return uploadNonPdf(file);
}

/** PDF 파일: S3 프리사인 URL을 통해 업로드 */
async function uploadPdfViaPresign(file: File): Promise<string> {
  const initResponse = await axiosInstance.post('/s3/request-presign', {
    originalFileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const { uploadUrl, finalUrl } = initResponse.data as {
    uploadUrl: string;
    finalUrl: string;
    isPdf: boolean;
  };

  const encodedFileName = encodeURIComponent(file.name);

  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
      'x-amz-meta-original-filename': encodedFileName,
    },
    withCredentials: false,
  });

  return finalUrl;
}

/** 비PDF 파일: 서버에 직접 업로드하여 PDF로 변환 */
async function uploadNonPdf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post('/s3/upload-non-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const { finalUrl } = response.data as {
    uploadUrl: string;
    finalUrl: string;
    isPdf: boolean;
  };

  return finalUrl;
}
