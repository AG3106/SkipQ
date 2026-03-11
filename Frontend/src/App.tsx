import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import TrackOrderSidebar from './components/TrackOrderSidebar';

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <RouterProvider router={router} />
        <TrackOrderSidebar />
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;