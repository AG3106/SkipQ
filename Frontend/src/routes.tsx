import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { Canteens } from "./pages/Canteens";
import { Menu } from "./pages/Menu";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { Orders } from "./pages/Orders";
import { Profile } from "./pages/Profile";
import { Wallet } from "./pages/Wallet";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { PinSetup } from "./pages/PinSetup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Search } from "./pages/Search";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "canteens", Component: Canteens },
      { path: "menu/:canteenId", Component: Menu },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "order-confirmation/:orderId", Component: OrderConfirmation },
      { path: "orders", Component: Orders },
      { path: "profile", Component: Profile },
      { path: "wallet", Component: Wallet },
      { path: "search", Component: Search },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "pin-setup", Component: PinSetup },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "*", Component: NotFound },
    ],
  },
]);