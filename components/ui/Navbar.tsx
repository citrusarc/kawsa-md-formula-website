"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, Xmark, ShoppingBag, Trash } from "iconoir-react";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { useCheckout } from "@/components/store/Checkout";
import BrandLogo from "@/components/icons/BrandLogo";
import { useCart } from "@/components/store/Cart";
import { Stepper } from "@/components/ui/Stepper";

export default function Navbar() {
  const pathname = usePathname();
  // const [scroll, setScroll] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const cartCount = useCart((state) => state.cartCount);
  const cartItems = useCart((state) => state.items);
  const totalCart = useCart((state) =>
    state.items.reduce(
      (sum, item) =>
        sum + (item.currentPrice ?? item.unitPrice) * item.quantity,
      0,
    ),
  );
  const [mounted, setMounted] = useState(false);
  const startSwipe = useCart((s) => s.startSwipe);
  const moveSwipe = useCart((s) => s.moveSwipe);
  const endSwipe = useCart((s) => s.endSwipe);
  const resetSwipe = useCart((s) => s.resetSwipe);

  const navItems = siteConfig.navItems.filter((item) => !item.status?.isHidden);
  const isHome = pathname === "/";
  const isWhatCustomersSay = pathname === "/what-customers-say";

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setScroll(window.scrollY > 50);
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  useEffect(() => {
    document.body.style.overflow = openMenu || openCart ? "hidden" : "";
  }, [openMenu, openCart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (cartRef.current && !cartRef.current.contains(target)) {
        setOpenCart(false);
        resetSwipe();
      } else {
        const swipeable = (target as HTMLElement).closest("[data-swipe-item]");
        if (!swipeable) resetSwipe();
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenu(false);
      }
    };

    const opts = { capture: true, passive: false };
    document.addEventListener("mousedown", handleClickOutside, opts);
    document.addEventListener("touchstart", handleClickOutside, opts);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, opts);
      document.removeEventListener("touchstart", handleClickOutside, opts);
    };
  }, [resetSwipe]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <nav
        aria-label="Main navigation"
        className={clsx(
          "relative flex p-4 sm:py-4 sm:px-24 w-full items-center justify-between transition-colors duration-300",
          // openMenu
          //   ? "text-black bg-white"
          // : scroll
          // ? "text-white bg-violet-600"
          !(isHome || isWhatCustomersSay)
            ? "text-black bg-white"
            : "text-white bg-transparent",
        )}
      >
        <button
          onClick={() => {
            setOpenMenu(!openMenu);
            setOpenCart(false);
          }}
          className="cursor-pointer"
        >
          {openMenu ? (
            <Xmark className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <Link href="/" className="cursor-pointer">
          <BrandLogo className="w-16 sm:w-24 h-8 sm:h-12" />
        </Link>
        <button
          onClick={() => {
            setOpenCart(!openCart);
            setOpenMenu(false);
            resetSwipe();
          }}
          className="relative cursor-pointer"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-2 -right-3  px-2 py-0.5 text-sm rounded-full text-white bg-violet-600 ">
            {mounted ? cartCount : 0}
          </span>
        </button>
        {openMenu && (
          <div
            ref={menuRef}
            className={clsx(
              "absolute top-full left-1/2 -translate-x-1/2 p-4 w-[94vw] max-w-[2400px] h-fit shadow-md rounded-2xl sm:rounded-4xl overflow-hidden backdrop-blur-2xl text-black bg-violet-100/80 transform transition-all duration-300 origin-top",
              openMenu
                ? "opacity-100 scale-y-100 pointer-events-auto"
                : "opacity-0 scale-y-0 pointer-events-none",
            )}
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpenMenu(false)}
                  className="p-4 w-fit rounded-2xl overflow-hidden text-xl hover:text-white hover:bg-violet-600"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {mounted && openCart && (
          <div
            ref={cartRef}
            className={clsx(
              "absolute top-0 right-0 z-50 p-4 sm:p-8 w-full sm:w-[30vw] h-dvh transform transition-transform duration-300 shadow-md backdrop-blur-2xl text-violet-600 bg-white",
              openCart ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="relative flex flex-col gap-4 sm:gap-8 w-full h-full overflow-hidden">
              <button
                onClick={() => setOpenCart(false)}
                className="absolute top-0 right-0 cursor-pointer"
              >
                <Xmark className="w-6 h-6 text-black" />
              </button>
              <h2 className="text-xl font-semibold">Your Cart</h2>
              {cartItems.length === 0 ? (
                <p className="text-neutral-400">
                  You currently have no items in your cart.
                </p>
              ) : (
                <div className="flex flex-1 flex-col gap-4 sm:gap-8 pb-[calc(env(safe-area-inset-bottom)+12dvh)] overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex relative">
                      <div className="absolute flex sm:hidden inset-y-0 right-0 w-[80px] items-center justify-center">
                        <button
                          className="flex w-full h-full items-center justify-center text-red-100 bg-red-500"
                          onClick={() => useCart.getState().clearItem(item.id)}
                        >
                          <Trash className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="flex w-full items-center justify-between text-black">
                        <div
                          className={clsx(
                            "relative flex z-10 w-full items-start gap-4 bg-white p-2 transition-transform duration-200",
                            item.swiped && "sm:translate-x-0 -translate-x-24",
                          )}
                          data-swipe-item
                          onTouchStart={(e) =>
                            startSwipe(item.id, e.touches[0].clientX)
                          }
                          onTouchMove={(e) =>
                            moveSwipe(item.id, e.touches[0].clientX)
                          }
                          onTouchEnd={() => endSwipe(item.id)}
                        >
                          <div className="relative shrink-0 w-32 h-32 rounded-xl sm:rounded-2xl overflow-hidden">
                            <Image
                              fill
                              src={item.src}
                              alt={item.name}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col gap-2 justify-between w-full">
                            <div>
                              <p className="line-clamp-2 wrap-break-words font-semibold">
                                {item.name}
                              </p>
                              <p className="text-neutral-400">
                                RM
                                {(item.currentPrice ?? item.unitPrice) *
                                  item.quantity}
                              </p>
                            </div>
                            <Stepper
                              value={item.quantity}
                              min={1}
                              onChange={(setNewQuantity) =>
                                useCart
                                  .getState()
                                  .setQuantity(item.id, setNewQuantity)
                              }
                            />
                          </div>
                        </div>
                        <button
                          className="p-3 hidden sm:block shrink-0 cursor-pointer rounded-full text-red-500 hover:bg-red-100"
                          onClick={() => useCart.getState().clearItem(item.id)}
                        >
                          <Trash className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-8 shadow-md border-t border-neutral-200 bg-white">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex gap-2 text-xl text-neutral-500">
                        Total: <span>RM{totalCart.toFixed(2)}</span>
                      </div>
                      <Link
                        href="/checkout"
                        onClick={() => {
                          useCheckout
                            .getState()
                            .setCheckoutData(cartItems, totalCart);
                          setOpenCart(false);
                        }}
                        className="block p-4 rounded-lg overflow-hidden cursor-pointer border border-violet-600 text-white bg-violet-600 hover:text-violet-600 hover:bg-white"
                      >
                        Checkout
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
