import React, { FC, useEffect, useState } from "react";
import {
  FunctionRegion,
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  SupabaseClient,
} from "@supabase/supabase-js";
import { MessagePayload, onMessage } from "firebase/messaging";
import { getFirebaseToken, messaging } from "../lib/firebase";
import { fetchSession, getDeviceInfo } from "../helpers";

interface NotificationPayloadProps {
  data?: MessagePayload | undefined;
  open: boolean;
}

type Props = {
  supabase: SupabaseClient;
};

const NotificationList: FC<Props> = ({ supabase }) => {
  // To store notification data from firebase
  const [notificationPayload, setNotificationPayload] = useState<
    (NotificationPayloadProps | undefined)[]
  >([]);
  const [open, setOpen] = useState(false);

  // This is self invoking function that listen of the notification
  (async () => {
    if (messaging) {
      onMessage(messaging, (payload: MessagePayload) => {
        console.log({ messaging_payload: payload });
        // setNotificationPayload([{ data: payload, open: true }]);
        // setTimeout(() => setNotificationPayload([{ open: false }]), 6000);
      });
    }
  })();

  const handleGetFirebaseToken = () => {
    console.log("Getting Firebase Token……");

    getFirebaseToken().then(async (firebaseToken: any) => {
      console.log({ firebaseToken });
      if (firebaseToken) {
        sessionStorage.setItem("firebaseToken", firebaseToken);

        const device_info = getDeviceInfo();

        const result = await supabase.functions.invoke("notification", {
          headers: {
            "x-invoke-func": "add-fcm-token",
          },
          body: {
            payload: {
              fcm_token: firebaseToken,
              device_info,
            },
          },
        });

        console.log({ result });
      }
    });
  };

  useEffect(() => {
    const firebaseToken = sessionStorage.getItem("firebaseToken");
    if (firebaseToken) return;

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

  const handlePushNotification = async ({ title, body }) => {
    const firebaseToken = sessionStorage.getItem("firebaseToken");
    console.log({ firebaseToken });

    if (!firebaseToken) {
      return alert("Please enable the push notification");
    }

    try {
      const { data: userSession, error: fetchError } =
        await fetchSession(supabase);

      if (fetchError) {
        throw fetchError;
      }

      const user = userSession.user;

      const { data, error } = await supabase.functions.invoke("notification", {
        headers: {
          "x-invoke-func": "send-notification",
          "x-region": FunctionRegion.ApSoutheast1,
        },
        body: {
          payload: {
            type: "topics",
            payload: {
              topic: user.id,
            },
            notification: {
              title,
              body,
              image: "https://via.placeholder.com/150",
              // click_action: "https://www.google.com",
            },
            platforms: {
              webpush: {
                fcm_options: {
                  link: "https://pito.vn",
                },
              },
            },
          },
        },
      });
      console.log({ data, error });

      let errorMessage = error?.message;
      let errorJson = null;

      if (error instanceof FunctionsHttpError) {
        const errorMsg = await error.context.json();
        errorJson = errorMsg;
        errorMessage = errorMsg.message;
        console.log("Function returned an error", errorMsg);
      } else if (error instanceof FunctionsRelayError) {
        console.log("Relay error:", error.message);
      } else if (error instanceof FunctionsFetchError) {
        console.log("Fetch error:", error.message);
      }

      if (errorMessage) {
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.log({ error });
    }
  };

  return (
    <div>
      <div className="App">
        {"Notification" in window &&
          window.Notification.permission !== "granted" && (
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
          <button
            className="Button"
            onClick={() => {
              handlePushNotification({
                title: "Dang giao hang",
                body: "Testing",
                // body: "Đơn hàng ${order_code} đang được giao đến địa chỉ của bạn. Chúng tôi sẽ liên tục cập nhật về trạng thái giao hàng cho đến khi bạn nhận được hàng. Theo dõi ngay!",
              });
            }}
          >
            Web Push Notification
          </button>
          <br />
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
