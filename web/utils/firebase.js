// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getStorage} from "firebase/storage";
import  {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: "ai-folder",
    storageBucket: "ai-folder.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// analytics.log
export const auth = getAuth(app)

// export let analytics =null
export let analytics =   null

export const storage = getStorage(app)

export const db = getFirestore(app)

let analyticsEnabled = false

export const toggleAnalytics = (enabled) => analyticsEnabled = Boolean(enabled)

export const sendLog = (name, obj) => {
    if (!analyticsEnabled) {
        console.log("analytics is not enabled", name, obj)
        return;
    }

    if(analytics === null) {
        analytics = app.name && typeof window !== 'undefined' ? getAnalytics(app) : null;
        console.log("analytics is not supported; trying to init", name, obj)
        return;
    }
    logEvent(analytics, name, obj)
}