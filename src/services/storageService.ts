

export const uploadSnapshot = async (blob: Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary credentials missing in .env");
    throw new Error("Cloudinary credentials missing");
  }

  const formData = new FormData();
  formData.append('file', blob, 'live.jpg');
  formData.append('upload_preset', uploadPreset);
  // Cloudinary often blocks the 'folder' parameter for unsigned uploads
  // unless explicitly allowed in your preset settings.
  // formData.append('folder', `emergencies/${sessionId}`);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};
