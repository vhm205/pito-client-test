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
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { fetchSession } from "../helpers";
import { OrderContext } from "../contexts/OrderContext";

interface Props {
  supabase: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingCart: FC<Props> = ({ isOpen, onClose, supabase }) => {
  const [sessionId, setSessionId] = useState("");
  const [sessionIds, setSessionIds] = useState([]);
  const [shoppingSessions, setShoppingSessions] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const firstField = React.useRef(null);
  const toast = useToast();

  const { setOrderContext } = useContext(OrderContext);

  useEffect(() => {
    const fetchShoppingCart = async () => {
      const { data: userSession, error } = await fetchSession(supabase);
      if (!userSession || error) {
        return notify({ status: "error", description: JSON.stringify(error) });
      }

      const user = userSession.user;

      const { data: sessions, error: sessionError } = await supabase
        .from("shopping_sessions")
        .select("*, stores:store_id!inner(store_name, id)")
        .eq("customer_id", user.id);
      console.log({ sessions });

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
          .eq("session_id", session.id);

        return { session, cartItems };
      });

      const carts: any = await Promise.all(cartsAsync);
      const sessionsIds = carts.map((cart: any) => cart.session.id);
      console.log({ carts });

      setShoppingSessions(carts);
      setSessionId(carts[carts.length - 1]?.session.id);
      setSessionIds(sessionsIds);
    };

    fetchShoppingCart();
  }, []);

  const submitCart = async () => {
    try {
      setIsLoading(true);

      const payload = {
        session_id: sessionId,
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
      };

      const { data, error } = await supabase.functions.invoke("order", {
        headers: {
          "x-invoke-func": "create-order",
        },
        body: {
          payload,
        },
      });

      if (error) throw error;

      notify({ status: "success", description: "Order created" });

      const response = data.data;

      if (response.redirectUrl) {
        const redirectTo = response.redirectUrl || "/";
        window.open(redirectTo, "_blank");

        setOrderContext((curr: any) => ({ ...curr, tx_id: response.txId }));
      }
    } catch (error) {
      notify({ status: "error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCartItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    notify({ status: "success", description: "Item removed from cart" });
  };

  const notify = (props: any) => {
    return toast({
      ...props,
      isClosable: true,
      position: "top-right",
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
            <Stack spacing="24px" mt={3}>
              {!!shoppingSessions.length &&
                shoppingSessions.map(({ session, cartItems }: any) => (
                  <Box key={session.id}>
                    <Heading size="md" textTransform="uppercase">
                      {session.stores?.store_name}
                    </Heading>
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
                              onClick={() => deleteCartItem(item.id)}
                            >
                              <DeleteIcon />
                            </Button>
                          </Flex>
                        </Box>
                      ))}
                  </Box>
                ))}
            </Stack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={submitCart}
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
