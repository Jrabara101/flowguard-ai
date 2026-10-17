// Firebase web setup. This config is public by design: it only names the project.
// Access is controlled by firestore.rules (browsers may read the activity feed, never write).
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCzbvuFtL7Ln8-WVU2pMeO3w0k9tlCpQzk',
  authDomain: 'flowguard-ai-2026.firebaseapp.com',
  projectId: 'flowguard-ai-2026',
  appId: '1:79354024474:web:36bd9d78d08dc3ce7cf7a3',
});

export const db = getFirestore(app);
