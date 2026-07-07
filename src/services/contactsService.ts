import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types/user.types';

export const searchUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const data = querySnapshot.docs[0].data();
    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      trustedContacts: data.trustedContacts || [],
      trustedBy: data.trustedBy || [],
      createdAt: data.createdAt?.toDate() || new Date()
    } as UserProfile;
  }
  return null;
};

export const addTrustedContact = async (myUid: string, contactUid: string): Promise<void> => {
  const myDocRef = doc(db, 'users', myUid);
  const contactDocRef = doc(db, 'users', contactUid);

  // Add to my trustedContacts
  await updateDoc(myDocRef, {
    trustedContacts: arrayUnion(contactUid)
  });

  // Add to their trustedBy
  await updateDoc(contactDocRef, {
    trustedBy: arrayUnion(myUid)
  });
};

export const removeTrustedContact = async (myUid: string, contactUid: string): Promise<void> => {
  const myDocRef = doc(db, 'users', myUid);
  const contactDocRef = doc(db, 'users', contactUid);

  await updateDoc(myDocRef, {
    trustedContacts: arrayRemove(contactUid)
  });

  await updateDoc(contactDocRef, {
    trustedBy: arrayRemove(myUid)
  });
};

export const getTrustedContactsProfiles = async (uids: string[]): Promise<UserProfile[]> => {
  if (!uids || uids.length === 0) return [];
  
  const profiles: UserProfile[] = [];
  // For small arrays (like max 10 trusted contacts), fetching individually is fine.
  // Alternatively we could use 'in' query but it has limits and requires batches of 10.
  for (const uid of uids) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
       const data = docSnap.data();
       profiles.push({
         uid: data.uid,
         name: data.name,
         email: data.email,
         trustedContacts: data.trustedContacts || [],
         trustedBy: data.trustedBy || [],
         createdAt: data.createdAt?.toDate() || new Date()
       });
    }
  }
  return profiles;
};
