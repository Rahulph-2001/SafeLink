import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a media blob to the appropriate service:
 *   - Video clips  →  Firebase Storage  (no resource-type restrictions)
 *   - Images       →  Cloudinary
 *
 * Returns a public download URL that is stored in Firestore.
 */
export const uploadSnapshot = async (blob: Blob): Promise<string> => {
  const isVideo = blob.type.startsWith('video/');

  if (isVideo) {
    return uploadVideoToFirebase(blob);
  } else {
    return uploadImageToCloudinary(blob);
  }
};

// ─── Firebase Storage (video) ────────────────────────────────────────────────
const uploadVideoToFirebase = async (blob: Blob): Promise<string> => {
  const ext      = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const filename = `emergency_clips/clip_${Date.now()}.${ext}`;
  const fileRef  = ref(storage, filename);

  try {
    const snapshot = await uploadBytes(fileRef, blob, {
      contentType: blob.type || 'video/webm',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Firebase Storage video upload failed:', error);
    throw error;
  }
};

// ─── Cloudinary (image fallback) ─────────────────────────────────────────────
const uploadImageToCloudinary = async (blob: Blob): Promise<string> => {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials missing in .env');
  }

  const formData = new FormData();
  formData.append('file', blob, `snap_${Date.now()}.jpg`);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.secure_url as string;
};
