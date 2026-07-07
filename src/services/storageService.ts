/**
 * Upload a media blob to Cloudinary.
 *
 * - Video clips  →  /video/upload  using VITE_CLOUDINARY_VIDEO_PRESET
 * - Images       →  /image/upload  using VITE_CLOUDINARY_UPLOAD_PRESET
 *
 * Returns the Cloudinary secure_url stored in Firestore.
 */
export const uploadSnapshot = async (blob: Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME missing in .env');
  }

  const isVideo = blob.type.startsWith('video/');

  if (isVideo) {
    return uploadToCloudinary(blob, cloudName, 'video');
  } else {
    return uploadToCloudinary(blob, cloudName, 'image');
  }
};

// ─── Internal helper ──────────────────────────────────────────────────────────
const uploadToCloudinary = async (
  blob: Blob,
  cloudName: string,
  resourceType: 'video' | 'image'
): Promise<string> => {

  // Pick the correct preset for video vs image
  const uploadPreset =
    resourceType === 'video'
      ? import.meta.env.VITE_CLOUDINARY_VIDEO_PRESET   // safelink_video preset (Resource type: Video)
      : import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // trjrx44o preset     (Resource type: Image)

  if (!uploadPreset) {
    throw new Error(
      `Cloudinary ${resourceType} upload preset missing in .env. ` +
      `Set VITE_CLOUDINARY_${resourceType.toUpperCase()}_PRESET.`
    );
  }

  const ext      = resourceType === 'video'
    ? (blob.type.includes('mp4') ? 'mp4' : 'webm')
    : 'jpg';
  const filename = `${resourceType}_${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Cloudinary ${resourceType} upload failed: ` +
        (errorData.error?.message || 'Unknown error')
      );
    }

    const data = await response.json();
    return data.secure_url as string;
  } catch (error) {
    console.error(`Error uploading ${resourceType} to Cloudinary:`, error);
    throw error;
  }
};
