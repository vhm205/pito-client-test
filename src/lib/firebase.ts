import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

export const VAPID_KEY =
  "BPEcTPqRiQ1FHmf1oO6dm0Al8AsWqNRgnXbwSfyFKLde5pnfPyGY4BYoOGUbdHu5AAl7uxRb7wFa0JfkUBG2XwA";

export const firebaseConfig = {
  apiKey: "AIzaSyAH8v1QhYc8CYQ2U8Hy2LNqFXpTebtSBLI",
  authDomain: "pito-platform-418503.firebaseapp.com",
  projectId: "pito-platform-418503",
  storageBucket: "pito-platform-418503.appspot.com",
  messagingSenderId: "532885014813",
  appId: "1:532885014813:web:bc8f4eb69788df416639f4",
  measurementId: "G-9RRDBY1XJL",
};

export const UrlFirebaseConfig = new URLSearchParams(firebaseConfig);

export const swUrl = `http://localhost:5173/firebase-messaging-sw.js?${UrlFirebaseConfig.toString()}`;

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

export const getOrRegisterServiceWorker = async () => {
  if (
    "serviceWorker" in navigator &&
    typeof window.navigator.serviceWorker !== "undefined"
  ) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        console.log({ registration });
        if (
          registration.scope.includes("firebase-cloud-messaging-push-scope")
        ) {
          registration.unregister();
        }
      }
    });

    return window.navigator.serviceWorker
      .getRegistration("/firebase-push-notification-scope")
      .then((serviceWorker) => {
        // if (serviceWorker) return serviceWorker;
        return window.navigator.serviceWorker.register(
          `/firebase-messaging-sw.js`,
          // {
          //   scope: "/firebase-push-notification-scope",
          // },
        );
      })
      .catch((error) => {
        console.log(
          "An error occurred while registering service worker. ",
          error,
        );
      });
  }
  throw new Error("The browser doesn`t support service worker.");
};

// getFirebaseToken function generates the FCM token
export const getFirebaseToken = async () => {
  try {
    const isSupport = await isSupported();
    if (!isSupport) {
      return alert("The browser doesn`t support service worker.");
    }

    console.log({ messaging });
    if (messaging) {
      // const deleted = await deleteToken(messaging);
      // console.log({ deleted });

      return getOrRegisterServiceWorker().then((serviceWorkerRegistration) => {
        console.log({ serviceWorkerRegistration });
        return getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration:
            serviceWorkerRegistration as ServiceWorkerRegistration,
        });
      });
    }
  } catch (error) {
    console.log("An error occurred while retrieving token. ", error);
    return "";
  }
};
