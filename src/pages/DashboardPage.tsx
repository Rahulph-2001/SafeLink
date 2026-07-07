import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ShieldAlert, Users, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { profile, logout } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!profile || !profile.trustedBy || profile.trustedBy.length === 0) return;

    const sessionsRef = collection(db, 'emergency_sessions');
    
    const chunks = [];
    for (let i = 0; i < profile.trustedBy.length; i += 10) {
      chunks.push(profile.trustedBy.slice(i, i + 10));
    }

    const targetIds = chunks[0];
    
    if (targetIds.length === 0) return;

    const q = query(
      sessionsRef, 
      where('status', '==', 'active'),
      where('userId', 'in', targetIds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => doc.data());
      setActiveAlerts(alerts);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-emergency-600" />
            <h1 className="text-xl font-bold text-gray-900">SafeLink</h1>
          </div>
          <button 
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
              <Bell className="w-6 h-6 animate-pulse" />
              ACTIVE EMERGENCIES
            </h2>
            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <div key={alert.sessionId} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-red-900">{alert.userName} needs help!</h3>
                    <p className="text-sm text-red-700">Started {new Date(alert.startedAt?.toDate()).toLocaleTimeString()}</p>
                  </div>
                  <Link 
                    to={`/tracking/${alert.sessionId}`}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                  >
                    View Live <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome, {profile?.name || 'User'}!</h2>
          <p className="text-gray-600 mb-6">
            This is your SafeLink dashboard. You can start an emergency session or manage your trusted contacts.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Link to="/emergency" className="bg-emergency-600 hover:bg-emergency-700 text-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center gap-2 transition-colors">
               <ShieldAlert className="w-12 h-12" />
               <span className="text-lg font-bold">START EMERGENCY</span>
             </Link>
             <Link to="/contacts" className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center gap-2 transition-colors">
               <Users className="w-12 h-12 text-gray-400 mb-2" />
               <span className="text-lg font-bold">Manage Contacts</span>
               <span className="text-sm text-gray-500">{profile?.trustedContacts.length || 0} Trusted Contacts</span>
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
