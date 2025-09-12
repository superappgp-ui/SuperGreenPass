
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Loader2, AlertTriangle } from 'lucide-react';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import AgentDashboard from '../components/dashboards/AgentDashboard';
import SchoolDashboard from '../components/dashboards/SchoolDashboard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import TutorDashboard from '../components/dashboards/TutorDashboard';
import VendorDashboard from '../components/dashboards/VendorDashboard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        // Check if it's a 401 Unauthorized error
        if (e?.response?.status === 401) {
          // User is not logged in, redirect to the home page.
          navigate(createPageUrl('Home'));
          return; // Stop further processing
        }
        console.error("Failed to fetch current user", e);
        setError("Could not load user information. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">An Error Occurred</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!currentUser) {
    // This state can be hit briefly during redirection, or if the request fails for non-401 reasons.
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  switch (currentUser.user_type) {
    case 'admin':
      return <AdminDashboard user={currentUser} />;
    case 'agent':
      return <AgentDashboard user={currentUser} />;
    case 'school':
      return <SchoolDashboard user={currentUser} />;
    case 'tutor':
      return <TutorDashboard user={currentUser} />;
    case 'vendor':
      return <VendorDashboard user={currentUser} />;
    case 'student':
    case 'user':
    default:
      return <StudentDashboard user={currentUser} />;
  }
}
