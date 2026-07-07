import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile } from '../types/user.types';

export const sendEmergencyNotifications = async (fromUser: UserProfile, sessionId: string) => {
  const trustedContacts = fromUser.trustedContacts;
  
  if (!trustedContacts || trustedContacts.length === 0) return;

  const notificationsRef = collection(db, 'notifications');
  
  await Promise.all(trustedContacts.map(async (contactUid) => {
    const notifId = uuidv4();
    const notifDoc = doc(notificationsRef, notifId);
    
    await setDoc(notifDoc, {
      id: notifId,
      toUserId: contactUid,
      fromUserId: fromUser.uid,
      fromUserName: fromUser.name,
      sessionId: sessionId,
      type: 'emergency_started',
      read: false,
      createdAt: serverTimestamp()
    });
  }));
};
