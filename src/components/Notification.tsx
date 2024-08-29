import React, { useEffect, useState } from "react";
import { MessagePayload, onMessage } from "firebase/messaging";
import { getFirebaseToken, messaging } from "../lib/firebase";

interface NotificationPayloadProps {
  data?: MessagePayload | undefined;
  open: boolean;
}

const NotificationList = () => {
  // To store notification data from firebase
  const [notificationPayload, setNotificationPayload] = useState<
    (NotificationPayloadProps | undefined)[]
  >([]);
  const [open, setOpen] = useState(false);

  // This is self invoking function that listen of the notification
  const onReceiver = (async () => {
    if (messaging) {
      onMessage(messaging, (payload: MessagePayload) => {
        console.log({ messaging_payload: payload });
        setNotificationPayload([{ data: payload, open: true }]);
        setTimeout(() => setNotificationPayload([{ open: false }]), 6000);
      });
    }
  })();

  const handleGetFirebaseToken = () => {
    getFirebaseToken().then((firebaseToken: any) => {
      console.log({ firebaseToken });
      if (firebaseToken) {
        sessionStorage.setItem("firebaseToken", firebaseToken);
      }
    });
  };

  useEffect(() => {
    console.log("Requesting User Permission……", window.Notification.permission);

    Notification.requestPermission().then((permission: any) => {
      console.log({ permission });

      if (permission === "granted") {
        handleGetFirebaseToken();
        console.log("Notification User Permission Granted.");
      } else {
        console.log("User Permission Denied.");
      }
    });
  }, []);

  const handlePushNotification = async () => {
    const firebaseToken = sessionStorage.getItem("firebaseToken");
    console.log({ firebaseToken });
    // if (firebaseToken) {
    //   try {
    //     const response = await fetch("http://localhost:8080/send-noti", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         token: firebaseToken,
    //       },
    //       body: JSON.stringify({
    //         title: "Hello",
    //         body: "Hello, Welcome to the Web Push Notification",
    //       }),
    //     });
    //
    //     console.log({ response });
    //   } catch (error) {
    //     console.log({ error });
    //   }
    // }
  };

  return (
    <div>
      <div className="App">
        {"Notification" in window && Notification.permission !== "granted" && (
          <div className="notification-banner">
            <span>The app needs permission to</span>
            <a
              href="#"
              className="notification-banner-link"
              onClick={handleGetFirebaseToken}
            >
              enable push notifications.
            </a>
          </div>
        )}
        <header>
          <h1 className="App-title">
            Web Push Notifications With React And Firebase
          </h1>
        </header>
        <div>
          <button className="Button" onClick={handlePushNotification}>
            Web Push Notification
          </button>
          <br />
          <button
            className="Button"
            onClick={() => {
              setOpen(true);
              setTimeout(() => setOpen(false), 6000);
            }}
          >
            Show Web Push Notification
          </button>
        </div>

        {/* Rendering  Notification from firebase */}

        {notificationPayload.map((notification) => {
          return (
            <>
              {notification?.open && (
                <div className="notification">
                  <div className="push-notification-title">
                    <h1>{notification?.data?.notification?.title}</h1>
                    <button
                      className="close-button"
                      onClick={() => {
                        setNotificationPayload([{ open: false }]);
                      }}
                    >
                      X
                    </button>
                  </div>
                  <div>
                    <h1 className="push-notification-text">
                      {notification?.data?.notification?.body}
                    </h1>
                  </div>
                </div>
              )}
            </>
          );
        })}

        {/* Rendering Demo Notification */}

        {open && (
          <div
            className="notification"
            onClick={() => {
              setOpen(false);
            }}
          >
            <div className="push-notification-title">
              <h1>New Message</h1>
              <button
                className="close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
              >
                X
              </button>
            </div>
            <div>
              <h1 className="push-notification-text">
                Hello Welcome, Today you will learn how to use
                firebase-notifications
              </h1>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
