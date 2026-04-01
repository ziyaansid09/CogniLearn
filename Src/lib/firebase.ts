import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbbrO5RcjfRuytexkVRhgIUOYDigm8yfE",
  authDomain: "cognifit-learn.firebaseapp.com",
  projectId: "cognifit-learn",
  storageBucket: "cognifit-learn.firebasestorage.app",
  messagingSenderId: "828438358301",
  appId: "1:828438358301:web:bf314b8dd7eea3fc4799f4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;