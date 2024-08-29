/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
// required to setup background notification handler when browser is not in focus or in background and
// In order to receive the onMessage event,  app must define the Firebase messaging service worker

importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js",
);

// Set Firebase configuration, once available
// self.addEventListener("fetch", () => {
//   try {
//     const urlParams = new URLSearchParams(location.search);
//     self.firebaseConfig = Object.fromEntries(urlParams);
//   } catch (err) {
//     console.error("Failed to add event listener", err);
//   }
// });

// "Default" Firebase configuration (prevents errors)
const defaultConfig = {
  apiKey: true,
  projectId: true,
  messagingSenderId: true,
  appId: true,
};

// Initialize Firebase app
// firebase.initializeApp(self.firebaseConfig || defaultConfig);

firebase.initializeApp({
  apiKey: "AIzaSyAH8v1QhYc8CYQ2U8Hy2LNqFXpTebtSBLI",
  authDomain: "pito-platform-418503.firebaseapp.com",
  projectId: "pito-platform-418503",
  storageBucket: "pito-platform-418503.appspot.com",
  messagingSenderId: "532885014813",
  appId: "1:532885014813:web:bc8f4eb69788df416639f4",
  measurementId: "G-9RRDBY1XJL",
});

let messaging;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.error("Failed to initialize Firebase Messaging", err);
}

// To dispaly background notifications
if (messaging) {
  try {
    messaging.onBackgroundMessage((payload) => {
      console.log("Received background message: ", payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = { body: payload.notification.body };
      self.registration.showNotification(
        notificationTitle,
        notificationOptions,
      );
    });
  } catch (err) {
    console.error({ service_worker_error: err });
  }
}

// self.addEventListener("push", (event) => {
//   const data = event.data.json();
//
//   self.registration.showNotification(data.title, {
//     body: "Yay it works!",
//   });
// });
