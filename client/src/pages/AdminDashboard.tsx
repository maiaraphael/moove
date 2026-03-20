import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users, Trophy, Package, Shield, LayoutDashboard,
    Search, Plus, Edit2, Trash2, Ban, Check, ArrowLeft, Star, Medal, Lock,
    UserPlus, DollarSign, Crown, Target
} from 'lucide-react';
import FramedAvatar from '../components/ui/FramedAvatar';
import PetViewer, { PET_ANIMATION_LABELS, PET_EFFECT_LABELS, DEFAULT_PET_CONFIG } from '../components/ui/PetViewer';
import type { PetConfig, PetAnimationType, PetEffectType } from '../components/ui/PetViewer';
import { FRAME_EFFECTS, DEFAULT_FRAME_CONFIG_STR, parseFrameConfig } from '../utils/frameUtils';

type Tab = 'overview' | 'users' | 'tournaments' | 'items' | 'ranks' | 'battlepass' | 'vip' | 'missions';

// MOCK_RANKS removed, will fetch dynamically

interface AdminStats {
    totalUsers: number;
    activeMatches: number;
    storeItems: number;
    activeTournaments: number;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeMatches: 0, storeItems: 0, activeTournaments: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [ranks, setRanks] = useState<any[]>([]);
    const [battlePasses, setBattlePasses] = useState<any[]>([]);
    const [selectedBpId, setSelectedBpId] = useState<string | null>(null);
    const [bpTiers, setBpTiers] = useState<any[]>([]);
    const [vipConfigs, setVipConfigs] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'item' | 'tournament' | 'rank' | 'user-create' | 'user-currency' | 'user-mmr' | 'battlepass' | 'tier' | 'vip' | 'mission'>('item');
    const [formData, setFormData] = useState<any>({});
    const [imageUploadLoading, setImageUploadLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fetchAllData = () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        const headers = { 'Authorization': `Bearer ${token}` };

        fetch('http://localhost:3000/api/admin/stats', { headers })
            .then(res => res.json()).then(setStats).catch(console.error);

        fetch('http://localhost:3000/api/admin/users', { headers })
            .then(res => res.json()).then(setUsers).catch(console.error);

        fetch('http://localhost:3000/api/admin/store', { headers })
            .then(res => res.json()).then(setItems).catch(console.error);

        fetch('http://localhost:3000/api/admin/ranks', { headers })
            .then(res => res.json()).then(setRanks).catch(console.error);

        fetch('http://localhost:3000/api/tournaments', { headers })
            .then(res => res.json()).then(setTournaments).catch(console.error);

        fetch('http://localhost:3000/api/admin/battlepass', { headers })
            .then(res => res.json()).then(setBattlePasses).catch(console.error);

        fetch('http://localhost:3000/api/admin/vip', { headers })
            .then(res => res.json()).then(setVipConfigs).catch(console.error);

        fetch('http://localhost:3000/api/admin/missions', { headers })
            .then(res => res.json()).then(setMissions).catch(console.error);
    };    useEffect(() => {
        fetchAllData();
    }, [navigate]);

    const fetchBpTiers = async (bpId: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/admin/battlepass/${bpId}/tiers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setBpTiers(await res.json());
    };

    useEffect(() => {
        if (!selectedBpId) { setBpTiers([]); return; }
        fetchBpTiers(selectedBpId);
    }, [selectedBpId]);

    const handleImageUpload = async (file: File) => {
        setImageUploadLoading(true);
        try {
            const token = localStorage.getItem('token');
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewUrl(data.url);
                setFormData((prev: any) => ({ ...prev, imageUrl: data.url }));
            }
        } catch (err) {
            console.error('Image upload failed:', err);
        } finally {
            setImageUploadLoading(false);
        }
    };

    const handleDelete = async (endpoint: string, id: string, name: string) => {
        const confirmed = window.confirm(`Deletar "${name}"?\nEsta ação não pode ser desfeita.`);
        if (!confirmed) return;
        const token = localStorage.getItem('token');
        if (!token) { alert('Sessão expirada. Faça login novamente.'); return; }
        try {
            console.log(`[DELETE] /api/admin/${endpoint}/${id}`);
            const res = await fetch(`http://localhost:3000/api/admin/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`[DELETE] status: ${res.status}`);
            if (res.ok) {
                fetchAllData();
            } else {
                let msg = `HTTP ${res.status}`;
                try { const d = await res.json(); msg = d.error || msg; } catch {}
                alert(`Erro ao deletar: ${msg}`);
            }
        } catch (err: any) {
            console.error('[DELETE] network error:', err);
            alert(`Erro de rede: ${err?.message || err}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) { alert('Sessão expirada. Faça login novamente.'); return; }

        if (modalType === 'user-create') {
            if (!formData.username || !formData.email || !formData.password) { alert('Preencha todos os campos obrigatórios.'); return; }
            try {
                const res = await fetch('http://localhost:3000/api/admin/users', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: formData.username, email: formData.email, password: formData.password, role: formData.role || 'USER' })
                });
                if (res.ok) { setModalOpen(false); setFormData({}); fetchAllData(); }
                else { let msg = 'Erro desconhecido'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }

        if (modalType === 'user-currency') {
            try {
                const res = await fetch(`http://localhost:3000/api/admin/users/${formData.id}/currency`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creditsAdjust: formData.creditsAdjust || 0, gemsAdjust: formData.gemsAdjust || 0 })
                });
                if (res.ok) { setModalOpen(false); setFormData({}); fetchAllData(); }
                else { let msg = 'Erro desconhecido'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }

        if (modalType === 'user-mmr') {
            try {
                const res = await fetch(`http://localhost:3000/api/admin/users/${formData.id}/mmr`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mmr: formData.newMmr ?? 0 })
                });
                if (res.ok) { setModalOpen(false); setFormData({}); fetchAllData(); }
                else { let msg = 'Erro desconhecido'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }

        // ── MISSION ──
        if (modalType === 'mission') {
            const isEditing = !!formData.id;
            const url = isEditing
                ? `http://localhost:3000/api/admin/missions/${formData.id}`
                : `http://localhost:3000/api/admin/missions`;
            try {
                const res = await fetch(url, {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        type: formData.type || 'PLAY_ANY',
                        parameter: formData.parameter || null,
                        requirement: parseInt(String(formData.requirement)) || 1,
                        xpReward: parseInt(String(formData.xpReward)) || 0,
                        gemsReward: parseInt(String(formData.gemsReward)) || 0,
                        isActive: formData.isActive !== false,
                    })
                });
                if (res.ok) { setModalOpen(false); setFormData({}); fetchAllData(); }
                else { let msg = 'Erro'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }

        // ── VIP ──
        if (modalType === 'vip') {
            const isEditing = !!formData.id;
            const url = isEditing
                ? `http://localhost:3000/api/admin/vip/${formData.id}`
                : `http://localhost:3000/api/admin/vip`;
            try {
                const res = await fetch(url, {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description,
                        imageUrl: formData.imageUrl,
                        price: parseInt(String(formData.price)) || 0,
                        durationDays: parseInt(String(formData.durationDays)) || 30,
                        gemsBonus: parseInt(String(formData.gemsBonus)) || 0,
                        xpBonus: parseInt(String(formData.xpBonus)) || 0,
                        noMmrLoss: !!formData.noMmrLoss,
                        isActive: formData.isActive !== false,
                    })
                });
                if (res.ok) { setModalOpen(false); setFormData({}); fetchAllData(); }
                else { let msg = 'Erro'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }
        const endpoint = modalType === 'item' ? 'store' : modalType === 'tournament' ? 'tournaments' : 'ranks';
        // ── Battle Pass ──
        if (modalType === 'battlepass') {
            const isEditing = !!formData.id;
            const url = isEditing
                ? `http://localhost:3000/api/admin/battlepass/${formData.id}`
                : `http://localhost:3000/api/admin/battlepass`;
            try {
                const res = await fetch(url, {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formData.name, season: parseInt(String(formData.season)) })
                });
                if (res.ok) { setModalOpen(false); setFormData({}); fetchAllData(); }
                else { let msg = 'Erro'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }
        // ── Tier ──
        if (modalType === 'tier') {
            const isEditing = !!formData.id;
            const url = isEditing
                ? `http://localhost:3000/api/admin/battlepass/${formData.battlePassId}/tiers/${formData.id}`
                : `http://localhost:3000/api/admin/battlepass/${formData.battlePassId}/tiers`;
            try {
                const body = isEditing
                    ? { freeItemId: formData.freeItemId || null, premiumItemId: formData.premiumItemId || null }
                    : { level: parseInt(String(formData.level)), freeItemId: formData.freeItemId || null, premiumItemId: formData.premiumItemId || null };
                const res = await fetch(url, {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (res.ok) {
                    setModalOpen(false); setFormData({});
                    if (formData.battlePassId) fetchBpTiers(formData.battlePassId);
                } else { let msg = 'Erro'; try { const d = await res.json(); msg = d.error || msg; } catch {} alert(`Erro: ${msg}`); }
            } catch (err: any) { alert(`Erro de rede: ${err?.message}`); }
            return;
        }
        const isEditing = !!formData.id;
        const url = isEditing
            ? `http://localhost:3000/api/admin/${endpoint}/${formData.id}`
            : `http://localhost:3000/api/admin/${endpoint}`;
        console.log(`[SUBMIT] ${isEditing ? 'PUT' : 'POST'} ${url}`, formData);
        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            console.log(`[SUBMIT] status: ${res.status}`);
            if (res.ok) {
                setModalOpen(false);
                setFormData({});
                setPreviewUrl(null);
                fetchAllData();
            } else {
                let msg = `HTTP ${res.status}`;
                try { const d = await res.json(); msg = d.error || msg; } catch {}
                alert(`Erro ao salvar: ${msg}`);
            }
        } catch (err: any) {
            console.error('[SUBMIT] network error:', err);
            alert(`Erro de rede: ${err?.message || err}`);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Tem certeza de que deseja excluir permanentemente este usuário?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChangePassword = async (userId: string) => {
        const newPassword = window.prompt('Digite a nova senha para este usuário (min 6 caracteres):');
        if (!newPassword) return;
        if (newPassword.length < 6) {
            alert('A senha precisa ter no mínimo 6 caracteres.');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });
            if (res.ok) {
                alert('Senha do usuário atualizada com sucesso!');
            } else {
                alert('Falha ao atualizar a senha.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-400' },
                            { label: 'Active Matches', value: stats.activeMatches || 0, icon: LayoutDashboard, color: 'text-green-400' },
                            { label: 'Store Items', value: stats.storeItems || 0, icon: Package, color: 'text-yellow-400' },
                            { label: 'Ongoing Tournaments', value: stats.activeTournaments || 0, icon: Trophy, color: 'text-[#b026ff]' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#120a1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-gray-400 font-bold tracking-wider uppercase text-sm">{stat.label}</h3>
                                    <stat.icon className={`${stat.color} opacity-80`} size={24} />
                                </div>
                                <p className="text-4xl font-black text-white relative z-10">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'users':
                return (
                    <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center gap-4 flex-wrap justify-between">
                            <h2 className="text-xl font-black text-white">User Management</h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        className="bg-black/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#b026ff] transition-colors"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => { setModalType('user-create'); setFormData({ role: 'USER' }); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                    <UserPlus size={16} /> Criar Usuário
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Rank / MMR</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Moedas / Gems</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{user.username}</span>
                                                    <span className="text-xs text-gray-500">{user.email}</span>
                                                    <span className={`text-[10px] font-black mt-0.5 uppercase tracking-wider ${user.role === 'ADMIN' ? 'text-red-400' : user.role === 'MODERATOR' ? 'text-blue-400' : 'text-gray-600'}`}>{user.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-purple-400">{user.rank}</span>
                                                    <span className="text-xs text-gray-500">{user.mmr} MMR</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-yellow-400">🪙 {(user.credits ?? 0).toLocaleString()}</span>
                                                    <span className="text-xs font-bold text-purple-400">💎 {user.gems ?? 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => { setModalType('user-currency'); setFormData({ id: user.id, username: user.username, creditsAdjust: 0, gemsAdjust: 0, currentCredits: user.credits ?? 0, currentGems: user.gems ?? 0 }); setModalOpen(true); }} title="Editar Credits / Gems" className="p-2 bg-white/5 hover:bg-yellow-500/20 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors">
                                                        <DollarSign size={16} />
                                                    </button>
                                                    <button onClick={() => { setModalType('user-mmr'); setFormData({ id: user.id, username: user.username, currentMmr: user.mmr ?? 0, newMmr: user.mmr ?? 0 }); setModalOpen(true); }} title="Editar MMR" className="p-2 bg-white/5 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 transition-colors">
                                                        <Medal size={16} />
                                                    </button>
                                                    <button onClick={() => handleChangePassword(user.id)} title="Alterar Senha" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(user.id, user.status)} title={user.status === 'ACTIVE' ? 'Banir Usuário' : 'Desbanir Usuário'} className={`p-2 bg-white/5 rounded-lg text-gray-400 transition-colors ${user.status === 'ACTIVE' ? 'hover:bg-red-500/20 hover:text-red-400' : 'hover:bg-green-500/20 hover:text-green-400'}`}>
                                                        {user.status === 'ACTIVE' ? <Ban size={16} /> : <Check size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} title="Excluir Permanentemente" className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'items': {
                const ITEM_CATEGORIES = [
                    { key: 'AVATAR', label: 'Avatars' },
                    { key: 'CARD_BACK', label: 'Card Sleeves' },
                    { key: 'FRAME', label: 'Frames' },
                    { key: 'EMOTE', label: 'Emoticons' },
                    { key: 'PET', label: 'Pets' },
                ];
                const [itemCategoryFilter, setItemCategoryFilter] = [activeTab, setActiveTab]; // reuse a different local state trick
                // Use separate local state via a function-level variable
                const allCategories = ['ALL', ...ITEM_CATEGORIES.map(c => c.key)];
                const RARITY_COLORS: Record<string, string> = {
                    Common: 'text-gray-400', Rare: 'text-red-400',
                    Epic: 'text-purple-400', Legendary: 'text-orange-400'
                };

                return (
                    <div className="flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-white">Store Items</h2>
                            <button onClick={() => { setModalType('item'); setFormData({ isFeatured: false, currency: 'Credits', rarity: 'Common', type: 'AVATAR', frameConfig: DEFAULT_FRAME_CONFIG_STR, petConfig: JSON.stringify({ modelUrl: '', animationType: 'FLOATING', effectType: 'NONE', effectValue: 0, scale: 1 }) }); setPreviewUrl(null); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        {/* Category Tabs */}
                        {ITEM_CATEGORIES.map(cat => {
                            const catItems = items.filter(i => i.type === cat.key);
                            if (catItems.length === 0) return null;
                            return (
                                <div key={cat.key} className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-[#b026ff]">{cat.label}</span>
                                        <span className="text-xs text-gray-500 font-bold">({catItems.length} items)</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/[0.02] border-b border-white/5">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest w-16">Image</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Name</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Rarity</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Price</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Featured</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Disponível</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {catItems.map(item => (
                                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-4 py-3">
                                                            {item.type === 'FRAME' && item.frameConfig ? (
                                                                <FramedAvatar
                                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=preview`}
                                                                    size={40}
                                                                    frameConfig={parseFrameConfig(item.frameConfig)}
                                                                />
                                                            ) : item.imageUrl ? (
                                                                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                                    <Package size={16} className="text-gray-600" />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-white">{item.name}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-xs font-black ${RARITY_COLORS[item.rarity] || 'text-gray-400'}`}>{item.rarity}</span>
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-yellow-500">{item.price} {item.currency}</td>
                                                        <td className="px-4 py-3">
                                                            {item.isFeatured ? (
                                                                <span className="text-xs font-black text-[#b026ff] bg-[#b026ff]/10 border border-[#b026ff]/30 px-2 py-0.5 rounded-full">★ Featured</span>
                                                            ) : (
                                                                <span className="text-xs text-gray-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={async () => {
                                                                    const token = localStorage.getItem('token');
                                                                    const res = await fetch(`http://localhost:3000/api/admin/store/${item.id}`, {
                                                                        method: 'PUT',
                                                                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ isActive: !item.isActive })
                                                                    });
                                                                    if (res.ok) fetchAllData();
                                                                }}
                                                                title={item.isActive ? 'Desativar item da loja' : 'Ativar item na loja'}
                                                                className={`px-2 py-0.5 rounded-full text-xs font-black transition-all border ${
                                                                    item.isActive
                                                                        ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                                                                        : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
                                                                }`}
                                                            >
                                                                {item.isActive ? '● Ativo' : '○ Inativo'}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setModalType('item');
                                                                        setPreviewUrl(item.imageUrl || null);
                                                                        setFormData({
                                                                            id: item.id,
                                                                            name: item.name,
                                                                            type: item.type,
                                                                            rarity: item.rarity,
                                                                            price: item.price,
                                                                            currency: item.currency,
                                                                            imageUrl: item.imageUrl,
                                                                            frameConfig: item.frameConfig || DEFAULT_FRAME_CONFIG_STR,
                                                                            petConfig: item.petConfig || JSON.stringify({ modelUrl: '', animationType: 'FLOATING', effectType: 'NONE', effectValue: 0, scale: 1 }),
                                                                            isFeatured: item.isFeatured,
                                                                            isActive: item.isActive
                                                                        });
                                                                        setModalOpen(true);
                                                                    }}
                                                                    className="p-2 bg-white/5 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 transition-colors" title="Edit Item"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    style={{ position: 'relative', zIndex: 20 }}
                                                                    onClick={() => { console.log('[DELETE] btn clicked', item.name); handleDelete('store', item.id, item.name); }}
                                                                    className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete Item"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}

                        {items.length === 0 && (
                            <div className="bg-[#120a1f] border border-white/10 rounded-2xl p-12 flex flex-col items-center text-gray-500">
                                <Package size={48} className="mb-4 opacity-30" />
                                <p className="font-bold">No items in store yet. Click + Add Item to create one.</p>
                            </div>
                        )}
                    </div>
                );
            }
            case 'tournaments':
                return (
                    <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-black text-white">Tournaments</h2>
                            <button onClick={() => { setModalType('tournament'); setFormData({}); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                <Plus size={16} /> Create Tournament
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tournament</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Entry / Prize</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Players / Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tournaments.map((t) => (
                                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{t.title}</span>
                                                    <span className="text-xs text-gray-500">{t.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-400">Entry Required</span>
                                                    <span className="text-sm font-bold text-yellow-500">{t.prize}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{t.players}</span>
                                                    <span className={`text-xs ${t.action === 'SPECTATE' ? 'text-green-400' : 'text-blue-400'}`}>{t.action === 'SPECTATE' ? 'Ongoing' : 'Upcoming'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleDelete('tournaments', t.id, t.name || t.title)} title="Sancionar / Excluir Torneio" className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'ranks':
                return (
                    <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-black text-white">MMR Rank Configuration</h2>
                            <button onClick={() => { setModalType('rank'); setFormData({}); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                <Plus size={16} /> Add Rank
                            </button>
                        </div>
                        <div className="p-6 grid gap-4">
                            {ranks.map((rank) => (
                                <div key={rank.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center overflow-hidden border border-white/10">
                                            {rank.iconUrl
                                                ? <img src={rank.iconUrl} alt={rank.name} className="w-8 h-8 object-contain" style={{ transform: `scale(${rank.iconScale ?? 1})`, transformOrigin: 'center' }} />
                                                : <Shield size={20} style={{ color: rank.color || '#9ca3af' }} />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black" style={{ color: rank.color || '#9ca3af' }}>{rank.name}</h3>
                                                {rank.mmrPenalty && <span className="text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 uppercase tracking-widest">PENALTY</span>}
                                            </div>
                                            <p className="text-sm text-gray-400">Minimum MMR: <span className="font-bold text-white">{rank.minMmr}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setModalType('rank'); setFormData({ id: rank.id, name: rank.name, minMmr: rank.minMmr, color: rank.color, iconUrl: rank.iconUrl, mmrPenalty: rank.mmrPenalty, iconScale: rank.iconScale ?? 1 }); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="Editar Rank"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete('ranks', rank.id, rank.name)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Excluir Rank"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'battlepass':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Season List */}
                        <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-white">Battle Pass — Temporadas</h2>
                                    <p className="text-sm text-gray-400">{battlePasses.length} temporada(s) cadastrada(s)</p>
                                </div>
                                <button onClick={() => { setModalType('battlepass'); setFormData({}); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                    <Plus size={16} /> Nova Temporada
                                </button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {battlePasses.length === 0 && (
                                    <div className="px-6 py-8 text-center text-gray-500">Nenhuma temporada cadastrada.</div>
                                )}
                                {battlePasses.map((bp: any) => (
                                    <div key={bp.id} className={`flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedBpId === bp.id ? 'bg-[#b026ff]/10 border-l-2 border-[#b026ff]' : ''}`} onClick={() => setSelectedBpId(selectedBpId === bp.id ? null : bp.id)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${bp.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                                            <div>
                                                <p className="font-bold text-white">{bp.name}</p>
                                                <p className="text-xs text-gray-500">Temporada {bp.season} · {bp._count?.tiers ?? 0} níveis</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {bp.isActive && <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">ATIVA</span>}
                                            <button onClick={(e) => { e.stopPropagation(); setModalType('battlepass'); setFormData({ id: bp.id, name: bp.name, season: bp.season, isActive: bp.isActive }); setModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                                            <button onClick={async (e) => { e.stopPropagation(); if (!confirm(`Excluir "${bp.name}"? Todos os níveis serão removidos.`)) return; const token = localStorage.getItem('token'); await fetch(`http://localhost:3000/api/admin/battlepass/${bp.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (selectedBpId === bp.id) setSelectedBpId(null); fetchAllData(); }} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tier Manager */}
                        {selectedBpId && (() => {
                            const bp = battlePasses.find((b: any) => b.id === selectedBpId);
                            return (
                                <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-black text-white">Níveis — {bp?.name}</h2>
                                            <p className="text-sm text-gray-400">{bpTiers.length} níveis cadastrados</p>
                                        </div>
                                        <button onClick={() => { setModalType('tier'); setFormData({ battlePassId: selectedBpId }); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                            <Plus size={16} /> Adicionar Nível
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 border-b border-white/10">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-24">Nível</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Recompensa Free</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-yellow-500 uppercase tracking-widest">⭐ Recompensa Premium</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bpTiers.length === 0 && (
                                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum nível cadastrado. Clique em "Adicionar Nível".</td></tr>
                                                )}
                                                {bpTiers.map((tier: any) => (
                                                    <tr key={tier.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-black text-white text-lg">{tier.level}</td>
                                                        <td className="px-6 py-4">
                                                            {tier.freeItem ? (
                                                                <div className="flex items-center gap-3">
                                                                    {tier.freeItem.imageUrl && <img src={tier.freeItem.imageUrl} alt={tier.freeItem.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />}
                                                                    <div>
                                                                        <p className="font-bold text-white text-sm">{tier.freeItem.name}</p>
                                                                        <p className="text-xs text-gray-500">{tier.freeItem.type} · {tier.freeItem.rarity}</p>
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-600 text-sm">— Sem item —</span>}
                                                            {(tier.freeGems ?? 0) > 0 && <p className="text-xs text-cyan-400 font-bold mt-1 flex items-center gap-1">💎 {tier.freeGems} Gems</p>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {tier.premiumItem ? (
                                                                <div className="flex items-center gap-3">
                                                                    {tier.premiumItem.imageUrl && <img src={tier.premiumItem.imageUrl} alt={tier.premiumItem.name} className="w-10 h-10 rounded-lg object-cover border border-yellow-500/30" />}
                                                                    <div>
                                                                        <p className="font-bold text-yellow-400 text-sm">{tier.premiumItem.name}</p>
                                                                        <p className="text-xs text-gray-500">{tier.premiumItem.type} · {tier.premiumItem.rarity}</p>
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-600 text-sm">— Sem item —</span>}
                                                            {(tier.premiumGems ?? 0) > 0 && <p className="text-xs text-yellow-400 font-bold mt-1 flex items-center gap-1">💎 {tier.premiumGems} Gems</p>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => { setModalType('tier'); setFormData({ id: tier.id, level: tier.level, battlePassId: selectedBpId, freeItemId: tier.freeItemId || '', freeGems: tier.freeGems ?? 0, premiumItemId: tier.premiumItemId || '', premiumGems: tier.premiumGems ?? 0 }); setModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                                                                <button onClick={async () => { if (!confirm(`Excluir nível ${tier.level}?`)) return; const token = localStorage.getItem('token'); await fetch(`http://localhost:3000/api/admin/battlepass/${selectedBpId}/tiers/${tier.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); fetchBpTiers(selectedBpId); }} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                );
            case 'vip':
                return (
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-white">VIP Plans</h2>
                                    <p className="text-sm text-gray-400">{vipConfigs.length} plano(s) cadastrado(s)</p>
                                </div>
                                <button onClick={() => { setModalType('vip'); setFormData({ isActive: true, noMmrLoss: false, durationDays: 30 }); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                    <Plus size={16} /> Novo Plano VIP
                                </button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {vipConfigs.length === 0 && (
                                    <div className="px-6 py-8 text-center text-gray-500">Nenhum plano VIP cadastrado.</div>
                                )}
                                {vipConfigs.map((v: any) => (
                                    <div key={v.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                                                <Crown size={18} className="text-yellow-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{v.name}</p>
                                                <p className="text-xs text-gray-500">{v.price} Credits · {v.durationDays} dias · +{v.gemsBonus}% Gems · +{v.xpBonus}% XP{v.noMmrLoss ? ' · Sem perda de MMR' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {v.isActive ? <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">ATIVO</span> : <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">INATIVO</span>}
                                            <button onClick={() => { setModalType('vip'); setFormData({ ...v }); setModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete('vip', v.id, v.name)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'missions':
                return (
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#120a1f] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-white">Missões Diárias</h2>
                                    <p className="text-sm text-gray-400">{missions.length} missão(ões) cadastrada(s)</p>
                                </div>
                                <button onClick={() => { setModalType('mission'); setFormData({ type: 'PLAY_ANY', requirement: 1, xpReward: 30, gemsReward: 3, isActive: true }); setModalOpen(true); }} className="bg-[#b026ff] hover:bg-[#c95bff] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                    <Plus size={16} /> Nova Missão
                                </button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {missions.length === 0 && (
                                    <div className="px-6 py-8 text-center text-gray-500">Nenhuma missão cadastrada. Crie missões para os jogadores.</div>
                                )}
                                {missions.map((m: any) => (
                                    <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#b026ff]/10 border border-[#b026ff]/30 flex items-center justify-center">
                                                <Target size={18} className="text-[#b026ff]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{m.title}</p>
                                                <p className="text-xs text-gray-500">{m.type}{m.parameter ? ` (${m.parameter})` : ''} · meta: {m.requirement}x · +{m.xpReward} XP · +{m.gemsReward} Gems</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {m.isActive ? <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">ATIVA</span> : <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">INATIVA</span>}
                                            <button onClick={() => { setModalType('mission'); setFormData({ ...m }); setModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete('missions', m.id, m.title)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a050f] text-white font-sans flex">
            {/* Sidebar */}
            <div className="w-64 bg-[#120a1f] border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b026ff] to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.5)]">
                        <Shield className="text-white" size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-widest uppercase line-clamp-1">Admin Panel</h1>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Moove Global</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'users', icon: Users, label: 'Manage Users' },
                        { id: 'tournaments', icon: Trophy, label: 'Tournaments' },
                        { id: 'items', icon: Package, label: 'Store Items' },
                        { id: 'ranks', icon: Star, label: 'MMR Ranks' },
                        { id: 'battlepass', icon: Medal, label: 'Battle Pass' },
                        { id: 'vip', icon: Crown, label: 'VIP Plans' },
                        { id: 'missions', icon: Target, label: 'Missões' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as Tab)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id
                                ? 'bg-[#b026ff] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-bold transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to App
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-white/10 bg-[#120a1f]/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
                    <h2 className="text-2xl font-black capitalize">{activeTab.replace('-', ' ')}</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                            <span className="font-bold text-blue-400 text-sm">AD</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b026ff]/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="max-w-6xl mx-auto relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderTabContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
            {/* Add/Edit Modal */}
            {modalOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
                >
                    <div
                        style={{ background: '#120a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '448px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #b026ff, #3b82f6)' }} />
                        <div style={{ padding: '24px' }}>
                            <h3 className="text-xl font-black text-white mb-6 capitalize">{modalType === 'user-create' ? 'Criar Novo Usuário' : modalType === 'user-currency' ? 'Editar Moedas' : modalType === 'user-mmr' ? 'Editar MMR' : modalType === 'battlepass' ? (formData.id ? 'Editar Temporada' : 'Nova Temporada') : modalType === 'tier' ? (formData.id ? `Editar Nível ${formData.level}` : 'Adicionar Nível') : modalType === 'vip' ? (formData.id ? 'Editar Plano VIP' : 'Criar Plano VIP') : modalType === 'mission' ? (formData.id ? 'Editar Missão' : 'Criar Missão') : formData.id ? `Edit ${modalType}` : `Add New ${modalType}`}</h3>
                            <div className="flex flex-col gap-4">
                                {modalType === 'item' && (() => {
                                    const isFrame = formData.type === 'FRAME';
                                    const isPet   = formData.type === 'PET';
                                    const fc = (() => { try { return JSON.parse(formData.frameConfig || DEFAULT_FRAME_CONFIG_STR); } catch { return parseFrameConfig(DEFAULT_FRAME_CONFIG_STR)!; } })();
                                    const updateFC = (partial: any) => setFormData((prev: any) => ({ ...prev, frameConfig: JSON.stringify({ ...fc, ...partial }) }));
                                    const pc: PetConfig = (() => { try { return { ...DEFAULT_PET_CONFIG, ...JSON.parse(formData.petConfig || '{}') }; } catch { return DEFAULT_PET_CONFIG; } })();
                                    const updatePC = (partial: Partial<PetConfig>) => setFormData((prev: any) => ({ ...prev, petConfig: JSON.stringify({ ...pc, ...partial }) }));
                                    return (
                                    <>
                                        <input type="text" placeholder="Item Name" value={formData.name || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" value={formData.type || 'AVATAR'} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="AVATAR">Avatar</option>
                                            <option value="CARD_BACK">Card Back (Sleeve)</option>
                                            <option value="FRAME">Profile Frame</option>
                                            <option value="EMOTE">In-game Emote</option>
                                            <option value="PET">Pet</option>
                                        </select>
                                        <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" value={formData.rarity || 'Common'} onChange={e => setFormData({ ...formData, rarity: e.target.value })}>
                                            <option value="Common">Common</option>
                                            <option value="Rare">Rare</option>
                                            <option value="Epic">Epic</option>
                                            <option value="Legendary">Legendary</option>
                                        </select>
                                        <input type="number" placeholder="Price" value={formData.price ?? ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
                                        <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" value={formData.currency || 'Credits'} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                            <option value="Credits">Credits (Real Money)</option>
                                            <option value="Gems">Gems (In-Game)</option>
                                        </select>

                                        {/* ── FRAME CONFIG (only for Profile Frame type) ── */}
                                        {isFrame ? (
                                            <div className="flex flex-col gap-3 bg-black/30 border border-[#b026ff]/20 rounded-xl p-4">
                                                <p className="text-xs font-black text-[#b026ff] uppercase tracking-widest">Frame Configuration</p>

                                                {/* Colors */}
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <label className="text-xs text-gray-400 font-bold">Primary Color</label>
                                                        <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2">
                                                            <input type="color" value={fc.color} onChange={e => updateFC({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none outline-none" />
                                                            <span className="text-xs text-gray-300 font-mono">{fc.color}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <label className="text-xs text-gray-400 font-bold">Secondary Color</label>
                                                        <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2">
                                                            <input type="color" value={fc.secondaryColor || fc.color} onChange={e => updateFC({ secondaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none outline-none" />
                                                            <span className="text-xs text-gray-300 font-mono">{fc.secondaryColor || fc.color}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Effect */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold">Effect Type</label>
                                                    <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" value={fc.effect} onChange={e => updateFC({ effect: e.target.value })}>
                                                        {FRAME_EFFECTS.map(ef => (
                                                            <option key={ef.value} value={ef.value}>{ef.label} — {ef.desc}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Intensity */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold">Intensity: <span className="text-[#b026ff] font-black">{fc.intensity}/10</span></label>
                                                    <input type="range" min="1" max="10" value={fc.intensity} onChange={e => updateFC({ intensity: parseInt(e.target.value) })} className="w-full accent-[#b026ff]" />
                                                </div>

                                                {/* Live Preview */}
                                                <div className="flex flex-col items-center gap-2 pt-2">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Live Preview</p>
                                                    <FramedAvatar
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=adminpreview`}
                                                        size={80}
                                                        frameConfig={fc}
                                                    />
                                                </div>
                                            </div>
                                        ) : isPet ? (
                                            /* ── PET CONFIG ── */
                                            <div className="flex flex-col gap-3 bg-black/30 border border-[#b026ff]/20 rounded-xl p-4">
                                                <p className="text-xs font-black text-[#b026ff] uppercase tracking-widest">🐾 Pet Configuration</p>

                                                {/* Pet Image Upload */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold">Imagem do Pet (PNG, GIF, WebP)</label>
                                                    {pc.modelUrl && (
                                                        <div className="flex items-center gap-3">
                                                            <img src={pc.modelUrl} alt="pet preview" className="w-14 h-14 object-contain rounded-lg bg-black/40" />
                                                            <p className="text-[10px] text-green-400 font-bold truncate flex-1">✅ Imagem carregada</p>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`flex items-center justify-center gap-3 w-full border border-dashed border-white/20 rounded-xl px-4 py-4 cursor-pointer hover:border-[#b026ff]/60 hover:bg-[#b026ff]/5 transition-all ${imageUploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                                        onClick={() => { const inp = document.getElementById('adminModelInput') as HTMLInputElement; inp?.click(); }}
                                                    >
                                                        <input
                                                            id="adminModelInput"
                                                            type="file"
                                                            accept="image/png,image/gif,image/webp,image/jpeg,image/svg+xml"
                                                            className="hidden"
                                                            onChange={async e => {
                                                                const f = e.target.files?.[0];
                                                                if (!f) return;
                                                                setImageUploadLoading(true);
                                                                try {
                                                                    const token = localStorage.getItem('token');
                                                                    const fd = new FormData();
                                                                    fd.append('file', f);
                                                                    const res = await fetch('http://localhost:3000/api/upload', {
                                                                        method: 'POST',
                                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                                        body: fd
                                                                    });
                                                                    if (res.ok) {
                                                                        const data = await res.json();
                                                                        updatePC({ modelUrl: data.url });
                                                                    } else {
                                                                        let msg = `HTTP ${res.status}`;
                                                                        try { const d = await res.json(); msg = d.error || msg; } catch {}
                                                                        alert(`Falha no upload da imagem: ${msg}`);
                                                                    }
                                                                } finally {
                                                                    setImageUploadLoading(false);
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-gray-400 text-sm font-bold pointer-events-none">
                                                            {imageUploadLoading ? '⏳ Enviando...' : pc.modelUrl ? '🖼️ Clique para substituir' : '🖼️ Clique para enviar imagem do pet'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Animation Type */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold">Tipo de Animação</label>
                                                    <select
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none"
                                                        value={pc.animationType}
                                                        onChange={e => updatePC({ animationType: e.target.value as PetAnimationType })}
                                                    >
                                                        {(Object.keys(PET_ANIMATION_LABELS) as PetAnimationType[]).map(k => (
                                                            <option key={k} value={k}>{PET_ANIMATION_LABELS[k]}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Passive Effect */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold">Efeito Passivo</label>
                                                    <select
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none"
                                                        value={pc.effectType}
                                                        onChange={e => updatePC({ effectType: e.target.value as PetEffectType })}
                                                    >
                                                        {(Object.keys(PET_EFFECT_LABELS) as PetEffectType[]).map(k => (
                                                            <option key={k} value={k}>{PET_EFFECT_LABELS[k]}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Effect Value */}
                                                {pc.effectType !== 'NONE' && (
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-xs text-gray-400 font-bold">
                                                            Valor do Efeito
                                                            <span className="text-gray-600 ml-1">({pc.effectType === 'TIMEBANK_BONUS' ? 'segundos por turno' : '% por partida'})</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={pc.effectType === 'TIMEBANK_BONUS' ? 60 : 100}
                                                            value={pc.effectValue}
                                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none"
                                                            onChange={e => updatePC({ effectValue: parseInt(e.target.value) || 0 })}
                                                        />
                                                        <p className="text-[11px] text-[#b026ff] font-bold">
                                                            Efeito: +{pc.effectValue} {PET_EFFECT_LABELS[pc.effectType]}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Scale */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold">
                                                        Escala da Imagem
                                                        <span className="text-gray-600 ml-1">(atual: {((pc.scale ?? 1) * 100).toFixed(0)}%)</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0.3"
                                                        max="2"
                                                        step="0.05"
                                                        value={pc.scale ?? 1}
                                                        className="w-full accent-[#b026ff]"
                                                        onChange={e => updatePC({ scale: parseFloat(e.target.value) })}
                                                    />
                                                    <div className="flex justify-between text-[10px] text-gray-600">
                                                        <span>30%</span><span>100%</span><span>200%</span>
                                                    </div>
                                                </div>

                                                {/* 3D Live Preview */}
                                                {pc.modelUrl && (
                                                    <div className="flex flex-col items-center gap-2 pt-2">
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Preview da Animação</p>
                                                        <PetViewer petConfig={pc} size={140} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Image Upload (for non-FRAME, non-PET types) */
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm text-gray-400 font-bold">Item Image</span>
                                                {previewUrl && (
                                                    <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-white/20" />
                                                )}
                                                <div
                                                    className={`flex items-center justify-center gap-3 w-full border border-dashed border-white/20 rounded-xl px-4 py-4 cursor-pointer hover:border-[#b026ff]/60 hover:bg-[#b026ff]/5 transition-all ${imageUploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                                    onClick={() => { const inp = document.getElementById('adminFileInput') as HTMLInputElement; inp?.click(); }}
                                                >
                                                    <input id="adminFileInput" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                                                    <span className="text-gray-400 text-sm font-bold pointer-events-none">
                                                        {imageUploadLoading ? '⏳ Uploading...' : previewUrl ? '✅ Uploaded! Click to replace' : '📁 Click to upload image (PNG, JPG, GIF)'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-gray-700 checked:bg-[#b026ff] accent-[#b026ff]" checked={!!formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} />
                                            Is Featured item?
                                        </label>
                                        <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-gray-700 checked:bg-green-500 accent-green-500" checked={formData.isActive !== false} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                            Item disponível na loja
                                        </label>
                                    </>
                                    );
                                })()}
                                {modalType === 'tournament' && (
                                    <>
                                        <input type="text" placeholder="Tournament Name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <input type="datetime-local" placeholder="Start Date" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                        <input type="datetime-local" placeholder="End Date" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                        <input type="number" placeholder="Entry Fee" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, entryFee: parseInt(e.target.value) })} />
                                        <input type="number" placeholder="Prize Pool" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, prizePool: parseInt(e.target.value) })} />
                                        <input type="number" placeholder="Max Players" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })} />
                                    </>
                                )}
                                {modalType === 'rank' && (
                                    <>
                                        <input type="text" placeholder="Rank Name" value={formData.name || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <input type="number" placeholder="Minimum MMR Required" value={formData.minMmr ?? ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, minMmr: parseInt(e.target.value) })} />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cor do Rank</label>
                                            <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-[#b026ff] transition-colors">
                                                <input
                                                    type="color"
                                                    value={formData.color || '#b026ff'}
                                                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent outline-none"
                                                    style={{ padding: 0 }}
                                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                />
                                                <span className="text-white font-mono text-sm flex-1">{formData.color || '#b026ff'}</span>
                                                <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: formData.color || '#b026ff' }} />
                                            </div>
                                        </div>

                                        {/* MMR Penalty Toggle */}
                                        <label className="flex items-center gap-3 cursor-pointer select-none bg-black/30 border border-white/10 rounded-xl px-4 py-3 hover:border-[#b026ff]/40 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={!!formData.mmrPenalty}
                                                onChange={e => setFormData({ ...formData, mmrPenalty: e.target.checked })}
                                                className="accent-[#b026ff] w-4 h-4"
                                            />
                                            <span className="text-sm font-bold text-white">MMR Penalty</span>
                                            <span className="text-xs text-gray-400">— jogadores neste rank ou acima perdem MMR ao perder</span>
                                        </label>

                                        {/* Rank Icon Upload */}
                                        <div className="flex flex-col gap-2">
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ícone do Rank (PNG, SVG, WebP)</span>
                                            {formData.iconUrl && (
                                                <div className="flex items-center gap-3">
                                                    <img src={formData.iconUrl} alt="rank icon" className="w-12 h-12 object-contain rounded-lg bg-black/40 border border-white/10 p-1" />
                                                    <span className="text-[10px] text-green-400 font-bold">✅ Ícone carregado</span>
                                                </div>
                                            )}
                                            <div
                                                className={`flex items-center justify-center gap-3 w-full border border-dashed border-white/20 rounded-xl px-4 py-4 cursor-pointer hover:border-[#b026ff]/60 hover:bg-[#b026ff]/5 transition-all ${imageUploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                                onClick={() => { const inp = document.getElementById('adminRankIconInput') as HTMLInputElement; inp?.click(); }}
                                            >
                                                <input
                                                    id="adminRankIconInput"
                                                    type="file"
                                                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                                                    className="hidden"
                                                    onChange={async e => {
                                                        const f = e.target.files?.[0];
                                                        if (!f) return;
                                                        setImageUploadLoading(true);
                                                        try {
                                                            const token = localStorage.getItem('token');
                                                            const fd = new FormData();
                                                            fd.append('file', f);
                                                            const res = await fetch('http://localhost:3000/api/upload', {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${token}` },
                                                                body: fd
                                                            });
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                setFormData((prev: any) => ({ ...prev, iconUrl: data.url }));
                                                            } else {
                                                                let msg = `HTTP ${res.status}`;
                                                                try { const d = await res.json(); msg = d.error || msg; } catch {}
                                                                alert(`Falha no upload do ícone: ${msg}`);
                                                            }
                                                        } finally {
                                                            setImageUploadLoading(false);
                                                        }
                                                    }}
                                                />
                                                <span className="text-gray-400 text-sm font-bold pointer-events-none">
                                                    {imageUploadLoading ? '⏳ Enviando...' : formData.iconUrl ? '🏆 Clique para substituir' : '🏆 Clique para enviar ícone do rank'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Icon Scale */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold">
                                                Escala do Ícone
                                                <span className="text-gray-600 ml-1">(atual: {(((formData.iconScale ?? 1)) * 100).toFixed(0)}%)</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="4"
                                                step="0.05"
                                                value={formData.iconScale ?? 1}
                                                className="w-full accent-[#b026ff]"
                                                onChange={e => setFormData({ ...formData, iconScale: parseFloat(e.target.value) })}
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-600">
                                                <span>10%</span><span>100%</span><span>200%</span><span>300%</span><span>400%</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {modalType === 'user-create' && (
                                    <>
                                        <input type="text" placeholder="Username" value={formData.username || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                        <input type="email" placeholder="Email" value={formData.email || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        <input type="password" placeholder="Senha (mín. 6 caracteres)" value={formData.password || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tipo de Conta</label>
                                            <select value={formData.role || 'USER'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                                <option value="USER">Usuário</option>
                                                <option value="MODERATOR">Moderador</option>
                                                <option value="ADMIN">Administrador</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {modalType === 'user-mmr' && (
                                    <>
                                        <p className="text-gray-400 text-sm">Editando MMR de: <span className="text-white font-bold">{formData.username}</span></p>
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">MMR atual</p>
                                            <p className="text-blue-400 font-black text-2xl mt-1">🏆 {(formData.currentMmr ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold">Novo valor de MMR</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Ex: 1500"
                                                value={formData.newMmr ?? 0}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none text-lg font-bold"
                                                onChange={e => setFormData({ ...formData, newMmr: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </>
                                )}
                                {modalType === 'user-currency' && (
                                    <>
                                        <p className="text-gray-400 text-sm">Editando moedas de: <span className="text-white font-bold">{formData.username}</span></p>
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex gap-8">
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Credits atuais</p>
                                                <p className="text-yellow-400 font-black text-lg mt-1">🪙 {(formData.currentCredits ?? 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gems atuais</p>
                                                <p className="text-purple-400 font-black text-lg mt-1">💎 {formData.currentGems ?? 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold">Ajuste de Credits <span className="text-gray-600">(+ adicionar / − remover)</span></label>
                                            <input type="number" placeholder="Ex: 500 ou -100" value={formData.creditsAdjust ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, creditsAdjust: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold">Ajuste de Gems <span className="text-gray-600">(+ adicionar / − remover)</span></label>
                                            <input type="number" placeholder="Ex: 20 ou -5" value={formData.gemsAdjust ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, gemsAdjust: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </>
                                )}
                                {modalType === 'battlepass' && (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nome da Temporada</label>
                                            <input type="text" placeholder="Ex: Nexus Protocol" value={formData.name || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Número da Temporada</label>
                                            <input type="number" min="1" placeholder="Ex: 1" value={formData.season ?? ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, season: parseInt(e.target.value) || 1 })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Preço do Passe Premium <span className="text-gray-500 font-normal">(Gems)</span></label>
                                            <input type="number" min="0" placeholder="Ex: 100" value={formData.price ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </>
                                )}
                                {modalType === 'tier' && (
                                    <>
                                        {!formData.id ? (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Número do Nível</label>
                                                <input type="number" min="1" placeholder="Ex: 1" value={formData.level ?? ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })} />
                                            </div>
                                        ) : (
                                            <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Editando Nível {formData.level}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Recompensa Free</label>
                                            <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" value={formData.freeItemId || ''} onChange={e => setFormData({ ...formData, freeItemId: e.target.value || null })}>
                                                <option value="">— Sem item —</option>
                                                {items.filter((i: any) => i.isActive).map((item: any) => (
                                                    <option key={item.id} value={item.id}>{item.name} ({item.type} · {item.rarity})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gems Free <span className="text-gray-500 font-normal">(0 = sem recompensa)</span></label>
                                            <input type="number" min="0" placeholder="Ex: 10" value={formData.freeGems ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, freeGems: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-yellow-600 font-bold uppercase tracking-widest">⭐ Recompensa Premium</label>
                                            <select className="w-full bg-black/50 border border-yellow-500/20 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none appearance-none" value={formData.premiumItemId || ''} onChange={e => setFormData({ ...formData, premiumItemId: e.target.value || null })}>
                                                <option value="">— Sem item —</option>
                                                {items.filter((i: any) => i.isActive).map((item: any) => (
                                                    <option key={item.id} value={item.id}>{item.name} ({item.type} · {item.rarity})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-yellow-600 font-bold uppercase tracking-widest">⭐ Gems Premium <span className="text-gray-500 font-normal">(0 = sem recompensa)</span></label>
                                            <input type="number" min="0" placeholder="Ex: 20" value={formData.premiumGems ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, premiumGems: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </>
                                )}
                                {modalType === 'mission' && ((
                                    () => {
                                        const needsColor = formData.type === 'PLAY_COLOR';
                                        const needsSeqLen = formData.type === 'PLAY_SEQUENCE';
                                        return (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Título</label>
                                                <input type="text" placeholder="Ex: Jogue 5 cartas vermelhas" value={formData.title || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Descrição</label>
                                                <input type="text" placeholder="Ex: Jogue 5 cartas vermelhas em uma partida" value={formData.description || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tipo</label>
                                                <select value={formData.type || 'PLAY_ANY'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" onChange={e => setFormData({ ...formData, type: e.target.value, parameter: '' })}>
                                                    <optgroup label="── Por Partida ──">
                                                        <option value="PLAY_ANY">Jogar qualquer partida (N vezes)</option>
                                                        <option value="PLAY_RANKED">Jogar partida ranked (N vezes)</option>
                                                        <option value="WIN_ANY">Vencer qualquer partida (N vezes)</option>
                                                        <option value="WIN_RANKED">Vencer partida ranked (N vezes)</option>
                                                    </optgroup>
                                                    <optgroup label="── Por Cartas Jogadas ──">
                                                        <option value="PLAY_CARDS_TOTAL">Jogar X cartas no total</option>
                                                        <option value="PLAY_COLOR">Jogar X cartas de uma cor</option>
                                                        <option value="PLAY_JOKER">Jogar X coringas</option>
                                                        <option value="PLAY_SEQUENCE">Descer uma sequência de N+ cartas</option>
                                                        <option value="PLAY_FOUR_OF_KIND">Descer 4 cartas do mesmo número</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                            {/* Conditional parameter fields */}
                                            {needsColor && (
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-[#b026ff] font-bold uppercase tracking-widest">Cor das Cartas</label>
                                                    <select value={formData.parameter || 'red'} className="w-full bg-black/50 border border-[#b026ff]/30 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none appearance-none" onChange={e => setFormData({ ...formData, parameter: e.target.value })}>
                                                        <option value="red">🔴 Vermelho</option>
                                                        <option value="blue">🔵 Azul</option>
                                                        <option value="green">🟢 Verde</option>
                                                        <option value="yellow">🟡 Amarelo</option>
                                                    </select>
                                                </div>
                                            )}
                                            {needsSeqLen && (
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-[#b026ff] font-bold uppercase tracking-widest">Tamanho mínimo da sequência</label>
                                                    <input type="number" min="3" max="13" placeholder="Ex: 5" value={formData.parameter || '3'} className="w-full bg-black/50 border border-[#b026ff]/30 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, parameter: e.target.value })} />
                                                    <p className="text-[10px] text-gray-500">Mínimo 3. O jogador precisa descer uma sequência com pelo menos este número de cartas de uma só vez.</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Meta</label>
                                                    <input type="number" min="1" value={formData.requirement ?? 1} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, requirement: parseInt(e.target.value) || 1 })} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">XP</label>
                                                    <input type="number" min="0" value={formData.xpReward ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gems</label>
                                                    <input type="number" min="0" value={formData.gemsReward ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, gemsReward: parseInt(e.target.value) || 0 })} />
                                                </div>
                                            </div>
                                            {/* Info card explaining meta for each type */}
                                            <div className="bg-[#b026ff]/5 border border-[#b026ff]/20 rounded-xl px-4 py-3 text-xs text-gray-400">
                                                {formData.type === 'PLAY_COLOR' && <span>🃏 <b className="text-[#b026ff]">Meta</b> = quantas cartas dessa cor o jogador deve jogar no dia (acumula entre partidas).</span>}
                                                {formData.type === 'PLAY_JOKER' && <span>🃏 <b className="text-[#b026ff]">Meta</b> = quantos coringas o jogador deve jogar no dia.</span>}
                                                {formData.type === 'PLAY_CARDS_TOTAL' && <span>🃏 <b className="text-[#b026ff]">Meta</b> = total de cartas jogadas no dia (acumula entre partidas).</span>}
                                                {formData.type === 'PLAY_SEQUENCE' && <span>🃏 <b className="text-[#b026ff]">Meta</b> = quantas vezes deve descer uma sequência do tamanho mínimo escolhido.</span>}
                                                {formData.type === 'PLAY_FOUR_OF_KIND' && <span>🃏 <b className="text-[#b026ff]">Meta</b> = quantas vezes deve descer 4 cartas do mesmo número de uma só vez.</span>}
                                                {(formData.type === 'PLAY_ANY' || formData.type === 'PLAY_RANKED') && <span>🎮 <b className="text-[#b026ff]">Meta</b> = número de partidas a jogar.</span>}
                                                {(formData.type === 'WIN_ANY' || formData.type === 'WIN_RANKED') && <span>🏆 <b className="text-[#b026ff]">Meta</b> = número de partidas a vencer.</span>}
                                            </div>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={formData.isActive !== false} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-black/50 accent-[#b026ff]" />
                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Missão Ativa (incluída no sorteio diário)</span>
                                            </label>
                                        </>
                                        );
                                    }
                                )())}
                                {modalType === 'vip' && (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nome do Plano</label>
                                            <input type="text" placeholder="Ex: VIP Gold" value={formData.name || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Descrição <span className="text-gray-500 font-normal">(opcional)</span></label>
                                            <input type="text" placeholder="Ex: O melhor plano da Moove" value={formData.description || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Preço <span className="text-gray-500 font-normal">(Credits)</span></label>
                                                <input type="number" min="0" placeholder="Ex: 10" value={formData.price ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Duração <span className="text-gray-500 font-normal">(dias)</span></label>
                                                <input type="number" min="1" placeholder="Ex: 30" value={formData.durationDays ?? 30} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 30 })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bônus Gems <span className="text-gray-500 font-normal">(%)</span></label>
                                                <input type="number" min="0" placeholder="Ex: 20" value={formData.gemsBonus ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, gemsBonus: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bônus XP <span className="text-gray-500 font-normal">(%)</span></label>
                                                <input type="number" min="0" placeholder="Ex: 10" value={formData.xpBonus ?? 0} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" onChange={e => setFormData({ ...formData, xpBonus: parseInt(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={!!formData.noMmrLoss} onChange={e => setFormData({ ...formData, noMmrLoss: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-black/50 accent-[#b026ff]" />
                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Sem perda de MMR ao desconectar/renderizar</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={formData.isActive !== false} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-black/50 accent-[#b026ff]" />
                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Plano Ativo (visível na loja)</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-end gap-3 mt-4" style={{ position: 'relative', zIndex: 10 }}>
                                    <button type="button" onClick={() => { console.log('[CANCEL] clicked'); setModalOpen(false); }} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                    <button type="button" onClick={(e) => { console.log('[SAVE] clicked'); handleSubmit(e as any); }} className="px-5 py-2.5 rounded-xl font-bold bg-[#b026ff] hover:bg-[#c95bff] text-white transition-all shadow-lg hover:shadow-[#b026ff]/25">{modalType === 'user-create' ? 'Criar Usuário' : modalType === 'user-currency' ? 'Salvar Alterações' : modalType === 'user-mmr' ? 'Salvar MMR' : modalType === 'battlepass' ? (formData.id ? 'Salvar Temporada' : 'Criar Temporada') : modalType === 'tier' ? (formData.id ? 'Salvar Nível' : 'Adicionar Nível') : modalType === 'vip' ? (formData.id ? 'Salvar Plano' : 'Criar Plano VIP') : modalType === 'mission' ? (formData.id ? 'Salvar Missão' : 'Criar Missão') : 'Save Item'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
