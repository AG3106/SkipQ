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
import DiscountManagement from "./pages/DiscountManagement";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: UnifiedLogin,
  },
  {
    path: "/login",
    Component: UnifiedLogin,
  },
  {
    path: "/search",
    Component: SearchResults,
  },
  {
    path: "/payment-result",
    Component: PaymentResult,
  },
  {
    path: "/wallet",
    Component: WalletPage,
  },
  {
    path: "/wallet/set-pin",
    Component: SetWalletPin,
  },
  {
    path: "/wallet/verify-pin",
    Component: VerifyWalletPin,
  },
  {
    path: "/profile",
    Component: UserProfile,
  },
  {
    path: "/hostels",
    Component: HostelSelection,
  },
  {
    path: "/menu/:hostelId",
    Component: MenuBrowsing,
  },
  {
    path: "/cart",
    Component: Cart,
  },
  {
    path: "/checkout",
    Component: Checkout,
  },
  {
    path: "/order-confirmation/:orderId",
    Component: OrderConfirmation,
  },
  {
    path: "/owner/dashboard",
    Component: OwnerDashboard,
  },
  {
    path: "/owner/account",
    Component: OwnerAccount,
  },
  {
    path: "/owner/menu",
    Component: MenuManagement,
  },
  {
    path: "/owner/discounts",
    Component: DiscountManagement,
  },
  {
    path: "/owner/schedule",
    Component: ScheduleManagement,
  },
  {
    path: "/owner/stats",
    Component: Statistics,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/admin",
    Component: AdminPanel,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/canteen-register",
    Component: CanteenRegistration,
  },
  {
    path: "/owner-register",
    Component: OwnerRegistration,
  },
  {
    path: "/track-orders",
    Component: TrackOrders,
  },
  {
    path: "/cake-reservation",
    Component: CakeReservation,
  },
  {
    path: "/owner/cakes",
    Component: CakeManagement,
  },
]);