import { RouterProvider } from "react-router";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WalletProvider } from "./context/WalletContext";
import { Toaster } from "sonner@2.0.3";

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;