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
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function protect(Component: any, allowedRoles?: string[]) {
  return <ProtectedRoute allowedRoles={allowedRoles}><Component /></ProtectedRoute>;
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
  // Protected routes — Customer only
  {
    path: "/hostels",
    element: protect(HostelSelection, ["CUSTOMER"]),
  },
  {
    path: "/menu/:hostelId",
    element: protect(MenuBrowsing, ["CUSTOMER"]),
  },
  {
    path: "/cart",
    element: protect(Cart, ["CUSTOMER"]),
  },
  {
    path: "/checkout",
    element: protect(Checkout, ["CUSTOMER"]),
  },
  {
    path: "/order-confirmation/:orderId",
    element: protect(OrderConfirmation, ["CUSTOMER"]),
  },
  {
    path: "/track-orders",
    element: protect(TrackOrders, ["CUSTOMER"]),
  },
  {
    path: "/cake-reservation",
    element: protect(CakeReservation, ["CUSTOMER"]),
  },
  {
    path: "/search",
    element: protect(SearchResults, ["CUSTOMER"]),
  },
  {
    path: "/payment-result",
    element: protect(PaymentResult, ["CUSTOMER"]),
  },
  // Protected routes — Customer & Manager (shared)
  {
    path: "/wallet",
    element: protect(WalletPage, ["CUSTOMER", "MANAGER"]),
  },
  {
    path: "/wallet/set-pin",
    element: protect(SetWalletPin, ["CUSTOMER", "MANAGER"]),
  },
  {
    path: "/wallet/change-pin",
    element: protect(SetWalletPin, ["CUSTOMER", "MANAGER"]),
  },
  {
    path: "/wallet/verify-pin",
    element: protect(VerifyWalletPin, ["CUSTOMER", "MANAGER"]),
  },
  {
    path: "/profile",
    element: protect(UserProfile, ["CUSTOMER", "MANAGER"]),
  },
  // Protected routes — Manager only
  {
    path: "/owner/dashboard",
    element: protect(OwnerDashboard, ["MANAGER"]),
  },
  {
    path: "/owner/account",
    element: protect(OwnerAccount, ["MANAGER"]),
  },
  {
    path: "/owner/menu",
    element: protect(MenuManagement, ["MANAGER"]),
  },
  {
    path: "/owner/schedule",
    element: protect(ScheduleManagement, ["MANAGER"]),
  },
  {
    path: "/owner/stats",
    element: protect(Statistics, ["MANAGER"]),
  },
  {
    path: "/owner/cakes",
    element: protect(CakeManagement, ["MANAGER"]),
  },
  {
    path: "/canteen-register",
    element: protect(CanteenRegistration, ["MANAGER"]),
  },
  // Protected routes — Admin only
  {
    path: "/admin",
    element: protect(AdminPanel, ["ADMIN"]),
  },
  // Catch-all 404
  {
    path: "*",
    Component: NotFound,
  },
]);
