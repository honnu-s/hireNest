
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

function uploadResumeToCloudinary(buffer, fileName) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",  
        folder:        "ats/resumes",
        public_id:     fileName,
        format:        "pdf",    
        type:          "upload",
        overwrite:     true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

async function deleteResumeFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.error("[Cloudinary] Failed to delete old resume:", err.message);
  }
}

/**
 * Generates a short-lived signed URL for a raw PDF asset.
 * Raw files on Cloudinary's free plan are not publicly accessible via plain URLs,
 * but signed URLs work on all plans.
 *
 * @param {string} publicId  - the public_id stored in your DB (e.g. "ats/resumes/userId-timestamp")
 * @param {number} expiresIn - seconds until the link expires (default: 120s)
 * @returns {string}         - a signed https URL the browser can open directly
 */
function generateSignedResumeUrl(publicId, expiresIn = 120) {
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type:          "upload",
    sign_url:      true,
    expires_at:    expires,
    secure:        true,
  });
}

module.exports = { uploadResumeToCloudinary, deleteResumeFromCloudinary, generateSignedResumeUrl };
