import React, { useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import BlogList from './pages/post/BlogList';
import BlogDetail from './pages/post/BlogDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Drafts from './pages/post/Drafts';
import Bookmarks from './pages/post/Bookmarks';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DraftsProvider } from './context/DraftsContext';
import { ToastProvider } from './context/ToastContext';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/user/Profile';
import UserPublicProfile from './pages/user/UserPublicProfile';
import FriendsPage from './pages/user/FriendsPage';
import MessagingPage from './pages/message/MessagingPage';
import './App.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect after login based on role
    if (user && window.location.pathname === '/login') {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="App">
      <Navbar />
      <div className="App__content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts" element={<BlogList />} />
          <Route path="/posts/:id" element={<BlogDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/events/create"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route path="/users/:id" element={<UserPublicProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drafts"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <Drafts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <Bookmarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <MessagingPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DraftsProvider>
          <AppRoutes />
        </DraftsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}


