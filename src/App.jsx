import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateVnPayUrl from "./pages/vnpay/CreateVnPayUrl";
import SupabaseTools from "./pages/tools/SupabaseTools";
import TabBar from "./components/TabBar";

const App = () => {
  return (
    <>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <TabBar />
          <div className="container mx-auto mt-4">
            <Routes>
              <Route path="/create-vnpay" element={<CreateVnPayUrl />} />
              <Route path="/tools" element={<SupabaseTools />} />
              <Route path="/" element={<CreateVnPayUrl />} />
            </Routes>
          </div>
        </div>
      </Router>
    </>
  );
};

export default App;
