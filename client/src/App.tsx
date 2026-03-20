import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './hooks/useUser.tsx';
import type { ReactNode } from 'react';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Play from './pages/Play';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import Collection from './pages/Collection';
import Store from './pages/Store';
import Game from './pages/Game';
import AdminDashboard from './pages/AdminDashboard';
import BattlePass from './pages/BattlePass';
import Rules from './pages/Rules';
import CardDatabase from './pages/CardDatabase';
import Lore from './pages/Lore';
import SystemStatus from './pages/SystemStatus';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Leaderboard from './pages/Leaderboard';
import Missions from './pages/Missions';
import ResetPassword from './pages/ResetPassword';
import Friends from './pages/Friends';
import Clan from './pages/Clan';
import { NotificationProvider } from './components/ui/NotificationProvider';

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  if (isLoading) return null;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useUser();
  const token = localStorage.getItem('token') || undefined;
  return (
    <NotificationProvider userId={user?.id} token={token}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/play" element={<Play />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/shop" element={<Store />} />
        <Route path="/game" element={<Game />} />
        <Route path="/nexus-command" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/battlepass" element={<BattlePass />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/database" element={<CardDatabase />} />
        <Route path="/lore" element={<Lore />} />
        <Route path="/status" element={<SystemStatus />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/missions" element={<Missions />} />          <Route path="/friends" element={<Friends />} />          <Route path="/clan" element={<Clan />} />      </Routes>
    </NotificationProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
