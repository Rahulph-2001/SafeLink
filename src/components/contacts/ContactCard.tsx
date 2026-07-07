import type { UserProfile } from '../../types/user.types';
import { UserMinus } from 'lucide-react';

interface ContactCardProps {
  contact: UserProfile;
  onRemove: (uid: string) => void;
  isRemoving: boolean;
}

export const ContactCard = ({ contact, onRemove, isRemoving }: ContactCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
      <div>
        <h3 className="font-medium text-gray-900">{contact.name}</h3>
        <p className="text-sm text-gray-500">{contact.email}</p>
      </div>
      <button
        onClick={() => onRemove(contact.uid)}
        disabled={isRemoving}
        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
        title="Remove contact"
      >
        <UserMinus className="w-5 h-5" />
      </button>
    </div>
  );
};
