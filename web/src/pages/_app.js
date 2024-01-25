// pages/_app.js
import {NextUIProvider} from '@nextui-org/react'

function MyApp({ Component, pageProps }) {
  return (
    <NextUIProvider>
      <Component {...pageProps} />
    </NextUIProvider>
  )
}


// export async function getStaticProps() {
//     const firebaseConfig = {
//         apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//         authDomain: "ai-folder.firebaseapp.com",
//         projectId: "ai-folder",
//         storageBucket: "ai-folder.appspot.com",
//         messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//         appId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//         measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
//     };
//
// // Initialize Firebase
//     export const app = initializeApp(firebaseConfig);
// // export const analytics = getAnalytics(app);
//     export const auth = getAuth(app)
// }
export default MyApp;