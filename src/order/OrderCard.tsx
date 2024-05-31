import React, { FC, useState, useEffect, useMemo, useContext } from "react";
import { OrderContext } from "../contexts/OrderContext";

interface Props {
  supabase: any;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const OrderCard: FC<Props> = ({ supabase }) => {
  const [qrcode, setQrcode] = useState<string>("");
  const [orderLines, setOrderLines] = useState<OrderItem[]>([]);

  const { orderContext } = useContext(OrderContext);

  const totalPrice = useMemo(() => {
    if (!orderLines.length) return 0;

    let total = 0;
    orderLines.forEach((orderLine) => {
      total += orderLine.price * orderLine.quantity;
    });
    return total;
  }, [orderLines]);

  useEffect(() => {
    const fetchOrderLines = async () => {
      const { data, error } = await supabase
        .from("orderlines")
        .select("id, quantity, price")
        .eq("order_id", orderContext.order_id)
        .order("created_at", { ascending: false });

      if (error) {
        alert(JSON.stringify(error));
      }

      if (data.length) {
        setOrderLines(data);
      }
    };

    orderContext.order_id && fetchOrderLines();
  }, [orderContext.order_id, orderContext.refresh]);

  const handleCheckout = async () => {
    const { data, error } = await supabase.functions.invoke("order", {
      headers: {
        "x-invoke-func": "create-order",
      },
      body: {
        payload: {
          // remote:
          session_id: "cf7feaf7-e42d-4a46-8330-7985d202d04f",
          // local:
          // session_id: "51d8e74e-70c3-4e46-8679-d0729b683199",
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
      },
    });
    const response = data.data;

    console.log({ data, error, response });

    if (response && response.responseBody) {
      setQrcode(response.responseBody?.qrDataUrl);
    }

    if (!error && response.redirectUrl) {
      setTimeout(() => {
        const redirectTo = response.redirectUrl || "/";
        window.location.href = redirectTo;
      }, 1000);
    }
  };

  return (
    <div>
      <h1>Order card</h1>
      <div>
        {!!orderLines.length &&
          orderLines.map((item) => (
            <div key={item.id}>
              <p>Name: {item.name}</p>
              <p>Price: {item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Total: {item.price * item.quantity}</p>
              <hr />
            </div>
          ))}
      </div>
      <div>
        <h2>Total price: {totalPrice}</h2>
        {qrcode && <img src={qrcode} alt="qrcode" />}
        <button onClick={handleCheckout}>Submit</button>
      </div>
    </div>
  );
};
