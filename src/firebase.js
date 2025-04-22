// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCrwG3NPhxJiI_yTAPhisySv1Nzg4oTXHU",
  authDomain: "tracspend.firebaseapp.com",
  projectId: "tracspend",
  storageBucket: "tracspend.firebasestorage.app",
  messagingSenderId: "271864132582",
  appId: "1:271864132582:web:a0233e28829df3aac19c27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
