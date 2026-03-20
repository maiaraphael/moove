import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/store - Listar todos os itens a venda
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.storeItem.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    } catch (err) {
        console.error('Store fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch store items' });
    }
});

// POST /api/store/buy - Comprar item
router.post('/buy', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.user?.id;

        if (!userId || !itemId) {
            res.status(400).json({ error: 'Missing parameters' });
            return;
        }

        // Recupera item e o usuário
        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verifica saldo
        if (item.currency === 'Credits' && user.credits < item.price) {
            res.status(400).json({ error: 'Insufficient credits' });
            return;
        }
        if (item.currency === 'Gems' && user.gems < item.price) {
            res.status(400).json({ error: 'Insufficient gems' });
            return;
        }

        // Confere se já possui o item no inventário
        const existingInventory = await prisma.inventory.findFirst({
            where: { userId, itemId }
        });

        if (existingInventory) {
            res.status(400).json({ error: 'Item already owned' });
            return;
        }

        const userUpdateData: any = {};
        if (item.currency === 'Credits') {
            userUpdateData.credits = { decrement: item.price };
        } else if (item.currency === 'Gems') {
            userUpdateData.gems = { decrement: item.price };
        }

        // Transação
        await prisma.$transaction([
            // Desconta o dinheiro
            prisma.user.update({
                where: { id: userId },
                data: userUpdateData
            }),
            // Adiciona ao Inventário com o tipo contido na tag do produto
            prisma.inventory.create({
                data: {
                    userId,
                    itemId,
                    itemType: item.type,
                    isEquipped: false
                }
            })
        ]);

        res.json({ message: 'Purchase successful!' });

    } catch (err) {
        console.error('Purchase error:', err);
        res.status(500).json({ error: 'Transaction failed' });
    }
});

export default router;
