import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { useNotify } from './NotificationProvider';

interface Props {
    friendId: string;
    friendUsername: string;
    friendAvatar: string;
    onClose: () => void;
}

export default function ChatModal({ friendId, friendUsername, friendAvatar, onClose }: Props) {
    const { dms, dmUnread, sendDm, clearDmUnread } = useNotify();
    const messages = dms[friendId] ?? [];
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // Clear unread badge when opening
    useEffect(() => {
        clearDmUnread(friendId);
    }, [friendId, clearDmUnread]);

    // Auto-scroll to latest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;
        sendDm(friendId, friendUsername, input.trim());
        setInput('');
    }

    const avatar = friendAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendUsername}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-28 right-6 z-[500] w-80 max-h-[480px] flex flex-col bg-[#120a1f]/95 backdrop-blur-xl border border-[#b026ff]/30 rounded-2xl shadow-[0_0_40px_rgba(176,38,255,0.3)] overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#180e2a]/80">
                <div className="relative">
                    <img src={avatar} alt={friendUsername} className="w-8 h-8 rounded-full object-cover border border-[#b026ff]/40" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#120a1f]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{friendUsername}</p>
                    <p className="text-[10px] text-green-400 uppercase font-bold tracking-wider">Online</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
                    <X size={16} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-[200px] max-h-[340px] scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-gray-600 gap-2">
                        <MessageCircle size={28} className="opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-widest text-center">Start a conversation with<br /><span className="text-[#b026ff]/70">{friendUsername}</span></p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 items-end ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                            {!msg.mine && (
                                <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5" />
                            )}
                            <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-sm leading-snug break-words ${
                                msg.mine
                                    ? 'bg-[#b026ff] text-white rounded-br-sm'
                                    : 'bg-white/10 text-white rounded-bl-sm'
                            }`}>
                                {msg.message}
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 px-3 py-3 border-t border-white/10 bg-[#0a0510]/60">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={500}
                    autoFocus
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-[#b026ff] hover:bg-[#9010e0] disabled:opacity-40 rounded-xl text-white transition-colors shrink-0"
                >
                    <Send size={15} />
                </button>
            </form>
        </motion.div>
    );
}
