import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{user?.username}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid gap-6">
                    {/* Welcome Card */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-semibold mb-2">Welcome to your Dashboard</h2>
                        <p className="text-slate-500">
                            This is a protected route. Only authenticated users can see this.
                        </p>
                    </div>

                    {/* Grid of Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-2">Profile</h3>
                            <p className="text-slate-500">Manage your profile settings</p>
                        </div>

                        {/* Friends Card */}
                        <Link
                            to="/friends"
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-lg font-semibold mb-2">Friends</h3>
                            <p className="text-slate-500">Manage your friends and friend requests</p>
                        </Link>

                        {/* Settings Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-2">Settings</h3>
                            <p className="text-slate-500">Configure your preferences</p>
                        </div>

                        {/* Activity Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-2">Activity</h3>
                            <p className="text-slate-500">View your recent activity</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard; 