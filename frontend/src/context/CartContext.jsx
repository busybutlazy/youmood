import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "youmood_cart";

const CartContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const { product, quantity } = action;
      const existing = state.find((it) => it.product.id === product.id);
      if (existing) {
        return state.map((it) =>
          it.product.id === product.id
            ? { ...it, quantity: it.quantity + quantity }
            : it
        );
      }
      return [...state, { product, quantity }];
    }
    case "REMOVE":
      return state.filter((it) => it.product.id !== action.productId);
    case "UPDATE_QTY": {
      const qty = Math.max(1, action.quantity);
      return state.map((it) =>
        it.product.id === action.productId ? { ...it, quantity: qty } : it
      );
    }
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial);

  // 持久化至 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* 忽略寫入失敗（如隱私模式） */
    }
  }, [items]);

  const value = useMemo(() => {
    const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
    const totalPrice = items.reduce(
      (sum, it) => sum + it.product.price * it.quantity,
      0
    );
    return {
      items,
      addItem: (product, quantity = 1) =>
        dispatch({ type: "ADD", product, quantity }),
      removeItem: (productId) => dispatch({ type: "REMOVE", productId }),
      updateQuantity: (productId, quantity) =>
        dispatch({ type: "UPDATE_QTY", productId, quantity }),
      clearCart: () => dispatch({ type: "CLEAR" }),
      totalItems,
      totalPrice,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart 必須在 CartProvider 內使用");
  return ctx;
}
