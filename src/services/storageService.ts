/**
 * Upload a media blob (JPEG image or WebM/MP4 video) to Cloudinary.
 *
 * Image → VITE_CLOUDINARY_UPLOAD_PRESET  (trjrx44o)   → /image/upload
 * Video → VITE_CLOUDINARY_VIDEO_PRESET   (afelink_video) → /video/upload
 */
export const uploadSnapshot = async (blob: Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('VITE_CLOUDINARY_CLOUD_NAME missing in .env');

  const isVideo      = blob.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';

  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!uploadPreset) {
    throw new Error('VITE_CLOUDINARY_UPLOAD_PRESET missing in .env');
  }

  const ext      = isVideo ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
  const filename = `${resourceType}_${Date.now()}.${ext}`;

  console.log(
    `[Cloudinary] Uploading ${filename} | ` +
    `${(blob.size / 1024).toFixed(1)} KB | ` +
    `preset: ${uploadPreset} | endpoint: /auto/upload`
  );

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData.error?.message || errMsg;
    } catch (_) {}
    console.error(`[Cloudinary] Upload failed (${resourceType}):`, errMsg);
    throw new Error(`Cloudinary ${resourceType} upload failed: ${errMsg}`);
  }

  const data = await response.json();
  console.log(`[Cloudinary] ✅ ${resourceType} → ${data.secure_url}`);
  return data.secure_url as string;
};
