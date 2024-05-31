import React, { createContext, useState } from "react";

const defaultValue = {
  partner_id: "",
  order_id: "",
  tx_id: "",
  refresh: "",
};

export const OrderContext = createContext({
  orderContext: defaultValue,
  setOrderContext: (curr: any) => curr,
});

export const OrderProvider = ({ children }) => {
  const [orderContext, setOrderContext] = useState(defaultValue);

  return (
    <OrderContext.Provider value={{ orderContext, setOrderContext }}>
      {children}
    </OrderContext.Provider>
  );
};
