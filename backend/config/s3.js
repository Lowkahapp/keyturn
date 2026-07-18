const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Local disk storage for development (no AWS needed)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, require('os').tmpdir()),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|webm/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

const deleteFromS3 = async (key) => {
  console.log('[DEV] S3 delete skipped:', key);
};

module.exports = { upload, deleteFromS3 };