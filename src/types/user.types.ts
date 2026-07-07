export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  trustedContacts: string[];
  trustedBy: string[];
  createdAt: Date;
}
