import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

// Cloudinary storage for documents (PDF, images)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "beneficiary-documents",
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// Multer upload configuration
export const uploadDocuments = multer({
  storage: documentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});
