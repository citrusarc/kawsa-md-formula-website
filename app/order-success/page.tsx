"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/store/Cart";
import { useCheckout } from "@/components/store/Checkout";
import { OrderSuccessBody } from "@/types";
import { spectral } from "@/config/font";

export default function OrderSuccessPage() {
  const hasCleared = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const clearCart = useCart((state) => state.clearCart);
  const clearCheckout = useCheckout((state) => state.clearCheckout);
  const [order, setOrder] = useState<OrderSuccessBody | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderNumber = localStorage.getItem("lastOrderNumber");
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `/api/get-orders?orderNumber=${orderNumber}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }
          return;
        }

        const data = await response.json();
        setOrder(data);

        const doneStatuses = [
          "payment_confirmed",
          "easyparcel_order_created",
          "awb_generated",
          "email_sent",
        ];
        if (doneStatuses.includes(data.orderWorkflowStatus) || data.awbNumber) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    intervalRef.current = window.setInterval(fetchOrder, 5000);
    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasCleared.current && order) {
      clearCart();
      clearCheckout();
      hasCleared.current = true;
    }
  }, [order, clearCart, clearCheckout]);

  if (loading) {
    return <div className="p-8">Loading your order…</div>;
  }

  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 text-black">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        Order Placed Successfully!
      </h2>
      {order ? (
        <>
          <p>
            We have received your order{" "}
            <span className="font-semibold">{order.orderNumber}</span> <br />
            Please check your email for details.
          </p>
          <div className="space-y-4 sm:space-y-8">
            <h2 className="text-xl font-semibold text-violet-600">
              Order Summary
            </h2>
            <div className="flex flex-col gap-4 sm:gap-8">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="relative shrink-0 w-32 h-32 rounded-xl sm:rounded-2xl overflow-hidden">
                    <Image
                      fill
                      src={item.itemSrc}
                      alt={item.itemName}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="line-clamp-2 wrap-break-words font-semibold">
                      {item.itemName}
                    </p>
                    <p className="text-neutral-400">
                      Quantity: {item.itemQuantity}
                    </p>
                    <p className="text-violet-600 font-semibold">
                      RM{Number(item.itemTotalPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              <div>
                <p className="text-neutral-400">
                  Sub Total: RM{Number(order.subTotalPrice).toFixed(2)}
                </p>
                <p className="text-neutral-400">
                  Shipping Fee: RM{Number(order.shippingFee).toFixed(2)}
                </p>
                <p className="mt-4 sm:mt-8 text-xl font-semibold">
                  Total: RM{Number(order.totalPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>
          Your order has been confirmed. Please check your email for details.
        </p>
      )}
    </section>
  );
}
