import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error('[Upload] MISSING Cloudinary env vars:', {
        CLOUDINARY_CLOUD_NAME: !!cloudName,
        CLOUDINARY_API_KEY: !!apiKey,
        CLOUDINARY_API_SECRET: !!apiSecret,
    });
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

// Use memory storage — no disk needed
const upload = multer({
    storage: multer.memoryStorage(),
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
router.post('/', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const result = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'moove', resource_type: 'auto' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file!.buffer);
        });
        res.json({ url: result.secure_url, filename: result.public_id });
    } catch (err: any) {
        const msg = err?.message || String(err) || 'Upload failed';
        console.error('[Upload] error detail:', msg, '| Cloudinary configured:', !!cloudName);
        if (!cloudName || !apiKey || !apiSecret) {
            return res.status(500).json({ error: 'Cloudinary não configurado no servidor (variáveis de ambiente ausentes)' });
        }
        res.status(500).json({ error: msg });
    }
});

export default router;
