/**
 * Upload any media blob to Cloudinary.
 *
 * Routing:
 *   video/* → VITE_CLOUDINARY_VIDEO_PRESET (afelink_video) via /video/upload
 *   image/* → VITE_CLOUDINARY_UPLOAD_PRESET (trjrx44o)     via /image/upload
 */
export const uploadSnapshot = async (blob: Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME missing in .env');
  }

  const isVideo = blob.type.startsWith('video/');

  const uploadPreset = isVideo
    ? import.meta.env.VITE_CLOUDINARY_VIDEO_PRESET   // afelink_video  → /video/upload
    : import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // trjrx44o       → /image/upload

  if (!uploadPreset) {
    throw new Error(
      isVideo
        ? 'VITE_CLOUDINARY_VIDEO_PRESET missing in .env'
        : 'VITE_CLOUDINARY_UPLOAD_PRESET missing in .env'
    );
  }

  const resourceType = isVideo ? 'video' : 'image';
  const ext = isVideo ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
  const filename = `${resourceType}_${Date.now()}.${ext}`;

  console.log(
    `[Cloudinary] Uploading ${filename} | ` +
    `size: ${(blob.size / 1024).toFixed(1)} KB | ` +
    `preset: ${uploadPreset} | ` +
    `endpoint: /${resourceType}/upload`
  );

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errMsg = errorData.error?.message || errMsg;
    } catch (_) {}
    console.error(`[Cloudinary] Upload failed:`, errMsg);
    throw new Error(`Cloudinary upload failed: ${errMsg}`);
  }

  const data = await response.json();
  console.log(`[Cloudinary] ✅ Upload success → ${data.secure_url}`);
  return data.secure_url as string;
};
