import axios from 'axios';
import axiosInstance from '#shared/api';

export class FileConversionTimeoutError extends Error {
  constructor() {
    super('FILE_CONVERSION_TIMEOUT');
    this.name = 'FileConversionTimeoutError';
  }
}

/** S3 프리사인 URL을 통해 파일을 서버에 업로드 */
export async function uploadFileToServer(file: File): Promise<string> {
  const initResponse = await axiosInstance.post('/s3/request-presign', {
    originalFileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const { uploadUrl, finalUrl, isPdf } = initResponse.data as {
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

  if (!isPdf) {
    await pollForFile(finalUrl);
  }

  return finalUrl;
}

// ---------------------------------------------------------
// Helper: DB 없이 파일 생성 여부 확인하기 (S3 직접 조회)
// ---------------------------------------------------------
async function pollForFile(url: string, timeout: number = 60000): Promise<boolean> {
  const startTime = Date.now();

  const encodedUrl = encodeURIComponent(url);
  while (Date.now() - startTime < timeout) {
    const res = await axiosInstance.get(`/s3/check-file-exist?url=${encodedUrl}`);
    if ((res.data as { status: string }).status === 'EXIST') {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new FileConversionTimeoutError();
}
