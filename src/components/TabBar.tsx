import React from "react";
import { Tabs, TabList, Tab } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";

const TabBar = () => {
  const location = useLocation();

  return (
    <Tabs
      variant="enclosed"
      index={location.pathname === "/create-vnpay" ? 0 : 1}
      className="bg-white shadow-md overflow-auto"
    >
      <TabList>
        <Tab as={Link} to="/tools">
          Supabase Tools
        </Tab>
        <Tab as={Link} to="/create-vnpay">
          Create Link VNPAY
        </Tab>
      </TabList>
    </Tabs>
  );
};

export default TabBar;
