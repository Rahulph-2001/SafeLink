import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrustedContactsProfiles, removeTrustedContact } from '../services/contactsService';
import { getCurrentUserProfile } from '../services/authService';
import { ContactCard } from '../components/contacts/ContactCard';
import { AddContactModal } from '../components/contacts/AddContactModal';
import type { UserProfile } from '../types/user.types';
import { ShieldAlert, Users, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactsPage = () => {
  const { profile, user } = useAuth();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // We need to fetch the latest profile to ensure we have the most up-to-date trustedContacts array
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(profile);

  const loadContacts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedProfile = await getCurrentUserProfile(user.uid);
      setCurrentProfile(updatedProfile);
      
      if (updatedProfile && updatedProfile.trustedContacts.length > 0) {
        const profiles = await getTrustedContactsProfiles(updatedProfile.trustedContacts);
        setContacts(profiles);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error("Failed to load contacts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [user]);

  const handleRemoveContact = async (contactUid: string) => {
    if (!currentProfile) return;
    if (window.confirm("Are you sure you want to remove this contact?")) {
      setRemovingId(contactUid);
      try {
        await removeTrustedContact(currentProfile.uid, contactUid);
        await loadContacts();
      } catch (err) {
        console.error("Failed to remove contact", err);
      } finally {
        setRemovingId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-emergency-600" />
              <h1 className="text-xl font-bold text-gray-900">SafeLink</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900">Trusted Contacts</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emergency-600 hover:bg-emergency-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Contact
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emergency-600"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trusted contacts yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              Add family members or close friends who will be notified in case of an emergency.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-emergency-600 font-medium hover:text-emergency-700"
            >
              + Add your first contact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <ContactCard 
                key={contact.uid} 
                contact={contact} 
                onRemove={handleRemoveContact}
                isRemoving={removingId === contact.uid}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <AddContactModal 
          onClose={() => setIsModalOpen(false)} 
          onAdded={() => {
            loadContacts();
          }} 
        />
      )}
    </div>
  );
};
