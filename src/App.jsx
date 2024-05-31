import { useState, useEffect, useContext } from "react";
import { createClient, FunctionRegion } from "@supabase/supabase-js";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Spacer,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
// import { jwtDecode } from "jwt-decode";
import { DeleteIcon } from "@chakra-ui/icons";
import { ShoppingCart } from "./cart/ShoppingCart";

import "./App.css";
import { ListItems } from "./cart/ListItems";
import { OrderContext } from "./contexts/OrderContext";

const LOCAL_NON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const REMOTE_NON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YXdxbndybm1mdnN4cnZtcnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUwNTU0MjUsImV4cCI6MjAzMDYzMTQyNX0.vycUFsNit8nqJx4E6M-M_oU6WhLHilEu-BmEb2LU5DQ";

const supabase = createClient(
  // "http://127.0.0.1:54321",
  // LOCAL_NON_KEY,
  "https://api-dev.pito.vn",
  REMOTE_NON_KEY,
);

const payloadTemplates = {
  "create-order": {
    session_id: "d9ec632c-ecc0-4bd4-8e99-43fe171310dd",
    discount_amount: 0,
    shipping_fee: 0,
    receiver_name: "User Test",
    receiver_phone: "+84559932493",
    delivery_address: "112 Điện biên phủ",
    delivery_date: "2024-05-23",
    delivery_time: "16:30:00",
    delivery_later: false,
    payment_method: "vnpay",
    bank_code: "NCB",
    vnpay_callback_url: "http://localhost:5173",
    order_type: "CT",
  },
  "get-order-detail-of-partner": {
    partner_order_id: "d85522e7-7e2b-433b-8772-21e99e214796",
    store_id: "a304a0d4-7f2f-4328-af7d-237540d68fce",
  },
  "get-list-order-of-partner": {
    fromDate: "",
    toDate: "",
    status: "",
    store_id: "a304a0d4-7f2f-4328-af7d-237540d68fce",
  },
};

const App = () => {
  const [qrCode, setQrCode] = useState("");
  const [text, setText] = useState("");
  const [objResponse, setObjResponse] = useState({});
  const [info, setInfo] = useState({
    user: {},
    token: {},
  });
  const [authInfo, setAuthInfo] = useState({
    email: "",
    password: "",
    user_type: "customer",
    partner: "61430bf1-ddee-42e6-9fbe-42c4b9461de9",
    route_name: "order",
    function_name: "create-order",
  });
  const [attributes, setAttributes] = useState([{ name: "", value: "" }]);
  const [partners, setPartners] = useState([]);

  const [searchParams, setSearchParams] = useState("");
  const search = new URLSearchParams(window.location.search);

  const { orderContext } = useContext(OrderContext);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
    const fetchPartner = async () => {
      const { data, error } = await supabase.from("partners").select();

      if (error) {
        setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
      } else {
        setPartners(data);
      }
    };
    fetchPartner();
  }, []);

  useEffect(() => {
    if (!orderContext.tx_id) return;

    const allChanges = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `id=eq.${orderContext.tx_id}`,
        },
        (payload) => {
          console.log({ payload });
          const { id, status } = payload.new;

          if (id === orderContext.tx_id && status === "completed") {
            notify({ title: "Payment Success!!", status: "success" });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(allChanges);
    };
  }, [orderContext.tx_id]);

  // supabase.auth.onAuthStateChange(async (_, session) => {
  //   if (session) {
  //     const jwt = jwtDecode(session.access_token);
  //     console.log({ auth_state_change: jwt, session });
  //
  //     if (!info.user) {
  //       localStorage.setItem("supabase.auth.jwt", JSON.stringify(jwt));
  //     }
  //   }
  // });

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: authInfo.email || "minh.vu@pito.vn",
      password: authInfo.password || "Admin@102",
      options: {
        data: {
          name: "Minh Moment",
          user_type: authInfo.user_type,
          partner_id: authInfo.partner,
        },
      },
    });

    if (data.session) {
      localStorage.setItem("supabase.auth.token", JSON.stringify(data.session));
      localStorage.setItem("supabase.auth.user", JSON.stringify(data.user));

      setAuthInfo((prev) => ({
        ...prev,
        email: "",
        passsword: "",
      }));

      setInfo({
        user: data.user,
        token: data.session,
      });
    }

    if (error) {
      setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
    } else {
      setText("<span style='color: green'>Sign Up Success!!</span>");
    }
  };

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authInfo.email || "minh.vu@pito.vn",
      password: authInfo.password || "Admin@102",
    });

    if (data.session) {
      localStorage.setItem("supabase.auth.token", JSON.stringify(data.session));
      localStorage.setItem("supabase.auth.user", JSON.stringify(data.user));

      setAuthInfo((prev) => ({
        ...prev,
        email: "",
        passsword: "",
      }));
      setInfo({
        user: data.user,
        token: data.session,
      });
    }

    if (error) {
      setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
    } else {
      setText("<span style='color: green'>Sign In Success!</span>");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    localStorage.removeItem("supabase.auth.token");
    localStorage.removeItem("supabase.auth.user");

    setInfo({
      user: "",
      token: "",
    });

    if (error) {
      setText(`<span style='color: red'>${JSON.stringify(error)}</span>`);
    } else {
      setText("<span style='color: green'>Sign Out Success!</span>");
    }
  };

  const handleTestFunction = async () => {
    try {
      const { route_name, function_name } = authInfo;
      const payload = {};

      attributes.map((attr) => {
        payload[attr.name] = attr.value;
      });

      notify({ title: "Fetching...", status: "info" });
      const { data, error } = await supabase.functions.invoke(route_name, {
        region: FunctionRegion.ApSoutheast1,
        headers: {
          "x-invoke-func": function_name,
        },
        body: {
          payload,
        },
      });
      notify({ title: "Fetch Success", status: "success" });

      setObjResponse(data);

      if (error) {
        throw error;
      }

      const response = data.data;

      if (response && response.responseBody) {
        setQrCode(response.responseBody?.qrDataUrl);
      }

      if (response.redirectUrl) {
        setTimeout(() => {
          const redirectTo = response.redirectUrl || "/";
          window.location.href = redirectTo;
        }, 1000);
      }
    } catch (error) {
      notify({ title: error.message, status: "error" });
      setText(`<span style='color: red'>${error.message}</span>`);
    }
  };

  const onChangeInput = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case "function_name": {
        changeFunction(value);
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
      setAttributes(newAttributes);
    } else {
      setAttributes([]);
    }
  };

  const notify = (props) => {
    toast({
      ...props,
      isClosable: true,
      position: "top-right",
    });
  };

  return (
    <>
      <div>
        <p>{searchParams}</p>
        {info.token?.access_token && (
          <p style={{ wordBreak: "break-all" }}>
            Access Token: {info.token?.access_token}
          </p>
        )}
        <pre>{JSON.stringify(info.user, null, 2)}</pre>
        <p dangerouslySetInnerHTML={{ __html: text }} />
        <form>
          <Heading size="xl">Login Form</Heading>
          <div style={{ marginTop: "5px" }}>
            <Input
              type="email"
              name="email"
              placeholder="Enter email"
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
              placeholder="Enter password"
              autoComplete="current-password"
              value={authInfo.password}
              onChange={onChangeInput}
            />
          </div>
          <div>
            <label>Role: </label>
            <Select name="user_type" onChange={onChangeInput}>
              <option value="customer">Customer</option>
              <option value="operator">Operator</option>
              <option value="partner">Partner</option>
            </Select>
          </div>
        </form>
        <div style={{ marginBottom: "5px" }}>
          <div>
            <label>Partner: </label>
            <Select name="partner" onChange={onChangeInput}>
              {!!partners.length &&
                partners.map((partner) => (
                  <option value={partner.id} key={partner.id}>
                    {partner.business_name} - {partner.email}
                  </option>
                ))}
            </Select>
          </div>
        </div>
        <div>
          <Flex>
            <Button onClick={handleSignIn} colorScheme="blue" mr={2}>
              Sign In
            </Button>
            <Button onClick={handleSignOut} mr={2}>
              Sign Out
            </Button>
            <Spacer />
            <Button onClick={handleSignUp} colorScheme="teal">
              Sign Up
            </Button>
          </Flex>
        </div>
        <hr style={{ marginTop: "10px", marginBottom: "10px" }} />
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
                <option value="partner-order">partner-order</option>
                <option value="payment-acb">payment-acb</option>
                <option value="payment-vnpay">payment-vnpay</option>
              </Select>
            </FormControl>
            <FormControl mt={3}>
              <FormLabel>
                <Text as="b">X Invoke Function</Text>
              </FormLabel>
              <Select name="function_name" onChange={onChangeInput}>
                <optgroup label="order">
                  <option value="create-order">create-order</option>
                  <option value="update-order-status">
                    update-order-status
                  </option>
                </optgroup>
                <optgroup label="partner-order">
                  <option value="get-list-order-of-partner">
                    get-list-order-of-partner
                  </option>
                  <option value="get-order-detail-of-partner">
                    get-order-detail-of-partner
                  </option>
                </optgroup>
              </Select>
            </FormControl>
          </div>
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
          </div>
        </div>

        {qrCode && <img src={qrCode} alt="QR Code" />}
        <pre>{JSON.stringify(objResponse, null, 2)}</pre>
        <p dangerouslySetInnerHTML={{ __html: text }} />

        <hr style={{ marginTop: "10px", marginBottom: "10px" }} />
        <button onClick={handleTestFunction} className="submit-button">
          Invoke Function
        </button>

        {/* <div style={{ display: "flex", justifyContent: "center" }}> */}
        {/*   <OrderCard supabase={supabase} /> */}
        {/* </div> */}

        <hr style={{ marginTop: "10px", marginBottom: "10px" }} />
        <ListItems supabase={supabase} />
        <Button w="100%" colorScheme="teal" onClick={onOpen}>
          Shopping Cart
        </Button>
        <ShoppingCart supabase={supabase} isOpen={isOpen} onClose={onClose} />
      </div>
    </>
  );
};

export default App;
