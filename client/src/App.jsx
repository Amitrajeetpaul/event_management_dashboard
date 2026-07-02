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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/discover" element={<Discovery />} />
      <Route path="/events/:slug" element={<EventDetails />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/organizer" element={<Dashboard />} />
      <Route path="/organizer/create" element={<CreateEvent />} />
      <Route path="/organizer/analytics" element={<Analytics />} />
      <Route path="/organizer/attendees" element={<Attendees />} />
      <Route path="/door" element={<Scanner />} />
    </Routes>
  );
}
