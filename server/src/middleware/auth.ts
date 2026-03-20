import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string; role: string; username: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Token missing' });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
            res.status(403).json({ error: 'Token invalid or expired' });
            return;
        }
        req.user = decoded as any;
        next();
    });
};
