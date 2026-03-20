import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Xsolla Webhook ────────────────────────────────────────────────────────
// Xsolla sends a SHA1 HMAC signature in the Authorization header.
// Format: "Signature <hex>"
function verifyXsollaSignature(body: string, authHeader: string | undefined, projectKey: string): boolean {
    if (!authHeader) return false;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Signature') return false;
    const expected = crypto.createHash('sha1').update(body + projectKey).digest('hex');
    return expected === parts[1];
}

/**
 * POST /api/payment/xsolla/webhook
 *
 * Handles three notification types from Xsolla:
 *  - payment       → credits the user's Credits balance
 *  - user_validation → confirms the user exists
 *  - refund        → deducts the Credits
 *
 * Xsolla docs: https://developers.xsolla.com/webhooks/
 */
router.post('/xsolla/webhook', async (req, res) => {
    const projectKey = process.env.XSOLLA_PROJECT_KEY || '';
    const rawBody    = JSON.stringify(req.body);

    if (!verifyXsollaSignature(rawBody, req.headers['authorization'], projectKey)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const { notification_type, user, purchase } = req.body;

    try {
        // 1. User validation — Xsolla checks if the user exists before charging
        if (notification_type === 'user_validation') {
            const dbUser = await prisma.user.findUnique({ where: { id: user?.id } });
            if (!dbUser) return res.status(404).json({ error: 'User not found' });
            return res.status(204).send();
        }

        const dbUser = await prisma.user.findUnique({ where: { id: user?.id } });
        if (!dbUser) return res.status(404).json({ error: 'User not found' });

        // 2. Payment confirmed — credit the user
        if (notification_type === 'payment') {
            // purchase.virtual_currency.quantity = amount of Credits bought
            const creditsToAdd: number = Math.floor(purchase?.virtual_currency?.quantity ?? 0);
            if (creditsToAdd <= 0) return res.status(400).json({ error: 'Invalid credits amount' });

            await prisma.user.update({
                where: { id: dbUser.id },
                data: { credits: { increment: creditsToAdd } }
            });

            return res.status(204).send();
        }

        // 3. Refund — deduct the Credits (clamp to 0)
        if (notification_type === 'refund') {
            const creditsToRemove: number = Math.floor(purchase?.virtual_currency?.quantity ?? 0);
            if (creditsToRemove > 0) {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { credits: { decrement: creditsToRemove } }
                });
            }
            return res.status(204).send();
        }

        // Unknown type — acknowledge so Xsolla doesn't retry
        return res.status(204).send();

    } catch (err) {
        console.error('Xsolla webhook error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
});
// ───────────────────────────────────────────────────────────────────────────


/**
 * GEM PACKS — amounts and prices in cents (BRL).
 * In production this would be wired to Stripe/MercadoPago.
 * For now it is simulated: calling this endpoint instantly credits gems.
 */
const GEM_PACKS: Record<string, { gems: number; priceCents: number; label: string }> = {
    starter:   { gems: 500,   priceCents:  499, label: 'Starter Pack'   },
    standard:  { gems: 1200,  priceCents:  999, label: 'Standard Pack'  },
    value:     { gems: 2500,  priceCents: 1999, label: 'Value Pack'     },
    popular:   { gems: 6500,  priceCents: 4999, label: 'Popular Pack'   },
    mega:      { gems: 14000, priceCents: 9999, label: 'Mega Pack'      },
};

// GET /api/payment/gem-packs — list available gem packs
router.get('/gem-packs', (_req, res) => {
    const packs = Object.entries(GEM_PACKS).map(([id, p]) => ({
        id,
        gems: p.gems,
        priceCents: p.priceCents,
        priceLabel: `R$ ${(p.priceCents / 100).toFixed(2).replace('.', ',')}`,
        label: p.label,
    }));
    res.json(packs);
});

// POST /api/payment/buy-gems — simulate purchase of a gem pack
// Body: { packId: string }
// NOTE: Replace the credit logic here with a real payment webhook in production.
router.post('/buy-gems', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { packId } = req.body;
        const pack = GEM_PACKS[packId];
        if (!pack) return res.status(400).json({ error: 'Invalid pack ID' });

        await prisma.user.update({
            where: { id: userId },
            data: { gems: { increment: pack.gems } }
        });

        res.json({ success: true, gemsAdded: pack.gems, label: pack.label });
    } catch (err) {
        console.error('Buy gems error:', err);
        res.status(500).json({ error: 'Failed to process gem purchase' });
    }
});

export default router;
