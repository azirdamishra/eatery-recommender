import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import FriendsPage from './pages/FriendsPage';
import LocationPage from './pages/LocationPage';
import FriendGroups from './pages/FriendGroups';
import GroupDetail from './components/groups/GroupDetail';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/friends"
                        element={
                            <PrivateRoute>
                                <FriendsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/location"
                        element={
                            <PrivateRoute>
                                <LocationPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/groups"
                        element={
                            <PrivateRoute>
                                <FriendGroups />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/groups/:groupId"
                        element={
                            <PrivateRoute>
                                <GroupDetail />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
