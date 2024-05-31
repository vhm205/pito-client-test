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
import { fetchSession } from "../helpers";
import { OrderContext } from "../contexts/OrderContext";

interface Props {
  supabase: any;
}

export const ListItems: FC<Props> = ({ supabase }) => {
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [items, setItems] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stores, setStores] = useState([]);
  const [formData, setFormData] = useState({
    partner_id: "",
    store_id: "",
  });
  const toast = useToast();

  const { setOrderContext } = useContext(OrderContext);

  useEffect(() => {
    if (!formData.store_id) return;

    const fetchItems = async () => {
      setIsLoadingItem(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("store_id", formData.store_id)
        .limit(10);

      if (error) {
        notify({ status: "error", description: error.message });
      } else {
        setItems(data);
      }
      setIsLoadingItem(false);
    };
    fetchItems();
  }, [formData.store_id]);

  useEffect(() => {
    const fetchPartner = async () => {
      const { data, error } = await supabase.from("partners").select();

      if (error) {
        notify({ status: "error", description: JSON.stringify(error) });
      } else {
        setFormData((prev) => ({ ...prev, partner_id: data[0].id }));
        setPartners(data);
      }
    };
    fetchPartner();
  }, []);

  useEffect(() => {
    if (!formData.partner_id) return;

    const fetchStores = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select()
        .eq("partner_id", formData.partner_id);

      if (error) {
        notify({ status: "error", description: JSON.stringify(error) });
      } else {
        setFormData((prev) => ({ ...prev, store_id: data[0].id }));
        setStores(data);
      }
    };
    fetchStores();
  }, [formData.partner_id]);

  const onChangeInput = (e: any) => {
    const { name, value } = e.target;

    if (name === "partner_id") {
      setOrderContext((curr: any) => ({ ...curr, partner_id: value }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
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
      <Box mb={3}>
        <FormLabel>Partner: </FormLabel>
        <Select name="partner_id" onChange={onChangeInput}>
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
        <Select name="store_id" onChange={onChangeInput}>
          {!!stores.length &&
            stores.map((store: any) => (
              <option value={store.id} key={store.id}>
                {store.store_name} - {store.email}
              </option>
            ))}
        </Select>
      </Box>
      <Skeleton isLoaded={!isLoadingItem}>
        <SimpleGrid minChildWidth="220px" spacing="40px">
          {!!items.length &&
            items.map((item: any) => (
              <Item
                key={item.id}
                partner_id={formData.partner_id}
                supabase={supabase}
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
  partner_id,
  notify,
  toast,
  supabase,
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

        // const session = await supabase
        //   .from("shopping_sessions")
        //   .select("*")
        //   .eq("customer_id", user.id)
        //   .single();
        // console.log({ session });
        //
        // if (!session.data || session.error) {
        const store = await supabase
          .from("stores")
          .select("*")
          .eq("partner_id", partner_id)
          .single();

        const newSession = await supabase
          .from("shopping_sessions")
          .insert({
            store_id: store.data?.id,
            customer_id: user.id,
          })
          .select("id")
          .single();

        sessionId = newSession.data?.id;
        // } else {
        //   sessionId = session.data.id;
        // }

        const newCartItem = await supabase.from("cart_items").insert({
          session_id: sessionId,
          item_id: id,
          quantity: getRandomInt(1, 5),
          notes: description,
          raw_options_choices: options_and_choices,
        });
        console.log({ newCartItem });

        if (newCartItem.error) {
          notify({
            status: "error",
            description: JSON.stringify(newCartItem.error),
          });
          return reject(newCartItem.error);
        }

        resolve("Looks great");
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
