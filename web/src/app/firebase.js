// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAOYVPghVxQM2-vubwYnIDFzHhfmAIrxHY",
    authDomain: "ai-folder.firebaseapp.com",
    projectId: "ai-folder",
    storageBucket: "ai-folder.appspot.com",
    messagingSenderId: "183197221584",
    appId: "1:183197221584:web:cabfca1b0e99ea1a6a94d5",
    measurementId: "G-0H3KRRH8S6"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app)