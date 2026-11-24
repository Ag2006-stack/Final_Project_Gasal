import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cartApi } from '../api/endpoints';
import { useAuth } from './AuthContext';
import { useNetworkStatus } from './NetworkStatusContext';

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  couponCode: null
};

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [cart, setCart] = useState(() => {
    try {
      const cached = localStorage.getItem('cart_cache');
      return cached ? JSON.parse(cached) : EMPTY_CART;
    } catch {
      return EMPTY_CART;
    }
  });
  const [syncing, setSyncing] = useState(false);
  const [cartError, setCartError] = useState(null);

  const persistCache = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem('cart_cache', JSON.stringify(nextCart));
  };

  const refreshCart = useCallback(
    async (signal) => {
      if (!isAuthenticated || !isOnline) return;
      setSyncing(true);
      try {
        const { data } = await cartApi.get(signal);
        persistCache({ ...EMPTY_CART, ...data });
        setCartError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCartError(err.message);
        }
      } finally {
        setSyncing(false);
      }
    },
    [isAuthenticated, isOnline]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      persistCache(EMPTY_CART);
      return;
    }
    const controller = new AbortController();
    refreshCart(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, refreshCart]);

  const addItem = async (product, quantity = 1) => {
    if (!isOnline) throw new Error('Offline: cannot modify bag.');
    const previous = cart;

    const existingIndex = cart.items.findIndex((i) => i.productId === product.id);
    const nextItems = [...cart.items];
    if (existingIndex >= 0) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextItems[existingIndex].quantity + quantity
      };
    } else {
      nextItems.push({
        productId: product.id,
        brand: product.brand,
        name: `${product.brand} ${product.name}`,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity
      });
    }
    persistCache({ ...cart, items: nextItems });

    try {
      const { data } = await cartApi.addItem(product.id, quantity);
      persistCache({ ...EMPTY_CART, ...data });
      setCartError(null);
    } catch (err) {
      persistCache(previous);
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isOnline) throw new Error('Offline: cannot update quantity.');
    const previous = cart;
    const nextItems = cart.items
      .map((item) => (item.productId === productId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    persistCache({ ...cart, items: nextItems });

    try {
      const { data } =
        quantity <= 0
          ? await cartApi.removeItem(productId)
          : await cartApi.updateItem(productId, quantity);
      persistCache({ ...EMPTY_CART, ...data });
    } catch (err) {
      persistCache(previous);
      throw err;
    }
  };

  const applyCoupon = async (code) => {
    const { data } = await cartApi.applyCoupon(code);
    persistCache({ ...EMPTY_CART, ...data });
    return data;
  };

  const itemCount = cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        syncing,
        cartError,
        refreshCart,
        addItem,
        updateQuantity,
        applyCoupon,
        clearLocalCart: () => persistCache(EMPTY_CART)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}