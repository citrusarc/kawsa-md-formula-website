"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { NavArrowLeft, NavArrowRight } from "iconoir-react/regular";
import { StarSolid } from "iconoir-react";

import { spectral } from "@/config/font";
import { ProductsItem } from "@/types";

export default function ProductsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [products, setProducts] = useState<ProductsItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) =>
        setProducts(
          (data.products || []).filter(
            (item: ProductsItem) =>
              !item.status?.isHidden && !item.status?.isDisabled
          )
        )
      )
      .catch((error) => {
      });
  }, []);

  useEffect(() => {
    const updateItemsToShow = () => {
      const newItemsToShow = window.innerWidth < 640 ? 1 : 4;
      setItemsToShow(newItemsToShow);
      setCurrentIndex((prev) =>
        Math.min(prev, Math.max(0, products.length - newItemsToShow))
      );
    };

    updateItemsToShow();
    window.addEventListener("resize", updateItemsToShow);
    return () => window.removeEventListener("resize", updateItemsToShow);
  }, [products.length]);

  const maxIndex = Math.max(0, products.length - itemsToShow);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const showNavigation = products.length > itemsToShow;

  return (
    <section className="flex flex-col px-4 py-16 sm:p-24 gap-8 sm:gap-16 items-center justify-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        SHINE THROUGH EVERY DAY
      </h2>
      <p>Healthy Skin Makes Every First Impression Count</p>
      <div className="relative flex w-full items-center">
        {showNavigation && (
          <button
            onClick={handlePrev}
            className="flex absolute left-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600"
          >
            <NavArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="w-full overflow-hidden">
          <div
            className={`flex transition-transform duration-500 ${
              itemsToShow === 4 ? "gap-2" : ""
            }`}
            style={{
              transform: `translateX(-${
                currentIndex * (100 / itemsToShow + (itemsToShow === 4 ? 2 : 0))
              }%)`,
            }}
          >
            {products.map((item, index) => {
              const status = item.status || {};
              const option = item.variants[0]?.options[0];
              const isPromo = item.status?.isPromo;
              return (
                <div
                  key={index}
                  className={`flex flex-col shrink-0 items-center text-center`}
                  style={{
                    flex:
                      itemsToShow === 1
                        ? "0 0 100%"
                        : `0 0 ${100 / itemsToShow}%`,
                  }}
                >
                  {status.isPromo && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-md bg-red-500 text-white">
                      SALE
                    </span>
                  )}
                  {status.isBestSeller && (
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-md bg-yellow-400 text-black flex items-center gap-1">
                      <StarSolid className="w-3 h-3" />
                      Best Seller
                    </span>
                  )}
                  <Link
                    key={item.id}
                    href={`/shop-our-products/${item.id}`}
                    className="flex flex-col gap-4 w-full items-center text-center rounded-4xl overflow-hidden border border-transparent hover:border-violet-600"
                  >
                    <div className="relative w-full aspect-square rounded-4xl overflow-hidden">
                      <Image
                        fill
                        src={item.src}
                        alt={item.alt}
                        className="object-cover"
                      />
                    </div>
                    <h2
                      className={`w-80 text-lg sm:text-xl font-semibold ${spectral.className}`}
                    >
                      {item.name}
                    </h2>
                    <p className="text-neutral-500">
                      {isPromo && option?.originalPrice ? (
                        <>
                          <span className="line-through text-neutral-400 mr-2">
                            {item.currency}
                            {(option.originalPrice ?? 0).toFixed(2)}
                          </span>
                          <span className="text-red-500 font-semibold">
                            {item.currency}
                            {(
                              option.currentPrice ??
                              option.unitPrice ??
                              0
                            ).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <>
                          {item.currency}
                          {(option?.unitPrice ?? 0).toFixed(2)}
                        </>
                      )}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        {showNavigation && (
          <button
            onClick={handleNext}
            className="flex absolute right-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600"
          >
            <NavArrowRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </section>
  );
}
