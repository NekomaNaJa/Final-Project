import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DonatePage from "./pages/DonatePage";
import HistoryPage from "./pages/HistoryPage";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/donate-page" element={<DonatePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/Histor" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
