import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import './App.css';


const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(false); 

    
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        const storedUserId = localStorage.getItem('userId');
        const storedUserName = localStorage.getItem('userName');
        const storedIsAdmin = localStorage.getItem('isAdmin');
        if (storedUser && storedUserId) {
            setCurrentUser(JSON.parse(storedUser));
            setUserId(storedUserId);
            setUserName(storedUserName);
            setIsAdmin(storedIsAdmin === 'true');
        }
    }, []);

    const login = async (email, password) => {
        setLoadingAuth(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (data.success) {
                setCurrentUser({ email: data.user.email, name: data.user.name });
                setUserId(data.user.id);
                setUserName(data.user.name);
                setIsAdmin(data.user.isAdmin);
                localStorage.setItem('currentUser', JSON.stringify({ email: data.user.email, name: data.user.name }));
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('isAdmin', data.user.isAdmin.toString());
                localStorage.setItem('token', data.token);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Connection error. Please try again.' };
        } finally {
            setLoadingAuth(false);
        }
    };

    const signup = async (name, email, password) => {
        setLoadingAuth(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            
            if (data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Connection error. Please try again.' };
        } finally {
            setLoadingAuth(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setUserId(null);
        setUserName(null);
        setIsAdmin(false);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('isAdmin');
    };
    useEffect(() => {
        fetch('http://localhost:5000/')
            .then(res => res.text())
            .then(data => console.log('Backend connection:', data))
            .catch(err => console.error('Backend connection failed:', err));
    }, []);


    return (
        <AuthContext.Provider value={{ currentUser, userId, userName, isAdmin, loadingAuth, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


const DataContext = createContext();

const DataProvider = ({ children }) => {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Fetch jobs from backend
    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/jobs');
            const data = await response.json();
            setJobs(data.map(job => ({ ...job, id: job._id, _id: job._id })));
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch applications from backend
    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch('http://localhost:5000/api/applications/my', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setApplications(data.map(app => ({ ...app, id: app._id })));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };
    
    // Initial data fetch
    useEffect(() => {
        fetchJobs();
        fetchApplications();
    }, []);

    const addJob = async (newJob) => {
        try {
            const response = await fetch('http://localhost:5000/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newJob)
            });
            if (response.ok) {
                await fetchJobs(); // Refresh all jobs
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Error adding job:', error);
            return { success: false };
        }
    };

    const updateJob = async (updatedJob) => {
        try {
            const response = await fetch(`http://localhost:5000/api/jobs/${updatedJob.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedJob)
            });
            if (response.ok) {
                await fetchJobs(); // Refresh all jobs
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Error updating job:', error);
            return { success: false };
        }
    };

    const deleteJob = async (jobId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                await fetchJobs(); // Refresh all jobs
                await fetchApplications(); // Refresh applications
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Error deleting job:', error);
            return { success: false };
        }
    };

    const applyForJob = async (job, userEmail, userId) => {
        try {
            const jobId = job._id || job.id;
            console.log('Applying for job:', jobId);
            const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Apply response:', response.status, data);
            console.log('Response details:', JSON.stringify(data, null, 2));
            
            if (response.ok && data.success) {
                await fetchApplications(); // Refresh applications
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'Application failed' };
            }
        } catch (error) {
            console.error('Error applying for job:', error);
            return { success: false, message: 'Failed to apply for job' };
        }
    };

    return (
        <DataContext.Provider value={{ 
            jobs, 
            applications, 
            loading,
            addJob, 
            updateJob, 
            deleteJob, 
            applyForJob,
            fetchJobs,
            fetchApplications
        }}>
            {children}
        </DataContext.Provider>
    );
};


// --- Custom Message Box Component ---
const MessageBox = ({ message, type = 'info', onClose }) => {
    if (!message) return null;

    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    const borderColor = type === 'error' ? 'border-red-700' : type === 'success' ? 'border-green-700' : 'border-blue-700';

    return (
        <div className={`fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4`} role="dialog" aria-modal="true" aria-labelledby="message-title">
            <div className={`relative ${bgColor} text-white p-6 rounded-lg shadow-xl border-t-4 ${borderColor} max-w-sm w-full`}>
                <p id="message-title" className="text-lg font-semibold text-center mb-4">{message}</p>
                <div className="flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-200"
                        aria-label="Close message"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Loading Spinner Component ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-100"></div>
        <span className="sr-only">Loading...</span>
    </div>
);

// --- Navbar Component ---
const Navbar = ({ navigate }) => {
    const { currentUser, isAdmin, logout, userId, userName } = useContext(AuthContext);

    return (
        <nav className="bg-[#190303] p-4 shadow-lg rounded-b-xl mb-6 text-gray-100"> {/* Primary Dark Color */}
            <div className="container mx-auto flex justify-between items-center flex-wrap">
                <div className="text-[#ffffff] text-2xl font-bold rounded-md px-3 py-1 bg-opacity-20 bg-black"> {/* Secondary Dark Accent */}
                    Jobsy.com
                </div>
                <div className="flex-grow flex justify-center mt-2 md:mt-0">
                    <div className="flex space-x-4">
                        <NavLink onClick={() => navigate('home')}>Home</NavLink>
                        {currentUser && isAdmin && <NavLink onClick={() => navigate('adminDashboard')}>Admin Dashboard</NavLink>}
                        {currentUser && !isAdmin && <NavLink onClick={() => navigate('userDashboard')}>User Dashboard</NavLink>}
                        {currentUser && !isAdmin && <NavLink onClick={() => navigate('browseJobs')}>Browse Jobs</NavLink>}
                        {currentUser && !isAdmin && <NavLink onClick={() => navigate('appliedJobs')}>Applied Jobs</NavLink>}
                    </div>
                </div>
                <div className="flex items-center space-x-4 mt-2 md:mt-0">
                    {currentUser ? (
                        <>
                            <span className="text-gray-300 text-sm opacity-80">
                                {userName || currentUser?.email} ({isAdmin ? 'Admin' : 'User'})
                            </span>
                            <button
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('login')}
                                className="bg-[#34495E] hover:bg-[#2C3E50] text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate('signup')}
                                className="bg-[#AA00FF] hover:bg-[#8800CC] text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Sign up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="text-gray-100 text-lg font-medium px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition duration-300 ease-in-out"
    >
        {children}
    </button>
);


// --- Home Page ---
const HomePage = ({ navigate }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-[#fefefe] text-gray-100 rounded-xl p-8 shadow-inner"> {/* Primary Dark Color */}
            <h1 className="text-5xl font-extrabold text-[#0f0f0f] mb-6 text-center leading-tight">
                Welcome to <span className="text-[#0f0f0f]">Jobsy.com</span>
            </h1>
            <p className="text-xl text-[#0f0f0f] mb-8 text-center max-w-2xl">
                Discover exciting career opportunities and take the next step in your professional journey.
            </p>
            <div className="flex space-x-6 mb-12">
                <button
                    onClick={() => navigate('login')}
                    className="bg-[#34495E] hover:bg-[#2C3E50] text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#5D6D7E]"
                >
                    Log In
                </button>
                <button
                    onClick={() => navigate('signup')}
                    className="bg-[#AA00FF] hover:bg-[#8800CC] text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#E0B1FF]"
                >
                    Sign Up
                </button>
            </div>

            {/* Section for company features */}
            <div className="w-full max-w-4xl text-center">
                <h2 className="text-3xl font-bold text-[#0f0f0f] mb-6">Why Choose Jobsy.com?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-[#a00eef] p-6 rounded-xl shadow-md border border-gray-700 flex flex-col items-center text-center"> {/* Slightly lighter dark background for cards */}
                        <span className="text-5xl mb-4 text-[#ffffff]">🚀</span> {/* Secondary Dark Accent */}
                        <h3 className="text-xl font-semibold text-amber-50 mb-2">Fast & Easy Applications</h3>
                        <p className="text-gray-300">Apply to your dream jobs in just a few clicks. Our streamlined process saves you time.</p>
                    </div>
                    <div className="bg-[#a00eef] p-6 rounded-xl shadow-md border border-gray-700 flex flex-col items-center text-center">
                        <span className="text-5xl mb-4 text-[#004D40]">🎯</span> {/* Secondary Dark Accent */}
                        <h3 className="text-xl font-semibold text-gray-100 mb-2">Personalized Job Matches</h3>
                        <p className="text-gray-300">Get recommendations tailored to your skills, experience, and preferences.</p>
                    </div>
                    <div className="bg-[#a00eef] p-6 rounded-xl shadow-md border border-gray-700 flex flex-col items-center text-center">
                        <span className="text-5xl mb-4 text-[#004D40]">💼</span> {/* Secondary Dark Accent */}
                        <h3 className="text-xl font-semibold text-gray-100 mb-2">Diverse Opportunities</h3>
                        <p className="text-gray-300">Explore a wide range of jobs from top companies across various industries.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Login Page ---
const LoginPage = ({ navigate }) => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        const result = await login(email, password);
        if (result.success) {
            setMessage('Login successful!');
            setMessageType('success');
            setTimeout(() => navigate(email === 'admin@jobsy.com' ? 'adminDashboard' : 'userDashboard'), 1500);
        } else {
            setMessage(result.message);
            setMessageType('error');
        }
    };

    const closeMessage = () => setMessage(null);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-[#000000] p-4"> {/* Overall body background */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-black mb-2">Email address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-describedby="email-help"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] transition duration-200 text-black"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-describedby="password-help"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] transition duration-200 text-black"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#34495E] hover:bg-[#2C3E50] text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#5D6D7E]"
                    >
                        Log In
                    </button>
                </form>
                <p className="mt-8 text-center text-gray-600">
                    Don't have an account?{' '}
                    <button
                        onClick={() => navigate('signup')}
                        className="text-[#AA00FF] hover:text-[#8800CC] font-medium hover:underline transition duration-200"
                    >
                        Sign Up
                    </button>
                </p>
            </div>
            <MessageBox message={message} type={messageType} onClose={closeMessage} />
        </div>
    );
};

// --- Signup Page ---
const SignupPage = ({ navigate }) => {
    const { signup } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        const result = await signup(name, email, password);
        if (result.success) {
            setMessage('Signup successful! Please log in.');
            setMessageType('success');
            setTimeout(() => navigate('login'), 1500);
        } else {
            setMessage(result.message);
            setMessageType('error');
        }
    };

    const closeMessage = () => setMessage(null);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-[#1A1A1A] p-4"> {/* Overall body background */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Sign Up</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] transition duration-200 text-black"
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-describedby="email-help"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] transition duration-200 text-black"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-describedby="password-help"
                            minLength="6"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] transition duration-200 text-black"
                            placeholder="Enter your password (min 6 characters)"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#AA00FF] hover:bg-[#8800CC] text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#E0B1FF]"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-8 text-center text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('login')}
                        className="text-[#FFB300] hover:text-[#FF8F00] font-medium hover:underline transition duration-200"
                    >
                        Log In
                    </button>
                </p>
            </div>
            <MessageBox message={message} type={messageType} onClose={closeMessage} />
        </div>
    );
};

// --- User Dashboard ---
const UserDashboard = ({ navigate }) => {
    const { currentUser, userId, userName, isAdmin, loadingAuth } = useContext(AuthContext); // Corrected context usage

    if (loadingAuth) return <LoadingSpinner />;
    if (!currentUser || isAdmin) {
        return (
            <div className="text-center p-8 text-red-600 font-semibold bg-[#1A1A1A] text-gray-100 min-h-[calc(100vh-120px)] rounded-xl">
                Access Denied. Please log in as a user.
                <button onClick={() => navigate('login')} className="mt-4 px-4 py-2 bg-[#34495E] text-white rounded-md">Login</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-120px)] p-6 bg-[#212121] text-gray-100 rounded-xl shadow-lg"> {/* Primary Dark Color */}
            <h1 className="text-4xl font-extrabold text-gray-100 mb-6 text-center">
                Welcome, <span className="text-[#ffffff]">{userName || currentUser.email}!</span>
            </h1>
            <p className="text-lg text-gray-300 mb-4 text-center max-w-2xl">
                Email: <span className="font-semibold text-blue-400">{currentUser.email}</span>
            </p>
            <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl">
                Your user ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-sm break-all">{userId}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                <DashboardCard title="Browse Jobs" description="Find new opportunities that match your skills." navigate={() => navigate('browseJobs')} icon="🔍" />
                <DashboardCard title="Applied Jobs" description="Review the status of your job applications." navigate={() => navigate('appliedJobs')} icon="📄" />
                {/* <DashboardCard title="Update Profile" description="Manage your personal and professional details." navigate={() => navigate('updateProfile')} icon="📝" /> */}
            </div>
            <p className="mt-12 text-gray-400 text-center">
                Explore the job market and advance your career today!
            </p>
        </div>
    );
};

const DashboardCard = ({ title, description, navigate, icon }) => (
    <div
        className="bg-[#333333] text-gray-100 rounded-xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300 transform border border-gray-700"
        onClick={navigate}
    >
        <div className="text-5xl mb-4 p-3 bg-[#004D40] rounded-full text-white">{icon}</div> {/* Secondary Dark Accent */}
        <h3 className="text-2xl font-bold text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
    </div>
);

// --- Browse Jobs Page ---
const JobCard = ({ job, onApply, onEdit, onDelete, isAdmin, userAppliedJobIds }) => {
    const isApplied = userAppliedJobIds?.includes(job._id || job.id);
    return (
        <div className="bg-[#333333] text-gray-100 rounded-xl shadow-lg p-6 mb-6 border border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] flex flex-col justify-between">
            <div>
                <h3 className="text-2xl font-bold text-gray-100 mb-2">{job.title}</h3>
                <p className="text-gray-300 mb-3 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-[#004D40]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                    {job.location} | <span className="ml-1 font-semibold text-[#fdffff]">{job.jobType}</span>
                    {job.remote && <span className="ml-2 bg-green-600 text-white px-2 py-1 rounded text-xs">Remote</span>}
                    {job.urgent && <span className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-xs">Urgent</span>}
                </p>
                <p className="text-gray-300 mb-4">{job.description}</p>
                <p className="text-gray-300 mb-4 font-semibold">Requirements: <span className="font-normal">{job.requirements}</span></p>
                <p className="text-green-500 font-bold mb-4">Salary: {job.salary}</p>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
                {isAdmin ? (
                    <>
                        <button
                            onClick={() => onEdit(job)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(job.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Delete
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onApply(job)}
                        disabled={isApplied}
                        className={`py-2 px-6 rounded-lg font-semibold shadow-md transition duration-300 ease-in-out ${
                            isApplied ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#004D40] hover:bg-[#00695C] text-white transform hover:scale-105'
                        }`}
                    >
                        {isApplied ? 'Applied' : 'Apply Now'}
                    </button>
                )}
            </div>
        </div>
    );
};

const BrowseJobsPage = ({ navigate }) => {
    const { currentUser, userId, loadingAuth, isAdmin } = useContext(AuthContext);
    const { jobs, applications, applyForJob, fetchJobs, fetchApplications } = useContext(DataContext);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [appliedJobIds, setAppliedJobIds] = useState([]);
    const [filterLocation, setFilterLocation] = useState('');
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExperience, setFilterExperience] = useState('');
    const [filterRemote, setFilterRemote] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    // Initialize filtered jobs and applied job IDs
    useEffect(() => {
        setFilteredJobs(jobs);
        if (userId) {
            const userAppliedIds = applications
                .filter(app => app.userId === userId)
                .map(app => app.jobId?._id || app.jobId);
            setAppliedJobIds(userAppliedIds);
        }
    }, [jobs, applications, userId]);
    
    // Fetch applications when user logs in
    useEffect(() => {
        if (userId && currentUser) {
            fetchApplications();
        }
    }, [userId, currentUser]);
    


    // Apply filters
    useEffect(() => {
        let currentJobs = jobs;

        if (searchTerm) {
            currentJobs = currentJobs.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterLocation) {
            currentJobs = currentJobs.filter(job =>
                job.location.toLowerCase().includes(filterLocation.toLowerCase())
            );
        }
        if (filterType) {
            currentJobs = currentJobs.filter(job =>
                job.jobType.toLowerCase() === filterType.toLowerCase()
            );
        }
        if (filterExperience) {
            currentJobs = currentJobs.filter(job =>
                job.experience === filterExperience
            );
        }
        if (filterRemote) {
            currentJobs = currentJobs.filter(job => job.remote);
        }
        setFilteredJobs(currentJobs);
    }, [searchTerm, filterLocation, filterType, filterExperience, filterRemote, jobs]);


    const handleApply = async (job) => {
        if (!currentUser || !userId) {
            setMessage("Please log in to apply for jobs.");
            setMessageType("error");
            return;
        }

        if (isAdmin) {
            setMessage("Admins cannot apply for jobs.");
            setMessageType("error");
            return;
        }

        const result = await applyForJob(job, currentUser.email, userId);
        if (result.success) {
            setMessage(result.message);
            setMessageType("success");
            setAppliedJobIds(prev => [...prev, job._id || job.id]);
        } else {
            setMessage(result.message);
            setMessageType("error");
        }
    };

    const closeMessage = () => setMessage(null);

    return (
        <div className="container mx-auto p-6 bg-[#212121] text-gray-100 rounded-xl shadow-lg border border-gray-700 min-h-[calc(100vh-120px)]"> {/* Primary Dark Color */}
            <h1 className="text-4xl font-extrabold text-gray-100 mb-8 text-center">Browse Job Listings</h1>

            <div className="mb-8 p-4 bg-[#333333] rounded-lg shadow-inner border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100 placeholder-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Location"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100 placeholder-gray-400"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                    >
                        <option value="">All Job Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                    </select>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        value={filterExperience}
                        onChange={(e) => setFilterExperience(e.target.value)}
                        className="px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                    >
                        <option value="">All Experience</option>
                        <option value="Entry">Entry Level</option>
                        <option value="Mid">Mid Level</option>
                        <option value="Senior">Senior Level</option>
                        <option value="Executive">Executive</option>
                    </select>
                    <label className="flex items-center text-gray-100">
                        <input
                            type="checkbox"
                            checked={filterRemote}
                            onChange={(e) => setFilterRemote(e.target.checked)}
                            className="mr-2"
                        />
                        Remote Only
                    </label>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterLocation('');
                            setFilterType('');
                            setFilterExperience('');
                            setFilterRemote(false);
                        }}
                        className="px-6 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition duration-200 shadow-sm"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {filteredJobs.length === 0 ? (
                <p className="text-center text-gray-400 text-lg py-10">No jobs found matching your criteria.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onApply={handleApply}
                            isAdmin={isAdmin}
                            userAppliedJobIds={appliedJobIds}
                            // onEdit and onDelete are not passed as admin won't be on this page typically
                        />
                    ))}
                </div>
            )}
            <MessageBox message={message} type={messageType} onClose={closeMessage} />
        </div>
    );
};

// --- Applied Jobs Page (User View) ---
const AppliedJobsPage = ({ navigate }) => {
    const { currentUser, userId, loadingAuth, isAdmin } = useContext(AuthContext);
    const { applications } = useContext(DataContext);
    const [userApplications, setUserApplications] = useState([]);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        if (!loadingAuth && currentUser && userId && !isAdmin) {
            // Fetch fresh applications data
            const fetchUserApplications = async () => {
                try {
                    const response = await fetch('http://localhost:5000/api/applications/my', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUserApplications(data);
                    }
                } catch (error) {
                    console.error('Error fetching user applications:', error);
                }
            };
            fetchUserApplications();
        } else if (!loadingAuth && (!currentUser || isAdmin)) {
             setMessage("Please log in as a user to view applied jobs.");
             setMessageType("error");
             setTimeout(() => navigate('login'), 1500);
        }
    }, [loadingAuth, currentUser, userId, isAdmin, navigate]);

    const closeMessage = () => setMessage(null);

    if (loadingAuth) return <LoadingSpinner />;
    if (!currentUser || isAdmin) return null; // Message box will handle redirect

    return (
        <div className="container mx-auto p-6 bg-[#212121] text-gray-100 rounded-xl shadow-lg border border-gray-700 min-h-[calc(100vh-120px)]"> {/* Primary Dark Color */}
            <h1 className="text-4xl font-extrabold text-gray-100 mb-8 text-center">My Applied Jobs</h1>

            {userApplications.length === 0 ? (
                <p className="text-center text-gray-400 text-lg py-10">You haven't applied for any jobs yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userApplications.map(app => (
                        <div key={app.id} className="bg-[#333333] rounded-xl shadow-md p-6 border border-gray-700 text-gray-100">
                            <h3 className="text-xl font-bold text-gray-100 mb-2">{app.jobId?.title || 'Job Title'}</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Location: <span className="font-semibold">{app.jobId?.location || 'N/A'}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                Salary: <span className="font-semibold text-green-400">{app.jobId?.salary || 'N/A'}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-3">
                                Applied On: {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                }) : 'N/A'}
                            </p>
                            <p className={`font-semibold mt-4 capitalize ${
                                app.status === 'accepted' ? 'text-green-400' : 
                                app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                                Status: {app.status || 'pending'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            <MessageBox message={message} type={messageType} onClose={closeMessage} />
        </div>
    );
};


// --- Admin Dashboard ---
const AdminDashboard = ({ navigate }) => {
    const { currentUser, userId, userName, isAdmin, loadingAuth } = useContext(AuthContext);

    if (loadingAuth) return <LoadingSpinner />;
    if (!currentUser || !isAdmin) {
        return (
            <div className="text-center p-8 text-red-600 font-semibold bg-[#1A1A1A] text-gray-100 min-h-[calc(100vh-120px)] rounded-xl">
                Access Denied. Please log in as an admin.
                <button onClick={() => navigate('login')} className="mt-4 px-4 py-2 bg-[#34495E] text-white rounded-md">Login</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-120px)] p-6 bg-[#212121] text-gray-100 rounded-xl shadow-lg"> {/* Primary Dark Color */}
            <h1 className="text-4xl font-extrabold text-gray-100 mb-6 text-center">
                Admin Dashboard - <span className="text-[#004D40]">{userName || currentUser.email}</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl">
                Your admin ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-sm break-all">{userId}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                <DashboardCard title="Manage Jobs" description="Add, edit, or delete job listings." navigate={() => navigate('manageJobs')} icon="💼" />
                <DashboardCard title="View User Applications" description="Review all applications submitted by users." navigate={() => navigate('viewApplications')} icon="📋" />
            </div>
            <p className="mt-12 text-gray-400 text-center">
                Efficiently manage the job portal content and user applications.
            </p>
        </div>
    );
};

// --- Manage Jobs Page (Admin View) ---
const ManageJobsPage = ({ navigate }) => {
    const { currentUser, userId, isAdmin, loadingAuth } = useContext(AuthContext);
    const { jobs, addJob, updateJob, deleteJob, fetchJobs } = useContext(DataContext);
    const [editingJob, setEditingJob] = useState(null); // null for add, object for edit
    const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', location: '', salary: '', jobType: 'Full-time' });
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        if (!loadingAuth && (!currentUser || !isAdmin)) {
            setMessage("Access Denied. Please log in as an admin to manage jobs.");
            setMessageType("error");
            setTimeout(() => navigate('login'), 1500);
        } else if (isAdmin) {
            fetchJobs();
        }
    }, [loadingAuth, currentUser, userId, isAdmin, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setJobForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        try {
            let result;
            if (editingJob) {
                result = await updateJob(jobForm);
                setMessage(result.success ? "Job updated successfully!" : "Failed to update job");
            } else {
                result = await addJob(jobForm);
                setMessage(result.success ? "Job added successfully!" : "Failed to add job");
            }
            setMessageType(result.success ? "success" : "error");
            if (result.success) {
                setJobForm({ title: '', description: '', requirements: '', location: '', salary: '', jobType: 'Full-time' });
                setEditingJob(null);
            }
        } catch (error) {
            console.error("Error saving job:", error);
            setMessage(`Failed to save job: ${error.message}`);
            setMessageType("error");
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setJobForm(job); // Populate form with job data
    };

    const handleDelete = async (jobId) => {
        setMessage(null);
        try {
            const result = await deleteJob(jobId);
            setMessage(result.success ? "Job deleted successfully!" : "Failed to delete job");
            setMessageType(result.success ? "success" : "error");
        } catch (error) {
            console.error("Error deleting job:", error);
            setMessage(`Failed to delete job: ${error.message}`);
            setMessageType("error");
        }
    };

    const closeMessage = () => setMessage(null);

    if (loadingAuth) return <LoadingSpinner />;
    if (!currentUser || !isAdmin) return null; // Message box will handle redirect

    return (
        <div className="container mx-auto p-6 bg-[#212121] text-gray-100 rounded-xl shadow-lg border border-gray-700 min-h-[calc(100vh-120px)]"> {/* Primary Dark Color */}
            <h1 className="text-4xl font-extrabold text-gray-100 mb-8 text-center">Manage Job Listings</h1>

            {/* Job Add/Edit Form */}
            <div className="bg-[#333333] p-8 rounded-xl shadow-inner mb-10 border border-gray-700"> {/* Slightly lighter dark background */}
                <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">
                    {editingJob ? 'Edit Job' : 'Add New Job'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={jobForm.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={jobForm.location}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={jobForm.description}
                            onChange={handleChange}
                            rows="4"
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                        ></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="requirements" className="block text-sm font-medium text-gray-300 mb-1">Requirements</label>
                        <textarea
                            id="requirements"
                            name="requirements"
                            value={jobForm.requirements}
                            onChange={handleChange}
                            rows="3"
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-gray-300 mb-1">Salary</label>
                        <input
                            type="text"
                            id="salary"
                            name="salary"
                            value={jobForm.salary}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="jobType" className="block text-sm font-medium text-gray-300 mb-1">Job Type</label>
                        <select
                            id="jobType"
                            name="jobType"
                            value={jobForm.jobType}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-gray-800 text-gray-100"
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 flex justify-center space-x-4 mt-4">
                        <button
                            type="submit"
                            className="bg-[#004D40] hover:bg-[#00695C] text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-700"
                        >
                            {editingJob ? 'Update Job' : 'Add Job'}
                        </button>
                        {editingJob && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingJob(null);
                                    setJobForm({ title: '', description: '', requirements: '', location: '', salary: '', jobType: 'Full-time' });
                                }}
                                className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Existing Job Listings */}
            <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Existing Job Listings</h2>
            {jobs.length === 0 ? (
                <p className="text-center text-gray-400 text-lg py-10">No job listings available.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            isAdmin={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
            <MessageBox message={message} type={messageType} onClose={closeMessage} />
        </div>
    );
};

// --- View User Applications Page (Admin View) ---
const ViewApplicationsPage = ({ navigate }) => {
    const { currentUser, userId, isAdmin, loadingAuth } = useContext(AuthContext);
    const [adminApplications, setAdminApplications] = useState([]);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        if (!loadingAuth && (!currentUser || !isAdmin)) {
            setMessage("Access Denied. Please log in as an admin to view applications.");
            setMessageType("error");
            setTimeout(() => navigate('login'), 1500);
        } else if (isAdmin) {
            fetchAllApplications();
        }
    }, [loadingAuth, currentUser, userId, isAdmin, navigate]);

    const fetchAllApplications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/applications', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Admin applications data:', data);
                setAdminApplications(data);
            } else {
                console.error('Failed to fetch applications:', response.status);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    const updateStatus = async (appId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setMessage(`Application status updated to ${newStatus}`);
                setMessageType('success');
                await fetchAllApplications(); // Refresh data
            } else {
                setMessage('Failed to update status');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('Failed to update status');
            setMessageType('error');
        }
    };
    
    const deleteApplication = async (appId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${appId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                setMessage('Application deleted successfully');
                setMessageType('success');
                await fetchAllApplications(); // Refresh data
            } else {
                setMessage('Failed to delete application');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('Failed to delete application');
            setMessageType('error');
        }
    };
    


    const closeMessage = () => setMessage(null);

    if (loadingAuth) return <LoadingSpinner />;
    if (!currentUser || !isAdmin) return null;

    return (
        <div className="container mx-auto p-6 bg-[#212121] text-gray-100 rounded-xl shadow-lg border border-gray-700 min-h-[calc(100vh-120px)]">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-8 text-center">All User Applications</h1>

            {adminApplications.length === 0 ? (
                <p className="text-center text-gray-400 text-lg py-10">No applications have been submitted yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {adminApplications.map(app => (
                        <div key={app._id} className="bg-[#333333] rounded-xl shadow-md p-6 border border-gray-700 text-gray-100">
                            <h3 className="text-xl font-bold text-gray-100 mb-2">{app.jobId?.title || 'Job Title Not Found'}</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Applicant: <span className="font-semibold">{app.userId?.name || 'N/A'}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                Email: <span className="font-semibold">{app.userId?.email || app.userEmail || 'N/A'}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                User ID: <span className="font-mono text-xs bg-gray-700 px-1 py-0.5 rounded">{app.userId?._id || app.userId}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                Location: <span className="font-semibold">{app.jobId?.location || 'N/A'}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                Salary: <span className="font-semibold text-green-400">{app.jobId?.salary || 'N/A'}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-3">
                                Applied On: {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                }) : 'N/A'}
                            </p>
                            <p className={`font-semibold mb-3 capitalize ${
                                app.status === 'accepted' ? 'text-green-400' : 
                                app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                                Status: {app.status || 'pending'}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => updateStatus(app._id, 'accepted')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                    disabled={app.status === 'accepted'}
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => updateStatus(app._id, 'rejected')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                    disabled={app.status === 'rejected'}
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => updateStatus(app._id, 'pending')}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                                    disabled={app.status === 'pending'}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => deleteApplication(app._id)}
                                    className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 rounded text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <MessageBox message={message} type={messageType} onClose={closeMessage} />
        </div>
    );
};

// --- AppContent Component to be wrapped by AuthProvider and DataProvider ---
const AppContent = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const { loadingAuth } = useContext(AuthContext);

    const navigate = (page) => {
        setCurrentPage(page);
    };

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1A1A1A]"> {/* Overall body background */}
                <LoadingSpinner />
            </div>
        );
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage navigate={navigate} />;
            case 'login':
                return <LoginPage navigate={navigate} />;
            case 'signup':
                return <SignupPage navigate={navigate} />;
            case 'userDashboard':
                return <UserDashboard navigate={navigate} />;
            case 'browseJobs':
                return <BrowseJobsPage navigate={navigate} />;
            case 'appliedJobs':
                return <AppliedJobsPage navigate={navigate} />;
            case 'adminDashboard':
                return <AdminDashboard navigate={navigate} />;
            case 'manageJobs':
                return <ManageJobsPage navigate={navigate} />;
            case 'viewApplications':
                return <ViewApplicationsPage navigate={navigate} />;
            default:
                return <HomePage navigate={navigate} />;
        }
    };

    return (
        <>
            <Navbar navigate={navigate} />
            <main className="p-4 md:p-8">
                {renderPage()}
            </main>
        </>
    );
};

// --- Main App Component ---
const App = () => {

    return (
        <div className="min-h-screen bg-[#1A1A1A] font-sans text-gray-100">
            <AuthProvider>
                <DataProvider>
                    <AppContent />
                </DataProvider>
            </AuthProvider>
        </div>
    );
};

export default App;