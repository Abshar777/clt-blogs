import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// NOTE: Replace these with actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSy-mock-key",
  authDomain: "clt-blog-demo.firebaseapp.com",
  projectId: "clt-blog-demo",
  storageBucket: "clt-blog-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection Reference
export const postsCollection = collection(db, "posts");

// Helper to upload image and return URL
export const uploadImage = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `blog-images/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};
