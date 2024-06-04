import React, { FC, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  FormLabel,
  Heading,
  Image,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import { fetchSession } from "../helpers";
import { OrderContext } from "../contexts/OrderContext";

interface Props {
  supabase: any;
}

export const ListItems: FC<Props> = ({ supabase }) => {
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [items, setItems] = useState([]);
  const toast = useToast();

  const { orderContext, setOrderContext } = useContext(OrderContext);

  useEffect(() => {
    if (!orderContext.store_id) return;

    const fetchItems = async () => {
      setIsLoadingItem(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("store_id", orderContext.store_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        notify({ status: "error", description: error.message });
      } else {
        setItems(data);
      }
      setIsLoadingItem(false);
    };
    fetchItems();
  }, [orderContext.store_id]);

  const notify = (props: any) => {
    return toast({
      ...props,
      isClosable: true,
      position: "top-right",
    });
  };

  return (
    <>
      <Skeleton isLoaded={!isLoadingItem}>
        <SimpleGrid minChildWidth="220px" spacing="40px">
          {!!items.length &&
            items.map((item: any) => (
              <Item
                key={item.id}
                store_id={orderContext.store_id}
                supabase={supabase}
                setOrderContext={setOrderContext}
                notify={notify}
                toast={toast}
                {...item}
              />
            ))}
        </SimpleGrid>
      </Skeleton>
    </>
  );
};

const Item: FC = ({
  id,
  base_price,
  name,
  description,
  options_and_choices,
  store_id,
  notify,
  toast,
  supabase,
  setOrderContext,
}: any) => {
  const addProductToCart = async () => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const { data: userSession, error } = await fetchSession(supabase);

        if (!userSession || error) {
          notify({ status: "error", description: JSON.stringify(error) });
          return reject(error);
        }

        const user = userSession.user;
        let sessionId = null;

        const session = await supabase
          .from("shopping_sessions")
          .select("*")
          .eq("customer_id", user.id)
          .eq("store_id", store_id)
          .single();

        if (!session.data || session.error) {
          const newSession = await supabase
            .from("shopping_sessions")
            .insert({
              store_id,
              customer_id: user.id,
            })
            .select("id")
            .single();

          sessionId = newSession.data?.id;
        } else {
          sessionId = session.data.id;
        }

        const newCartItem = await supabase.from("cart_items").insert({
          session_id: sessionId,
          item_id: id,
          quantity: getRandomInt(1, 5),
          notes: description,
          raw_options_choices: options_and_choices,
        });

        if (newCartItem.error) {
          notify({
            status: "error",
            description: JSON.stringify(newCartItem.error),
          });
          return reject(newCartItem.error);
        }

        resolve("Looks great");
        setOrderContext((prev: any) => ({ ...prev, refresh: uuidv4() }));
      } catch (error) {
        console.log({ error });
        return reject(error.message);
      }
    });

    toast.promise(promise, {
      success: { title: "Added to cart", description: "Looks great" },
      error: { title: "Failed add to cart", description: "Something wrong" },
      loading: { title: "Adding to cart...", description: "Please wait" },
    });
  };

  return (
    <Card maxW="sm" mb={5}>
      <CardBody>
        <Image
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
          alt="Green double couch with wooden legs"
          borderRadius="lg"
        />
        <Stack mt="6" spacing="3">
          <Heading size="md">{name}</Heading>
          <Text>{description}</Text>
          <Text color="blue.600" fontSize="2xl">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(base_price)}
          </Text>
        </Stack>
      </CardBody>
      <Divider />
      <CardFooter>
        <Button variant="solid" colorScheme="blue" onClick={addProductToCart}>
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
};

function getRandomInt(min: number, max: number) {
  // Đảm bảo rằng giá trị min và max được bao gồm
  min = Math.ceil(min);
  max = Math.floor(max);
  // Sinh ra số ngẫu nhiên trong khoảng từ min (bao gồm) đến max (bao gồm)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
