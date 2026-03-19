import axiosInstance from '#shared/api';

/** 파일을 서버에 업로드 (PDF, PPT, DOCX → PDF 변환 후 S3 + Gemini 업로드) */
export async function uploadFileToServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post('/upload-doc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const { uploadedUrl } = response.data as { uploadedUrl: string };
  return uploadedUrl;
}
