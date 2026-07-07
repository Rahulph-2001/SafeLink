import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types/user.types';

export const getCurrentUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid,
      name: data.name,
      email: data.email,
      trustedContacts: data.trustedContacts || [],
      trustedBy: data.trustedBy || [],
      createdAt: data.createdAt?.toDate() || new Date()
    } as UserProfile;
  }
  return null;
};

export const createUserProfile = async (uid: string, name: string, email: string): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, {
    uid,
    name,
    email,
    trustedContacts: [],
    trustedBy: [],
    createdAt: new Date()
  });
};
