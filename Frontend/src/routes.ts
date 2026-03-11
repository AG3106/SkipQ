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
import CanteenOffers from "./pages/CanteenOffers";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: UnifiedLogin,
  },
  {
    path: "/search",
    Component: SearchResults,
  },
  {
    path: "/offers",
    Component: CanteenOffers,
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
]);