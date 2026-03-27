import { createBrowserRouter } from "react-router";
import HostelSelection from "./pages/HostelSelection";
import MenuBrowsing from "./pages/MenuBrowsing";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import UnifiedLogin from "./pages/UnifiedLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerAccount from "./pages/OwnerAccount";
import MenuManagement from "./pages/MenuManagement";
import ScheduleManagement from "./pages/ScheduleManagement";
import Statistics from "./pages/Statistics";
import SearchResults from "./pages/SearchResults";
import PaymentResult from "./pages/PaymentResult";
import WalletPage from "./pages/WalletPage";
import SetWalletPin from "./pages/SetWalletPin";
import VerifyWalletPin from "./pages/VerifyWalletPin";
import UserProfile from "./pages/UserProfile";
import { ForgotPassword } from "./pages/ForgotPassword";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import CanteenRegistration from "./pages/CanteenRegistration";
import OwnerRegistration from "./pages/OwnerRegistration";
import TrackOrders from "./pages/TrackOrders";
import CakeReservation from "./pages/CakeReservation";
import CakeManagement from "./pages/CakeManagement";
import ProtectedRoute from "./components/ProtectedRoute";

function protect(Component: React.ComponentType) {
  return <ProtectedRoute><Component /></ProtectedRoute>;
}

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    Component: UnifiedLogin,
  },
  {
    path: "/login",
    Component: UnifiedLogin,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/owner-register",
    Component: OwnerRegistration,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  // Protected routes
  {
    path: "/search",
    element: protect(SearchResults),
  },
  {
    path: "/payment-result",
    element: protect(PaymentResult),
  },
  {
    path: "/wallet",
    element: protect(WalletPage),
  },
  {
    path: "/wallet/set-pin",
    element: protect(SetWalletPin),
  },
  {
    path: "/wallet/verify-pin",
    element: protect(VerifyWalletPin),
  },
  {
    path: "/profile",
    element: protect(UserProfile),
  },
  {
    path: "/hostels",
    element: protect(HostelSelection),
  },
  {
    path: "/menu/:hostelId",
    element: protect(MenuBrowsing),
  },
  {
    path: "/cart",
    element: protect(Cart),
  },
  {
    path: "/checkout",
    element: protect(Checkout),
  },
  {
    path: "/order-confirmation/:orderId",
    element: protect(OrderConfirmation),
  },
  {
    path: "/owner/dashboard",
    element: protect(OwnerDashboard),
  },
  {
    path: "/owner/account",
    element: protect(OwnerAccount),
  },
  {
    path: "/owner/menu",
    element: protect(MenuManagement),
  },
{
    path: "/owner/schedule",
    element: protect(ScheduleManagement),
  },
  {
    path: "/owner/stats",
    element: protect(Statistics),
  },
  {
    path: "/admin",
    element: protect(AdminPanel),
  },
  {
    path: "/canteen-register",
    element: protect(CanteenRegistration),
  },
  {
    path: "/track-orders",
    element: protect(TrackOrders),
  },
  {
    path: "/cake-reservation",
    element: protect(CakeReservation),
  },
  {
    path: "/owner/cakes",
    element: protect(CakeManagement),
  },
]);
