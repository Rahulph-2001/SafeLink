import { useState } from 'react';
import { searchUserByEmail, addTrustedContact } from '../../services/contactsService';
import { useAuth } from '../../context/AuthContext';
import { Search, X, UserPlus, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../../types/user.types';

interface AddContactModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export const AddContactModal = ({ onClose, onAdded }: AddContactModalProps) => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    setSearchResult(null);
    
    try {
      if (email.toLowerCase() === profile?.email.toLowerCase()) {
        setError("You cannot add yourself as a contact.");
        return;
      }
      
      const result = await searchUserByEmail(email);
      if (result) {
        if (profile?.trustedContacts.includes(result.uid)) {
          setError("This user is already in your trusted contacts.");
        } else {
          setSearchResult(result);
        }
      } else {
        setError("No user found with this email address.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search for user");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!searchResult || !profile) return;
    
    setAdding(true);
    try {
      await addTrustedContact(profile.uid, searchResult.uid);
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add contact");
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Trusted Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emergency-500 focus:ring-emergency-500 p-2 border"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 border border-gray-300 disabled:opacity-50"
              >
                {loading ? <div className="animate-spin h-5 w-5 border-b-2 border-gray-700 rounded-full" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {searchResult && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{searchResult.name}</h3>
                <p className="text-sm text-gray-500">{searchResult.email}</p>
              </div>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex items-center gap-1 bg-emergency-600 hover:bg-emergency-700 text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
