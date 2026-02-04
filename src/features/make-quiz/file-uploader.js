import axios from 'axios';
import axiosInstance from '#shared/api';

export async function uploadFileToServer(file) {
  const initResponse = await axiosInstance.post('/s3/request-presign', {
    originalFileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const { uploadUrl, finalUrl, isPdf } = initResponse.data;

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
async function pollForFile(url, timeout = 60000) {
  const startTime = Date.now();

  const encodedUrl = encodeURIComponent(url);
  while (Date.now() - startTime < timeout) {
    const res = await axiosInstance.get(`/s3/check-file-exist?url=${encodedUrl}`);
    if (res.data.status === 'EXIST') {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('변환 시간 초과');
}
