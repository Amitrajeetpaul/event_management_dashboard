import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Discovery from "./pages/Discovery.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import Checkout from "./pages/Checkout.jsx";
import Wallet from "./pages/Wallet.jsx";
import Dashboard from "./pages/organizer/Dashboard.jsx";
import CreateEvent from "./pages/organizer/CreateEvent.jsx";
import Analytics from "./pages/organizer/Analytics.jsx";
import Attendees from "./pages/organizer/Attendees.jsx";
import Scanner from "./pages/door/Scanner.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/discover" element={<Discovery />} />
        <Route path="/events/:slug" element={<EventDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/organizer"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/create"
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/attendees"
          element={
            <ProtectedRoute>
              <Attendees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/door"
          element={
            <ProtectedRoute>
              <Scanner />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
