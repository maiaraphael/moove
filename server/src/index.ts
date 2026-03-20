import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './api/auth';
import userRoutes from './api/users';
import adminRoutes from './api/admin';
import storeRoutes from './api/store';
import tournamentRoutes from './api/tournaments';
import collectionRoutes from './api/collection';
import battlepassRoutes from './api/battlepass';
import uploadRoutes from './api/upload';
import paymentRoutes from './api/payment';
import vipRoutes from './api/vip';
import missionsRoutes from './api/missions';
import friendsRoutes from './api/friends';
import clansRoutes from './api/clans';
import { setupMultiplayer } from './multiplayer/roomManager';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174', '*'] }));
app.use(express.json());
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174', '*'],
        methods: ['GET', 'POST']
    }
});

// Root health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Moove Backend Running' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/store', apiLimiter, storeRoutes);
app.use('/api/tournaments', apiLimiter, tournamentRoutes);
app.use('/api/collection', apiLimiter, collectionRoutes);
app.use('/api/battlepass', apiLimiter, battlepassRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/payment', apiLimiter, paymentRoutes);
app.use('/api/vip', apiLimiter, vipRoutes);
app.use('/api/missions', apiLimiter, missionsRoutes);
app.use('/api/friends', apiLimiter, friendsRoutes);
app.use('/api/clans', apiLimiter, clansRoutes);

setupMultiplayer(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
