import React, { FC, useContext, useEffect, useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Stack,
  Box,
  Button,
  useToast,
  Heading,
  Text,
  Flex,
  Spacer,
  Divider,
  RadioGroup,
  Radio,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { v4 as uuidv4 } from "uuid";
import { fetchSession } from "../helpers";
import { OrderContext } from "../contexts/OrderContext";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionRegion,
} from "@supabase/supabase-js";

interface Props {
  supabase: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingCart: FC<Props> = ({ isOpen, onClose, supabase }) => {
  const [sessionId, setSessionId] = useState("");
  const [shoppingSessions, setShoppingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const firstField = React.useRef(null);
  const toast = useToast();

  const { orderContext, setOrderContext } = useContext(OrderContext);

  useEffect(() => {
    const fetchShoppingCart = async () => {
      const { data: userSession, error } = await fetchSession(supabase);
      if (!userSession || error) {
        return notify({
          status: "error",
          description: "User session not found",
        });
      }

      const user = userSession.user;

      const { data: sessions, error: sessionError } = await supabase
        .from("shopping_sessions")
        .select("*, stores:store_id!inner(store_name, id)")
        .eq("customer_id", user.id);

      if (sessionError) {
        return notify({
          status: "info",
          description: "No shopping session found",
        });
      }

      const cartsAsync = sessions.map(async (session: any) => {
        const { data: cartItems } = await supabase
          .from("cart_items")
          .select("*, items!inner(name, base_price)")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true });

        return { session, cartItems };
      });

      const carts: any = await Promise.all(cartsAsync);

      setShoppingSessions(carts);
    };

    fetchShoppingCart();
  }, [orderContext.refresh]);

  const submitCart = async () => {
    if (!sessionId)
      return notify({
        status: "warning",
        description: "Please select session",
      });

    try {
      setIsLoading(true);

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
        vat_info: {
          name: "M2 Tech",
          email: "m2tech@vn.com",
          tax_code: "1111111111",
          address: "111 Điện biên phủ",
          is_default: true,
        },
        // voucher_ids: [
        //   "db724b2a-bc40-44b2-b534-399ffe54f6db",
        //   "511c92d5-1e61-4e0b-bce0-064a8d9bbeff",
        // ],
      };

      const session = await fetchSession(supabase);
      console.log({ session });

      // await fetch(`https://temporal-worker-6e2u5rezaa-as.a.run.app/orders`, {
      //   method: "POST",
      //   body: JSON.stringify(payload),
      //   headers: {
      //     "Content-Type": "application/json",
      //     "X-Supabase-JWT": `Bearer ${session.data.access_token}`,
      //   },
      // }).catch((error) => console.error(error));
      // return;

      const { data, error } = await supabase.functions.invoke("order", {
        headers: {
          "x-invoke-func": "create-order",
          "x-region": FunctionRegion.ApSoutheast1,
        },
        body: {
          payload,
        },
      });
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

      const response = data?.data;

      if (response.orderId) {
        setOrderContext((curr: any) => ({
          ...curr,
          order_id: response.orderId,
        }));
      }

      if (response.redirectUrl) {
        setOrderContext((curr: any) => ({
          ...curr,
          tx_id: response.txId,
          order_id: response.orderId,
        }));

        const redirectTo = response.redirectUrl || "/";
        window.open(redirectTo, "_blank");
      }

      notify({
        status: "success",
        description: "Order created",
        position: "top",
      });
    } catch (error) {
      notify({ status: "error", description: error.message });
    } finally {
      setIsLoading(false);
    }

    onClose();
  };

  const deleteSession = async (sessionId: string) => {
    await Promise.all([
      supabase.from("shopping_sessions").delete().eq("id", sessionId),
      supabase.from("cart_items").delete().eq("session_id", sessionId),
    ]);
    setOrderContext((prev: any) => ({ ...prev, refresh: uuidv4() }));
    notify({
      status: "success",
      description: "Remove shopping session success!",
      position: "top",
    });
  };

  const deleteCartItem = async (id: string, sessionId: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    const total = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (!total.count) {
      await supabase.from("shopping_sessions").delete().eq("id", sessionId);
    }

    setOrderContext((prev: any) => ({ ...prev, refresh: uuidv4() }));
    notify({
      status: "success",
      description: "Item removed from cart",
      position: "top",
    });
  };

  const onChangeSessionInput = (e: any) => setSessionId(e.target.value);

  const notify = (props: any) => {
    return toast({
      isClosable: true,
      position: "top-right",
      ...props,
    });
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        placement="right"
        initialFocusRef={firstField}
        onClose={onClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Shopping Cart</DrawerHeader>

          <DrawerBody>
            <RadioGroup name="session_id">
              <Stack spacing="24px" mt={3}>
                {!!shoppingSessions.length &&
                  shoppingSessions.map(({ session, cartItems }: any) => (
                    <Box key={session.id}>
                      <Heading size="md" textTransform="uppercase" mb={3}>
                        <Flex>
                          <Radio
                            colorScheme="teal"
                            value={session.id}
                            onChange={onChangeSessionInput}
                          >
                            {session.stores?.store_name}
                          </Radio>
                          <Spacer />
                          <Button
                            size="sm"
                            colorScheme="red"
                            type="button"
                            className="remove-button"
                            onClick={() => deleteSession(session.id)}
                          >
                            <DeleteIcon />
                          </Button>
                        </Flex>
                      </Heading>
                      <Text fontSize="xs">{session.id}</Text>
                      <Divider mb={3} mt={3} />
                      {!!cartItems.length &&
                        cartItems.map((item: any) => (
                          <Box key={item.id}>
                            <Heading size="xs" textTransform="uppercase">
                              {item.items?.name}
                            </Heading>
                            <Flex>
                              <Text pt="2" fontSize="sm">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(item.items?.base_price)}{" "}
                                x {item.quantity}
                              </Text>
                              <Spacer />
                              <Button
                                type="button"
                                className="remove-button"
                                onClick={() =>
                                  deleteCartItem(item.id, session.id)
                                }
                              >
                                <DeleteIcon />
                              </Button>
                            </Flex>
                          </Box>
                        ))}
                    </Box>
                  ))}
              </Stack>
            </RadioGroup>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={submitCart}
              disabled={!!sessionId}
              isLoading={isLoading}
            >
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
