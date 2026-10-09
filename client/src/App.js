import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DonatePage from "./pages/DonatePage";
import PaymentPage from "./pages/PaymentPage";
import ProtectedRoute from "./components/Dashboard/ProtectedRoute";
import Account from "./pages/Account";
import DonorPage from "./pages/DonorPage";
import Discover from "./pages/Discover";
import HowToUse from "./pages/HowToUse";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";
import Widget from "./pages/WidgetPage";
import OverlayAlertPage from "./pages/OverlayAlertPage";
import OverlayGoalPage from "./pages/OverlayGoalPage";
import OverlayLeaderboardPage from "./pages/OverlayLeaderboardPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/how-it-works" element={<HowToUse />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donate-page"
          element={
            <ProtectedRoute>
              <DonatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/widget"
          element={
            <ProtectedRoute>
              <Widget />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="/donor/:username" element={<DonorPage />} />
        <Route path="/:username" element={<DonorPage />} />
        <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        <Route path="/overlay/alert" element={<OverlayAlertPage />} />
        <Route path="/overlay/goal/:token" element={<OverlayGoalPage />} />
        <Route path="/overlay/goal" element={<OverlayGoalPage />} />
        <Route
          path="/overlay/leaderboard/:token"
          element={<OverlayLeaderboardPage />}
        />
        <Route
          path="/overlay/leaderboard"
          element={<OverlayLeaderboardPage />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
