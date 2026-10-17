'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { productById, type Product } from '@/content/menu';
import { cartReducer, cartTotals, sanitize, type CartLine, type Selections } from '@/lib/cart';
import { CartDrawer } from './cart/CartDrawer';
import { ProductDialog } from './menu/ProductDialog';
import { NavOverlay } from './nav/NavOverlay';
import { Toaster } from './ui/Toaster';

const STORAGE_KEY = 'downtown-cart-v1';
const noopSubscribe = () => () => {};
const lookup = (id: string) => productById.get(id);

interface CartApi {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  lookup: (id: string) => Product | undefined;
  add: (productId: string, quantity: number, selections: Selections, notes?: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  update: (lineId: string, selections: Selections, notes: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
}

export interface ProductRequest {
  productId: string;
  lineId?: string;
  presetAddon?: string;
}

interface UiApi {
  product: ProductRequest | null;
  openProduct: (req: ProductRequest) => void;
  closeProduct: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
  toast: (message: string, action?: { label: string; run: () => void }) => void;
  toastState: { id: number; message: string; action?: { label: string; run: () => void } } | null;
  dismissToast: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const UiContext = createContext<UiApi | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside Providers');
  return ctx;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi outside Providers');
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });
  // False during SSR and the hydration pass, true afterwards.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'hydrate', state: sanitize(JSON.parse(raw), lookup) });
    } catch {
      /* storage unavailable or corrupt: start empty */
    }
  }, []);

  useEffect(() => {
    // Skip the first run so the empty initial state never overwrites a saved cart.
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode: cart still works for this visit */
    }
  }, [state]);

  const totals = useMemo(() => cartTotals(state.lines, lookup), [state.lines]);

  const cart = useMemo<CartApi>(
    () => ({
      lines: state.lines,
      count: totals.count,
      total: totals.total,
      ready,
      lookup,
      add: (productId, quantity, selections, notes) => dispatch({ type: 'add', productId, quantity, selections, notes }),
      setQuantity: (lineId, quantity) => dispatch({ type: 'setQuantity', lineId, quantity }),
      update: (lineId, selections, notes, quantity) => dispatch({ type: 'update', lineId, selections, notes, quantity }),
      remove: (lineId) => dispatch({ type: 'remove', lineId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [state.lines, totals, ready],
  );

  const [product, setProduct] = useState<ProductRequest | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [toastState, setToastState] = useState<UiApi['toastState']>(null);
  const toastId = useRef(0);

  const toast = useCallback<UiApi['toast']>((message, action) => {
    toastId.current += 1;
    setToastState({ id: toastId.current, message, action });
  }, []);

  const ui = useMemo<UiApi>(
    () => ({
      product,
      openProduct: (req) => setProduct(req),
      closeProduct: () => setProduct(null),
      cartOpen,
      setCartOpen,
      navOpen,
      setNavOpen,
      toast,
      toastState,
      dismissToast: () => setToastState(null),
    }),
    [product, cartOpen, navOpen, toast, toastState],
  );

  return (
    <CartContext.Provider value={cart}>
      <UiContext.Provider value={ui}>
        {children}
        <ProductDialog />
        <CartDrawer />
        <NavOverlay />
        <Toaster />
      </UiContext.Provider>
    </CartContext.Provider>
  );
}
