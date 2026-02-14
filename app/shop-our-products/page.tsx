"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { StarSolid } from "iconoir-react";

import { spectral } from "@/config/font";
import { ProductsItem } from "@/types";

export default function ShopOurProductsPage() {
  const [products, setProducts] = useState<ProductsItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) =>
        setProducts(
          (data.products || []).filter(
            (item: ProductsItem) =>
              !item.status?.isHidden && !item.status?.isDisabled,
          ),
        ),
      )
      .catch((error) => {});
  }, []);

  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 items-center justify-center text-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        SHOP OUR PRODUCTS
      </h2>
      <p>Shop the routine that works.</p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 w-full">
        {products.map((item) => (
          <Link
            key={item.id}
            href={`/shop-our-products/${item.id}`}
            className="flex flex-col gap-4 items-center text-center rounded-4xl overflow-hidden border border-transparent hover:border-violet-600"
          >
            {item.status?.isPromo && (
              <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-md bg-red-500 text-white">
                SALE
              </span>
            )}
            {item.status?.isBestSeller && (
              <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-md bg-yellow-400 text-black flex items-center gap-1">
                <StarSolid className="w-3 h-3" />
                Best Seller
              </span>
            )}
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
              {item.status?.isPromo &&
              item.variants?.[0]?.options?.[0]?.originalPrice ? (
                <>
                  <span className="line-through text-neutral-400 mr-2">
                    {item.currency}
                    {(item.variants[0].options[0].originalPrice ?? 0).toFixed(
                      2,
                    )}
                  </span>
                  <span className="text-red-500 font-semibold">
                    {item.currency}
                    {(
                      item.variants[0].options[0].currentPrice ??
                      item.variants[0].options[0].unitPrice ??
                      0
                    ).toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  {item.currency}
                  {(item.variants?.[0]?.options?.[0]?.unitPrice ?? 0).toFixed(
                    2,
                  )}
                </>
              )}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
