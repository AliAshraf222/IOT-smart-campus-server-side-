import multer from "multer";
import path from "path";
import fs from "fs";
import { NextFunction, Request, Response } from "express";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join(process.cwd(), "images");
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // Use timestamp to avoid overwriting
    const uniqueName = `licence_image${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer configuration with file filter and size limit
const upload = multer({ storage: storage }).single("image"); // Expecting a field named 'image'

export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload(req, res, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error uploading file", error: err });
    }
    // Pass the image path to the request object
    console.log("req.file", req.file?.path);
    req.body.imagePath = req.file?.path; // Save the image path to req.imagePath
    next(); // Call the next middleware/controller
  });
};
