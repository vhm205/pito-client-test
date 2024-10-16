import React, { useState, useEffect, useContext, useRef } from "react";
import {
  createClient,
  FunctionRegion,
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js";
import {
  Button,
  Flex,
  Box,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Spacer,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
// import { jwtDecode } from "jwt-decode";
import { DeleteIcon } from "@chakra-ui/icons";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

import { ListItems } from "../../cart/ListItems";
import { ShoppingCart } from "../../cart/ShoppingCart";
import { OrderContext } from "../../contexts/OrderContext";
import { fetchSession, getRandomInt } from "../../helpers";

import ModalLoading from "../../components/ModalLoading";
// import Notification from "../../components/Notification";

import "../../App.css";

const {
  VITE_ENV,
  VITE_NON_KEY_DEV,
  VITE_NON_KEY_STAGING,
  VITE_NON_KEY_PRODUCTION,
  VITE_SUPABASE_URL_DEV,
  VITE_SUPABASE_URL_STAGING,
  VITE_SUPABASE_URL_PRODUCTION,
} = import.meta.env;

const domain = {
  dev: VITE_SUPABASE_URL_DEV,
  staging: VITE_SUPABASE_URL_STAGING,
  production: VITE_SUPABASE_URL_PRODUCTION,
};

const nonKey = {
  dev: VITE_NON_KEY_DEV,
  staging: VITE_NON_KEY_STAGING,
  production: VITE_NON_KEY_PRODUCTION,
};

const supabase = createClient(domain[VITE_ENV], nonKey[VITE_ENV]);

const payloadTemplates = {
  "create-order": {
    session_id: uuidv4(),
    receiver_name: "User Test",
    receiver_phone: "+84559932493",
    delivery_address: "112 Điện biên phủ",
    delivery_date: dayjs().toISOString(),
    delivery_later: false,
    payment_method: "atm",
    bank_code: "VNBANK",
    vnpay_callback_url: "https://pito.vn",
    order_type: "CT",
  },
  "create-order-beta": {
    session_id: uuidv4(),
    receiver_name: "User Test",
    receiver_phone: "+84559932493",
    delivery_address: "112 Điện biên phủ",
    delivery_date: "2024-05-23",
    delivery_time: "16:30:00",
    delivery_later: false,
    payment_method: "atm",
    bank_code: "ATM",
    vnpay_callback_url: "https://pito.vn",
    order_type: "CT",
  },
  "get-order-detail-of-partner": {
    partner_order_id: uuidv4(),
    store_id: uuidv4(),
  },
  "get-order-detail": {
    order_id: "",
  },
  "get-list-order-of-partner": {
    fromDate: "",
    toDate: "",
    status: "",
    store_id: "a304a0d4-7f2f-4328-af7d-237540d68fce",
  },
  "update-partner-order-status": {
    orderId: "",
    status: "completed", // canceled | prepared
  },
  "update-order-request": {
    orderId: "",
    status: "approved",
  },
  "get-total-order-by-status": {},
  "update-payment-method": {
    payment_method: "atm",
    enable: false,
  },
  "get-settings": {},
  "create-ticket": {
    name: "User Test",
    email: "minh.test@pito.vn",
    phone: "08281923811",
    description: "I have a issue with payment when create order",
    order_code: "",
    issue_type: "PaymentError",
  },
  "aggregate-transactions-of-partner": {
    keyword: "",
    partner_id: "",
    order_from_date: "",
    order_to_date: "",
  },
  "update-refund-order": {
    order_id: "",
    bill_code: "",
  },
  "create-url-payment": {
    order_id: uuidv4(),
    order_code: "202416101535",
    amount: 7_919_618,
    bank_code: "MASTERCARD",
  },
  "create-qr-code": {
    order_id: uuidv4(),
    store_id: uuidv4(),
    tx_id: uuidv4(),
    order_code: "",
  },
  "get-history-orders": {
    fromDate: "",
    toDate: "",
    status: "",
    keyword: "",
    deliveryDate: "",
  },
  "create-review": {
    orderId: "",
    storeId: "",
  },
  "retrieve-store-details": {
    identifier: "",
    userId: "",
  },
  "add-favorite-store": {
    identifier: "",
  },
  "remove-favorite-store": {
    identifier: "",
  },
  "get-favorite-stores": {
    shippingAddress: "",
  },
  "get-total-notification": {},
  "get-list-notification": {
    status: "sent",
  },
  "mark-notification-as-read": {
    notificationId: "",
  },
  "get-earlies-and-latest-store-time": {
    date: "",
  },
  "add-recently-viewed-store": {
    store_id: "",
  },
  "get-recently-viewed-stores": {},
  "redeem-point": {
    coupon_id: 906682,
  },
  "get-qr-transactions": {
    fromDate: "2024-06-01",
    toDate: "2024-09-01",
  },
};

const SupabaseTools = () => {
  const [qrCode, setQrCode] = useState("");
  const [text, setText] = useState("");
  const [paymentResponse, setPaymentResponse] = useState({
    isDonePayment: false,
    status: "",
  });
  const [objResponse, setObjResponse] = useState({});
  const [loading, setLoading] = useState({
    isLoginLoading: false,
    isSignUpLoading: false,
    isCreateOrderLoading: false,
  });
  const [info, setInfo] = useState({
    user: {},
    token: {
      access_token: "",
    },
  });
  const [authInfo, setAuthInfo] = useState({
    email: "",
    password: "",
    fullname: "",
    phone: "",
    user_type: "customer",
    partner: "",
    route_name: "order",
    function_name: "create-order",
  });
  const fileInputRef = useRef(null);
  const [attributes, setAttributes] = useState([{ name: "", value: "" }]);
  const [jsonPayload, setJsonPayload] = useState("");
  const [partners, setPartners] = useState([]);
  const [stores, setStores] = useState([]);
  const [partnerIds] = useState([]);

  const [searchParams, setSearchParams] = useState("");
  const search = new URLSearchParams(window.location.search);

  const { orderContext, setOrderContext } = useContext(OrderContext);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenProgressModal,
    onOpen: onOpenProgressModal,
    onClose: onCloseProgressModal,
  } = useDisclosure();

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: "", value: "" }]);
  };

  const handleInputChange = (index, event) => {
    const newAttributes = attributes.slice();
    newAttributes[index][event.target.name] = event.target.value;
    setAttributes(newAttributes);
  };

  const handleRemoveAttribute = (index) => {
    const newAttributes = attributes.slice();
    newAttributes.splice(index, 1);
    setAttributes(newAttributes);
  };

  useEffect(() => {
    setSearchParams(search.toString());
  }, [search.toString()]);

  useEffect(() => {
    changeFunction(authInfo.function_name);
  }, [authInfo.function_name]);

  useEffect(() => {
    const fetchData = async () => {
      // const CLOUD_FUNCTION_PAYMENT_URL = "https://payment.pito.vn";
      //
      // await fetch(`${CLOUD_FUNCTION_PAYMENT_URL}/acb/generate-token`, {
      //   method: "POST",
      //   body: JSON.stringify({
      //     urlencoded:
      //       "grant_type=client_credentials&scope=soba-api+service%3Aqr-payment&client_secret=6BwJVOplPOxGq5QPSXDPbfWIHtkzet9j&client_id=pito-cfea-4bb7-88ed-4d977921531f",
      //   }),
      //   headers: {
      //     "payment-pitovn-api-key": "aHR0cHM6Ly9waXRvLnZuLwo=",
      //   },
      // })
      //   .then((r) => r.json())
      //   .then((result) => console.log({ result }))
      //   .catch((error) => console.error({ error }));
      // const orderId = "7a2699f4-caf6-4ca7-9ad9-6e23f2804c00";
      //
      // const { data, error } = await supabase
      //   .from("orders")
      //   .select()
      //   .eq("order_code", "XPFJQ0011")
      //   .maybeSingle();
      // console.log({ data, error });
      //
      // const tx = await supabase
      //   .from("transactions")
      //   .select()
      //   .eq("order_id", orderId)
      //   .maybeSingle();
      // console.log({ tx });
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPartner = async () => {
      const { data, error } = await supabase
        .from("partners")
        .select()
        .eq("is_active", true);

      if (error) {
        notify({ status: "error", description: JSON.stringify(error) });
      } else if (data.length) {
        const firstPartner = data[0].id;

        setPartners(data as any);
        setOrderContext((prev) => ({ ...prev, partner_id: firstPartner }));
        setAuthInfo((prev) => ({
          ...prev,
          partner: firstPartner,
        }));
      }
    };

    fetchPartner();
  }, []);

  useEffect(() => {
    if (!orderContext.partner_id) return;

    const fetchStores = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select()
        .eq("partner_id", orderContext.partner_id)
        .eq("is_active", true);

      if (error) {
        notify({ status: "error", description: JSON.stringify(error) });
      } else {
        setStores(data as any);
        setOrderContext((prev) => ({ ...prev, store_id: data[0].id }));
      }
    };
    fetchStores();
  }, [orderContext.partner_id]);

  useEffect(() => {
    if (!orderContext.tx_id && !orderContext.order_id) return;

    const allChanges = supabase
      .channel("schema-db-changes")
      // .on(
      //   "postgres_changes",
      //   {
      //     event: "UPDATE",
      //     schema: "public",
      //     table: "transactions",
      //     filter: `id=eq.${orderContext.tx_id}`,
      //   },
      //   (payload) => {
      //     console.log({ payload });
      //     const { id, status } = payload.new;
      //
      //     if (id === orderContext.tx_id) {
      //       if (status === "completed") {
      //         notify({ title: "Payment Success!!", status: "success" });
      //         setOrderContext((prev) => ({ ...prev, refresh: uuidv4() }));
      //       }
      //
      //       if (status === "failed") {
      //         notify({ title: "Payment failed!!", status: "warning" });
      //       }
      //     }
      //
      //     setPaymentResponse({
      //       status,
      //       isDonePayment: true,
      //     });
      //   },
      // )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderContext.order_id}`,
        },
        (payload: any) => {
          console.log({ ORDER_CHANGE: payload });
          const { status } = payload.new;

          if (status === "created" || status === "waiting") {
            notify({
              title: "Create order Successfully :)))",
              status: "success",
            });
            setPaymentResponse({
              status: "completed",
              isDonePayment: true,
            });
          } else {
            notify({ title: "Create order Failed :(((", status: "success" });
            setPaymentResponse({
              status: "failed",
              isDonePayment: true,
            });
          }
        },
      )
      .subscribe();

    return () => {
      console.log("Removing channel...");
      supabase.removeChannel(allChanges);
    };
  }, [orderContext.tx_id, orderContext.order_id]);

  useEffect(() => {
    if (!orderContext.order_id) return;

    const subscribeChannelBroadcast = async () => {
      const { data } = await fetchSession(supabase);
      const eventName = `order:create:${orderContext.order_id}`;
      const channelName = `user:${data?.user?.id}`;
      const orderChannel = supabase.channel(channelName);
      console.log({ eventName, channelName });

      function messageReceived(data) {
        console.log({ BROADCAST: data });
        const {
          paymentInfo: { redirectUrl },
        } = data.payload;

        if (redirectUrl) {
          window.open(redirectUrl || "/", "_blank");
        }
        // supabase.removeChannel(orderChannel);
      }

      // Subscribe to the Channel
      orderChannel
        .on("broadcast", { event: eventName }, (payload) =>
          messageReceived(payload),
        )
        .subscribe();
    };

    subscribeChannelBroadcast();
  }, [orderContext.order_id]);

  const handleSignUp = async () => {
    if (!authInfo.email || !authInfo.password) {
      return notify({
        title: "You need to enter email and password",
        status: "warn",
      });
    }

    setLoading((prev) => ({ ...prev, isSignUpLoading: true }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: authInfo.email,
        password: authInfo.password,
        options: {
          data: {
            name: authInfo.fullname,
            phone: authInfo.phone,
            gender: "male",
            user_type: authInfo.user_type,
            partner_id: authInfo.partner,
          },
        },
      });

      if (data.session) {
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(data.session),
        );
        localStorage.setItem("supabase.auth.user", JSON.stringify(data.user));

        setAuthInfo((prev) => ({
          ...prev,
          email: "",
          passsword: "",
          fullname: "",
          phone: "",
        }));

        setInfo({
          user: data.user || {},
          token: data.session,
        });
      }

      if (error) {
        return setText(
          `<span style='color: red'>${JSON.stringify(error)}</span>`,
        );
      }

      setText("<span style='color: green'>Sign Up Success!!</span>");
    } catch (error) {
      setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
    } finally {
      setLoading((prev) => ({ ...prev, isSignUpLoading: false }));
    }
  };

  const handleSignIn = async () => {
    if (!authInfo.email || !authInfo.password) {
      return notify({
        title: "You need to enter email and password",
        status: "warning",
      });
    }

    setLoading((prev) => ({ ...prev, isLoginLoading: true }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authInfo.email,
        password: authInfo.password,
      });

      if (data.session) {
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(data.session),
        );
        localStorage.setItem("supabase.auth.user", JSON.stringify(data.user));

        setAuthInfo((prev) => ({
          ...prev,
          email: "",
          passsword: "",
          fullname: "",
          phone: "",
        }));
        setInfo({
          user: data.user,
          token: data.session,
        });
        setOrderContext((prev) => ({ ...prev, refresh: uuidv4() }));
      }

      if (error) {
        setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
      }

      setText("<span style='color: green'>Sign In Success!</span>");
    } catch (error) {
      setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
    } finally {
      setLoading((prev) => ({ ...prev, isLoginLoading: false }));
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    localStorage.removeItem("supabase.auth.token");
    localStorage.removeItem("supabase.auth.user");

    setInfo({
      user: "",
      token: { access_token: "" },
    });

    if (error) {
      setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
    } else {
      setText("<span style='color: green'>Sign Out Success!</span>");
    }

    setOrderContext((prev) => ({ ...prev, refresh: true }));
  };

  const handleTestFunction = async () => {
    try {
      const { route_name, function_name } = authInfo;
      let payload = {};

      if (jsonPayload) {
        payload = JSON.parse(jsonPayload);
      } else {
        attributes.map((attr) => {
          if (["true", "false"].includes(attr.value)) {
            payload[attr.name] = attr.value === "true";
          } else {
            payload[attr.name] = attr.value;
          }
        });
      }

      setText("");
      setObjResponse({});

      notify({ title: "Fetching...", status: "info" });
      const { data, error } = await supabase.functions.invoke(route_name, {
        headers: {
          "x-invoke-func": function_name,
          "x-region": FunctionRegion.ApSoutheast1,
        },
        body: {
          payload,
          // options: {
          //   sortDirection: "desc",
          // },
        },
      });
      notify({ title: "Fetch Success", status: "success" });

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

      setObjResponse({ data, error, errorMessage, errorJson });
      console.log({ data, errorMessage });

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      const response = data?.data;

      if (response && function_name === "create-order-beta") {
        onOpenProgressModal();
        setOrderContext((curr) => ({
          ...curr,
          tx_id: response.txId,
          order_id: response.orderId,
        }));
      }

      if (response && function_name === "create-order") {
        setOrderContext((curr) => ({
          ...curr,
          tx_id: response.txId,
          order_id: response.orderId,
        }));

        // Payment with ACB
        if (response.responseBody) {
          setQrCode(response.responseBody?.qrDataUrl);
        } else {
          setQrCode("");
        }

        // Payment with VNPAY
        if (response.redirectUrl) {
          onOpenProgressModal();
          setTimeout(() => {
            const redirectTo = response.redirectUrl || "/";
            console.log({ redirectTo });
            window.open(redirectTo, "_blank");
            // window.location.href = redirectTo;
          }, 1000);
        }
      }
    } catch (error) {
      console.error({ error });
      notify({ title: error.message, status: "error" });
      setText(`<span style='color: red'>${error.message}</span>`);
    }
  };

  const onChangeInput = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case "function_name": {
        changeFunction(value);
        break;
      }
      default:
        break;
    }

    setAuthInfo({ ...authInfo, [name]: value });
  };

  const changeFunction = (value) => {
    const template = payloadTemplates[value];

    if (template) {
      const newAttributes = Object.entries(template).map(([k, v]) => ({
        name: k,
        value: v,
      }));
      setAttributes(newAttributes as any);
    } else {
      setAttributes([]);
    }
  };

  const changeOrderContext = (e) => {
    const { name, value } = e.target;
    setOrderContext((prev) => ({ ...prev, [name]: value }));
  };

  // const changePartnerIds = (e) => {
  //   const { value, checked } = e.target;
  //
  //   if (!checked) {
  //     const newPartnerIds = partnerIds.filter((item) => item !== value);
  //     setPartnerIds(newPartnerIds);
  //   } else {
  //     setPartnerIds((prev) => [...prev, value]);
  //   }
  // };

  const notify = (props) => {
    toast({
      ...props,
      isClosable: true,
      position: "top-right",
    });
  };

  const executeCreateMultipleOrder = async () => {
    if (!partnerIds || !partnerIds.length) {
      return notify({ title: "Please choose partner", status: "error" });
    }

    setLoading((prev) => ({ ...prev, isCreateOrderLoading: true }));
    try {
      const { data: userSession, error } = await fetchSession(supabase);
      if (!userSession || error) {
        return notify({
          status: "error",
          description: "User session not found",
        });
      }

      const user = userSession.user;

      const asyncTasks = partnerIds.map(async (partnerId) => {
        const storeSession = await supabase
          .from("stores")
          .select()
          .eq("partner_id", partnerId)
          .eq("is_active", true)
          .limit(1)
          .single();
        const storeId = storeSession.data?.id;

        let sessionId = null;

        const session = await supabase
          .from("shopping_sessions")
          .select("*")
          .eq("customer_id", user.id)
          .eq("store_id", storeId)
          .limit(1)
          .single();

        if (!session.data || session.error) {
          const newSession = await supabase
            .from("shopping_sessions")
            .insert({
              store_id: storeId,
              customer_id: user.id,
              shipping_fee: 10_000,
            })
            .select("id")
            .single();

          sessionId = newSession.data?.id;
        } else {
          sessionId = session.data.id;
        }

        const item = await supabase
          .from("items")
          .select("*")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .limit(1)
          .single();
        const { id: itemId, base_price, options_and_choices } = item.data;

        const quantity = getRandomInt(1, 5);
        const total_price = base_price * quantity;

        await supabase.from("cart_items").insert({
          session_id: sessionId,
          item_id: itemId,
          quantity,
          notes: "Note something",
          raw_options_choices: options_and_choices,
          total_price,
        });

        const payload = {
          session_id: sessionId,
          receiver_name: "User Test",
          receiver_phone: "+84559932493",
          delivery_address: "112 Điện biên phủ",
          delivery_date: "2024-05-23",
          delivery_time: "16:30:00",
          delivery_later: false,
          payment_method: "atm",
          bank_code: "ATM",
          vnpay_callback_url: "https://pito.vn",
          order_type: "CT",
        };

        const { data } = await supabase.functions.invoke("order", {
          headers: {
            "x-invoke-func": "create-order",
          },
          body: {
            payload,
          },
        });
        return data;
      });

      const result = await Promise.allSettled(asyncTasks);
      console.log({ result });

      notify({ title: "Create Multiple Orders Success", status: "success" });
    } catch (error) {
      notify({ title: error.message, status: "error" });
    }

    setLoading((prev) => ({ ...prev, isCreateOrderLoading: false }));
  };

  const handleFileChange = async (e) => {
    try {
      const files = Array.from(e.target.files);
      console.log("files:", files);

      if (!files.length)
        return notify({ title: "Please select a file", status: "warning" });

      const filenames = files.map((file: any) => file.name);

      const { data, error } = await supabase.functions.invoke("storage", {
        headers: {
          "x-invoke-func": "create-signed-url",
        },
        body: {
          payload: {
            filenames,
            folder: "ticket",
          },
        },
      });
      if (error) return notify({ title: error.message, status: "error" });

      const signedUrls = data.data;

      if (!signedUrls?.length || signedUrls.length !== files.length)
        return notify({ title: "Something went wrong", status: "error" });

      const filesUpload = signedUrls.map((signedUrl, index) => ({
        signedUrl,
        file: files[index],
      }));

      const asyncUpload = filesUpload.map(({ signedUrl, file }) => {
        return supabase.storage
          .from("images")
          .uploadToSignedUrl(signedUrl.path, signedUrl.token, file);
      });
      await Promise.allSettled(asyncUpload);

      notify({ title: "Upload file success", status: "success" });
    } catch (error) {
      notify({ title: error.message, status: "error" });
    }
  };

  return (
    <>
      <div>
        {/* <Notification supabase={supabase} /> */}
        <p>{searchParams}</p>
        {info.token?.access_token && (
          <p style={{ wordBreak: "break-all" }}>
            Access Token: {info.token?.access_token}
          </p>
        )}
        <pre>{JSON.stringify(info.user, null, 2)}</pre>
        <p dangerouslySetInnerHTML={{ __html: text }} />
        <form style={{ marginBottom: "10px" }}>
          <Heading size="xl">Login Form</Heading>
          <div style={{ marginTop: "5px" }}>
            <Input
              type="email"
              name="email"
              placeholder="Enter email *"
              autoComplete="email"
              value={authInfo.email}
              onChange={onChangeInput}
              autoFocus
            />
          </div>
          <div>
            <Input
              type="password"
              name="password"
              placeholder="Enter password *"
              autoComplete="current-password"
              value={authInfo.password}
              onChange={onChangeInput}
            />
          </div>
          <div>
            <Input
              type="text"
              name="fullname"
              placeholder="Enter fullname"
              autoComplete="name"
              value={authInfo.fullname}
              onChange={onChangeInput}
            />
          </div>
          <div>
            <Input
              type="text"
              name="phone"
              placeholder="Enter phone"
              autoComplete="tel"
              value={authInfo.phone}
              onChange={onChangeInput}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label>Role: </label>
            <Select name="user_type" onChange={onChangeInput}>
              <option value="customer">Customer</option>
              <option value="operator">Operator</option>
              <option value="partner">Partner</option>
            </Select>
          </div>
        </form>
        {authInfo.user_type === "partner" && (
          <div style={{ marginBottom: "10px" }}>
            <div>
              <label>Partner: </label>
              <Select name="partner" onChange={onChangeInput}>
                {!!partners.length &&
                  partners.map((partner: any) => (
                    <option value={partner.id} key={partner.id}>
                      {partner.business_name} - {partner.email}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
        )}
        <div>
          <Flex>
            <Button
              onClick={handleSignIn}
              colorScheme="blue"
              isLoading={loading.isLoginLoading}
              mr={2}
            >
              Sign In
            </Button>
            <Button onClick={handleSignOut} mr={2}>
              Sign Out
            </Button>
            <Spacer />
            <Button
              onClick={handleSignUp}
              isLoading={loading.isSignUpLoading}
              colorScheme="teal"
            >
              Sign Up
            </Button>
          </Flex>
        </div>
        <hr style={{ marginTop: "20px", marginBottom: "20px" }} />
        <div>
          <div>
            <Heading size="xl">Test Function</Heading>
          </div>
          <div style={{ marginBottom: "5px" }}>
            <FormControl>
              <FormLabel>
                <Text as="b"> Function Name</Text>
              </FormLabel>
              <Select name="route_name" onChange={onChangeInput}>
                <option value="order">order</option>
                <option value="customer-account">customer-account</option>
                <option value="partner-order">partner-order</option>
                <option value="operator-setting">operator-setting</option>
                <option value="operator-order">operator-order</option>
                <option value="payment">payment</option>
                <option value="payment-acb">payment-acb</option>
                <option value="payment-vnpay">payment-vnpay</option>
                <option value="ticket">ticket</option>
                <option value="transaction">transaction</option>
                <option value="review">review</option>
                <option value="store-favorite">store-favorite</option>
                <option value="notification">notification</option>
                <option value="partner-store">partner-store</option>
                <option value="customer-store">customer-store</option>
                <option value="customer-retrieve-store">
                  customer-retrieve-store
                </option>
                <option value="customer-point">customer-point</option>
              </Select>
            </FormControl>
            <FormControl mt={3}>
              <FormLabel>
                <Text as="b">X Invoke Function</Text>
              </FormLabel>
              <Select name="function_name" onChange={onChangeInput}>
                <optgroup label="order">
                  <option value="create-order">create-order</option>
                  <option value="create-order-beta">create-order-beta</option>
                  <option value="get-order-detail">get-order-detail</option>
                  <option value="get-history-orders">get-history-orders</option>
                  <option value="update-order-status">
                    update-order-status
                  </option>
                </optgroup>
                <optgroup label="customer-account">
                  <option value="get-profile">get-profile</option>
                  <option value="update-profile">update-profile</option>
                  <option value="create-address">create-address</option>
                  <option value="update-address">update-address</option>
                </optgroup>
                <optgroup label="partner-order">
                  <option value="update-partner-order-status">
                    update-partner-order-status
                  </option>
                  <option value="update-order-request">
                    update-order-request
                  </option>
                  <option value="get-list-order-of-partner">
                    get-list-order-of-partner
                  </option>
                  <option value="get-order-detail-of-partner">
                    get-order-detail-of-partner
                  </option>
                  <option value="get-total-order-by-status">
                    get-total-order-by-status
                  </option>
                </optgroup>
                <optgroup label="operator-order">
                  <option value="update-refund-order">
                    update-refund-order
                  </option>
                </optgroup>
                <optgroup label="operator-setting">
                  <option value="update-payment-method">
                    update-payment-method
                  </option>
                  <option value="get-settings">get-settings</option>
                </optgroup>
                <optgroup label="ticket">
                  <option value="create-ticket">create-ticket</option>
                </optgroup>
                <optgroup label="transaction">
                  <option value="aggregate-transaction">
                    aggregate-transaction
                  </option>
                </optgroup>
                <optgroup label="payment">
                  <option value="create-url-payment">create-url-payment</option>
                  <option value="create-qr-code">create-qr-code</option>
                </optgroup>
                <optgroup label="review">
                  <option value="create-review">create-review</option>
                </optgroup>
                <optgroup label="customer-retrieve-store">
                  <option value="retrieve-store-details">
                    retrieve-store-details
                  </option>
                </optgroup>
                <optgroup label="store-favorite">
                  <option value="add-favorite-store">add-favorite-store</option>
                  <option value="remove-favorite-store">
                    remove-favorite-store
                  </option>
                  <option value="get-favorite-stores">
                    get-favorite-stores
                  </option>
                </optgroup>
                <optgroup label="notification">
                  <option value="mark-notification-as-read">
                    mark-notification-as-read
                  </option>
                  <option value="get-list-notification">
                    get-list-notification
                  </option>
                  <option value="get-total-notification">
                    get-total-notification
                  </option>
                </optgroup>
                <optgroup label="partner-store">
                  <option value="get-earlies-and-latest-store-time">
                    get-earlies-and-latest-store-time
                  </option>
                </optgroup>
                <optgroup label="customer-store">
                  <option value="add-recently-viewed-store">
                    add-recently-viewed-store
                  </option>
                  <option value="get-recently-viewed-stores">
                    get-recently-viewed-stores
                  </option>
                </optgroup>
                <optgroup label="customer-point">
                  <option value="redeem-point">redeem-point</option>
                </optgroup>
                <optgroup label="payment-acb">
                  <option value="get-qr-transactions">
                    get-qr-transactions
                  </option>
                </optgroup>
              </Select>
            </FormControl>
          </div>
          <Tabs>
            <TabList>
              <Tab>Attribute</Tab>
              <Tab>Json</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div>
                  <div id="attribute-container">
                    <FormControl mt={3}>
                      <FormLabel>
                        <Text as="b">Payload</Text>
                      </FormLabel>
                      {attributes.map((attribute, index) => (
                        <div className="attribute-row" key={index}>
                          <Input
                            type="text"
                            name="name"
                            placeholder="Attribute Name"
                            id={`${index}-${attribute.name}-key`}
                            value={attribute.name}
                            onChange={(e) => handleInputChange(index, e)}
                          />
                          <Input
                            type="text"
                            name="value"
                            placeholder="Attribute Value"
                            id={`${index}-${attribute.name}-value`}
                            value={attribute.value}
                            onChange={(e) => handleInputChange(index, e)}
                          />
                          <Button
                            type="button"
                            className="remove-button"
                            colorScheme="red"
                            onClick={() => handleRemoveAttribute(index)}
                          >
                            <DeleteIcon />
                          </Button>
                        </div>
                      ))}
                    </FormControl>
                  </div>
                  <div>
                    <Button
                      type="button"
                      style={{ marginRight: "5px" }}
                      onClick={handleAddAttribute}
                    >
                      Add Attribute
                    </Button>
                    <Input
                      mt={3}
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                    />
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <div>
                  <Text as="b" mb={3}>
                    Payload
                  </Text>
                  <Textarea
                    onChange={(e) => {
                      const value = e.target.value;
                      setJsonPayload(value);
                    }}
                  />
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>

        {qrCode && <img src={qrCode} alt="QR Code" />}
        <pre>{JSON.stringify(objResponse, null, 2)}</pre>
        <p dangerouslySetInnerHTML={{ __html: text }} />

        <hr style={{ marginTop: "10px", marginBottom: "10px" }} />
        <button onClick={handleTestFunction} className="submit-button">
          Invoke Function
        </button>

        <hr style={{ marginTop: "20px", marginBottom: "20px" }} />

        <div>
          <Heading size="xl">Shopping cart</Heading>
        </div>

        <Box mb={3}>
          <FormLabel>Partner: </FormLabel>
          <Select name="partner_id" onChange={changeOrderContext}>
            {!!partners.length &&
              partners.map((partner: any) => (
                <option value={partner.id} key={partner.id}>
                  {partner.business_name} - {partner.email}
                </option>
              ))}
          </Select>
        </Box>
        <Box mb={3}>
          <FormLabel>Store: </FormLabel>
          <Select name="store_id" onChange={changeOrderContext}>
            {!!stores.length &&
              stores.map((store: any) => (
                <option value={store.id} key={store.id}>
                  {store.store_name} - {store.email}
                </option>
              ))}
          </Select>
        </Box>

        <hr style={{ marginTop: "10px", marginBottom: "10px" }} />

        <ListItems supabase={supabase} />
        <Button w="100%" colorScheme="teal" onClick={onOpen}>
          Shopping Cart
        </Button>
        <hr style={{ marginTop: "20px", marginBottom: "20px" }} />

        {/* <div> */}
        {/*   <Heading size="xl">Multiple Shopping cart</Heading> */}
        {/* </div> */}
        {/**/}
        {/* <Box height="500px" border="1px solid black" p={5} overflowY="scroll"> */}
        {/*   <Wrap spacing="30px"> */}
        {/*     <WrapItem> */}
        {/*       <Box h="80px" lineHeight={9}> */}
        {/*         {!!partners.length && */}
        {/*           partners.map((partner) => ( */}
        {/*             <Checkbox */}
        {/*               key={partner.id} */}
        {/*               value={partner.id} */}
        {/*               mr={5} */}
        {/*               onChange={changePartnerIds} */}
        {/*             > */}
        {/*               {partner.business_name} - {partner.email} */}
        {/*             </Checkbox> */}
        {/*           ))} */}
        {/*       </Box> */}
        {/*     </WrapItem> */}
        {/*   </Wrap> */}
        {/* </Box> */}
        {/**/}
        {/* <Button */}
        {/*   w="100%" */}
        {/*   mt={3} */}
        {/*   colorScheme="blue" */}
        {/*   isLoading={loading.isCreateOrderLoading} */}
        {/*   onClick={executeCreateMultipleOrder} */}
        {/* > */}
        {/*   Execute */}
        {/* </Button> */}

        <ShoppingCart supabase={supabase} isOpen={isOpen} onClose={onClose} />
      </div>

      <ModalLoading
        isOpen={isOpenProgressModal}
        onClose={onCloseProgressModal}
        isDone={paymentResponse.isDonePayment}
        status={paymentResponse.status}
      />
    </>
  );
};

export default SupabaseTools;
