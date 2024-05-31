import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import { OrderProvider } from "./contexts/OrderContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <OrderProvider>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </OrderProvider>,
);
