import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/collection - Listar itens do perfil
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const inventory = await prisma.inventory.findMany({
            where: { userId },
            orderBy: { acquiredAt: 'desc' }
        });

        // Busca detalhes dos itens sem filtrar por isActive
        // (itens desativados na loja ainda devem aparecer na coleção do jogador)
        const itemIds = inventory.map(inv => inv.itemId);
        const storeItems = await prisma.storeItem.findMany({
            where: { id: { in: itemIds } }
        });
        const storeItemMap = new Map(storeItems.map(item => [item.id, item]));

        const result = inventory.map(inv => ({
            ...inv,
            storeItem: storeItemMap.get(inv.itemId) || null
        }));

        res.json(result);
    } catch (err) {
        console.error('Collection fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

// PUT /api/collection/equip/:itemId - Equipar item
router.put('/equip/:itemId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const itemId: string = String(req.params.itemId);
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Acha o item no inventario para obter o Category
        const itemToEquip = await prisma.inventory.findFirst({
            where: { userId, itemId: String(itemId) }
        });

        if (!itemToEquip) {
            return res.status(404).json({ error: 'Item not found in your inventory' });
        }

        // Tira isEquipped de todos do mesmo tipo, e equipa o novo
        await prisma.$transaction([
            prisma.inventory.updateMany({
                where: { userId, itemType: itemToEquip.itemType },
                data: { isEquipped: false }
            }),
            prisma.inventory.update({
                where: { id: itemToEquip.id },
                data: { isEquipped: true }
            })
        ]);

        // Se for um AVATAR, atualiza avatarUrl do usuário
        let newAvatarUrl: string | null = null;
        if (itemToEquip.itemType === 'AVATAR') {
            const storeItem = await prisma.storeItem.findUnique({ where: { id: itemId } });
            // Use storeItem.imageUrl, or fallback to imageUrl sent from frontend
            const bodyImageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : undefined;
            newAvatarUrl = storeItem?.imageUrl || bodyImageUrl || null;
            if (newAvatarUrl) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { avatarUrl: newAvatarUrl }
                });
                // Also save it back to the storeItem if it was missing
                if (!storeItem?.imageUrl && newAvatarUrl) {
                    await prisma.storeItem.update({
                        where: { id: itemId },
                        data: { imageUrl: newAvatarUrl }
                    });
                }
            }
        }

        res.json({ message: 'Item equipped successfully!', avatarUrl: newAvatarUrl });

    } catch (err) {
        console.error('Equip error:', err);
        res.status(500).json({ error: 'Failed to equip item' });
    }
});

export default router;
