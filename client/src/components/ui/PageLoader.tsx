/**
 * PageLoader — shimmer skeleton screens for all major pages.
 * Usage: import the named export matching the page, use it as the loading return.
 */

// Base shimmer block — dark shimmer that matches the app's dark bg
const Sk = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded-lg bg-white/[0.055] ${className}`} />
);

// Shared fake TopHeader bar
const FakeHeader = () => (
    <div className="h-14 border-b border-white/[0.05] bg-[#0f0814]/80 flex items-center px-4 sm:px-6 gap-4 mb-0">
        <Sk className="w-8 h-8 rounded-full shrink-0" />
        <Sk className="w-28 h-3.5" />
        <div className="flex-1" />
        <Sk className="w-20 h-7 rounded-full" />
        <Sk className="w-8 h-8 rounded-full" />
        <Sk className="w-8 h-8 rounded-full" />
    </div>
);

// ────────────────────────────────────────────────────────────
// Generic full-page spinner (keep as fallback)
// ────────────────────────────────────────────────────────────
export const SpinnerPage = ({ label = 'LOADING...' }: { label?: string }) => (
    <div className="min-h-screen bg-[#0f0814] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#b026ff]/20 border-t-[#b026ff] rounded-full animate-spin" />
        <p className="text-[#b026ff] text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse">{label}</p>
    </div>
);

// ────────────────────────────────────────────────────────────
// Dashboard skeleton
// ────────────────────────────────────────────────────────────
export const DashboardSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-10">
            {/* Section label */}
            <Sk className="w-36 h-3" />
            {/* Protocol cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Sk key={i} className="h-[360px] rounded-2xl" />
                ))}
            </div>
            {/* Missions section */}
            <div className="space-y-4">
                <Sk className="w-24 h-3" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                        <Sk className="w-10 h-10 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Sk className="w-3/4 h-3" />
                            <Sk className="w-full h-2 rounded-full" />
                        </div>
                        <Sk className="w-16 h-8 rounded-xl shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Store / Collection — card grid
// ────────────────────────────────────────────────────────────
export const CardGridSkeleton = ({ label = 'SYNCING WAREHOUSE...' }: { label?: string }) => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-hidden">
                {[...Array(6)].map((_, i) => (
                    <Sk key={i} className={`h-8 rounded-full shrink-0 ${i === 0 ? 'w-24' : 'w-20'}`} />
                ))}
            </div>
            {/* Item grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
                        <Sk className="w-full h-44 rounded-none" />
                        <div className="p-3 space-y-2">
                            <Sk className="w-3/4 h-3" />
                            <Sk className="w-1/2 h-2.5" />
                            <Sk className="w-full h-8 rounded-xl mt-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Leaderboard — rows
// ────────────────────────────────────────────────────────────
export const LeaderboardSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
            {/* Podium top 3 */}
            <div className="flex items-end justify-center gap-4 pt-4">
                <Sk className="w-24 h-28 rounded-xl" />
                <Sk className="w-28 h-36 rounded-xl" />
                <Sk className="w-24 h-28 rounded-xl" />
            </div>
            {/* Rows */}
            <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <Sk className="w-7 h-4" />
                        <Sk className="w-9 h-9 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Sk className="w-32 h-3.5" />
                            <Sk className="w-20 h-2.5" />
                        </div>
                        <Sk className="w-16 h-7 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Missions
// ────────────────────────────────────────────────────────────
export const MissionsSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
            {/* Countdown header */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.05] flex items-center gap-4">
                <Sk className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                    <Sk className="w-40 h-4" />
                    <Sk className="w-24 h-3" />
                </div>
                <Sk className="w-20 h-8 rounded-full" />
            </div>
            {/* Mission cards */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <Sk className="w-10 h-10 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Sk className="w-3/5 h-4" />
                            <Sk className="w-2/5 h-3" />
                        </div>
                        <Sk className="w-20 h-9 rounded-xl shrink-0" />
                    </div>
                    <Sk className="w-full h-2 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Friends
// ────────────────────────────────────────────────────────────
export const FriendsSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-6">
            {/* Title */}
            <div className="flex items-center gap-3">
                <Sk className="w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                    <Sk className="w-28 h-5" />
                    <Sk className="w-40 h-3" />
                </div>
            </div>
            {/* Search bar */}
            <Sk className="w-full h-11 rounded-xl" />
            {/* Tab bar */}
            <div className="flex gap-2">
                <Sk className="w-24 h-9 rounded-xl" />
                <Sk className="w-28 h-9 rounded-xl" />
            </div>
            {/* Friend rows */}
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <Sk className="w-11 h-11 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Sk className="w-32 h-3.5" />
                        <Sk className="w-20 h-2.5" />
                    </div>
                    <Sk className="w-20 h-8 rounded-xl" />
                </div>
            ))}
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Clan
// ────────────────────────────────────────────────────────────
export const ClanSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-6">
            {/* Title row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sk className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                        <Sk className="w-20 h-5" />
                        <Sk className="w-36 h-3" />
                    </div>
                </div>
                <Sk className="w-28 h-9 rounded-xl" />
            </div>
            {/* Tab bar */}
            <div className="flex gap-2">
                <Sk className="w-32 h-9 rounded-xl" />
                <Sk className="w-28 h-9 rounded-xl" />
            </div>
            {/* Clan rows */}
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <Sk className="w-6 h-5 shrink-0" />
                    <Sk className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Sk className="w-40 h-4" />
                        <Sk className="w-24 h-2.5" />
                    </div>
                    <div className="text-right space-y-1.5">
                        <Sk className="w-16 h-4" />
                        <Sk className="w-12 h-2.5" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Battle Pass
// ────────────────────────────────────────────────────────────
export const BattlePassSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
            {/* Season header */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6 flex items-center gap-6">
                <Sk className="w-16 h-16 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <Sk className="w-48 h-6" />
                    <Sk className="w-64 h-3" />
                    <Sk className="w-full h-2.5 rounded-full mt-2" />
                </div>
                <Sk className="w-32 h-10 rounded-xl shrink-0" />
            </div>
            {/* Tier track */}
            <div className="overflow-x-hidden">
                {/* Free row */}
                <div className="flex gap-3 py-2">
                    {[...Array(8)].map((_, i) => (
                        <Sk key={i} className="w-20 h-24 rounded-xl shrink-0" />
                    ))}
                </div>
                {/* Level numbers bar */}
                <div className="flex gap-3 py-1">
                    {[...Array(8)].map((_, i) => (
                        <Sk key={i} className="w-20 h-8 rounded-lg shrink-0" />
                    ))}
                </div>
                {/* Premium row */}
                <div className="flex gap-3 py-2">
                    {[...Array(8)].map((_, i) => (
                        <Sk key={i} className="w-20 h-24 rounded-xl shrink-0" />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Tournaments
// ────────────────────────────────────────────────────────────
export const TournamentsSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <Sk className="w-40 h-6" />
                    <Sk className="w-56 h-3" />
                </div>
                <Sk className="w-24 h-9 rounded-xl" />
            </div>
            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
                        <Sk className="w-full h-32 rounded-none" />
                        <div className="p-4 space-y-3">
                            <Sk className="w-3/4 h-4" />
                            <Sk className="w-1/2 h-3" />
                            <div className="flex gap-2 pt-1">
                                <Sk className="flex-1 h-9 rounded-xl" />
                                <Sk className="w-24 h-9 rounded-xl" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// Profile
// ────────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
    <div className="min-h-screen bg-[#0f0814]">
        <FakeHeader />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
            {/* Hero card */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6 flex items-center gap-6">
                <Sk className="w-24 h-24 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                    <Sk className="w-48 h-7" />
                    <Sk className="w-32 h-3" />
                    <div className="flex items-center gap-2 mt-1">
                        <Sk className="w-16 h-6 rounded-full" />
                        <Sk className="w-20 h-6 rounded-full" />
                    </div>
                    <Sk className="w-full h-2 rounded-full mt-2" />
                </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-2">
                        <Sk className="w-8 h-8 rounded-xl" />
                        <Sk className="w-12 h-6" />
                        <Sk className="w-20 h-3" />
                    </div>
                ))}
            </div>
            {/* Match history */}
            <div className="space-y-3">
                <Sk className="w-32 h-4" />
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <Sk className="w-14 h-7 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Sk className="w-24 h-3" />
                            <Sk className="w-16 h-2.5" />
                        </div>
                        <Sk className="w-12 h-5 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
