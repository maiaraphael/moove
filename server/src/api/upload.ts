import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas (PNG, JPG, GIF, WebP, SVG)'));
        }
    }
});

// POST /api/upload
router.post('/', authenticateToken, upload.single('file'), (req: AuthRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Return the URL that the frontend can use
        const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;
