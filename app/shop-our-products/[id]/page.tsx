"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { NavArrowLeft, NavArrowRight, StarSolid } from "iconoir-react";
import { spectral } from "@/config/font";
import {
  ProductsItem,
  ProductVariant,
  VariantOption,
  ProductDetailsProps,
  ProductDetailsItem,
} from "@/types";
import { useCart } from "@/components/store/Cart";
import { useCheckout } from "@/components/store/Checkout";
import { Stepper } from "@/components/ui/Stepper";
import { Toast } from "@/components/ui/Toast";

export default function ProductDetailsPage({ params }: ProductDetailsProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductsItem | null>(null);
  const [products, setProducts] = useState<ProductsItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<VariantOption | null>(
    null
  );

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch product`);
        }

        const data: ProductDetailsItem = await response.json();
        const { product: prod, otherProducts } = data;

        if (prod) {
          const transformedProduct: ProductsItem = {
            id: prod.id,
            src: prod.src,
            alt: prod.alt,
            name: prod.name,
            description: Array.isArray(prod.description)
              ? prod.description
              : JSON.parse(prod.description || "[]"),
            additionalInfo1: Array.isArray(prod.additionalInfo1)
              ? prod.additionalInfo1
              : JSON.parse(prod.additionalInfo1 || "[]"),
            additionalInfo2: Array.isArray(prod.additionalInfo2)
              ? prod.additionalInfo2
              : JSON.parse(prod.additionalInfo2 || "[]"),
            currency: prod.currency,
            status: prod.status,
            variants: prod.product_variants.map(
              (variant): ProductVariant => ({
                id: variant.id,
                variantName: variant.variantName,
                options: variant.variant_options.map(
                  (option): VariantOption => ({
                    id: option.id,
                    optionName: option.optionName,
                    weight: option.weight,
                    width: option.width,
                    height: option.height,
                    length: option.length,
                    currency: option.currency,
                    unitPrice: option.unitPrice,
                    originalPrice: option.originalPrice,
                    currentPrice: option.currentPrice,
                  })
                ),
              })
            ),
          };
          setProduct(transformedProduct);
          setSelectedOption(transformedProduct.variants[0]?.options[0] || null);
        }

        setProducts(
          (otherProducts || [])
            .filter(
              (item) => !item.status?.isHidden && !item.status?.isDisabled
            )
            .map(
              (item): ProductsItem => ({
                id: item.id,
                src: item.src,
                alt: item.alt,
                name: item.name,
                description: Array.isArray(item.description)
                  ? item.description
                  : JSON.parse(item.description || "[]"),
                additionalInfo1: Array.isArray(item.additionalInfo1)
                  ? item.additionalInfo1
                  : JSON.parse(item.additionalInfo1 || "[]"),
                additionalInfo2: Array.isArray(item.additionalInfo2)
                  ? item.additionalInfo2
                  : JSON.parse(item.additionalInfo2 || "[]"),
                currency: item.currency,
                status: item.status,
                variants: item.product_variants.map(
                  (variant): ProductVariant => ({
                    id: variant.id,
                    variantName: variant.variantName,
                    options: variant.variant_options.map(
                      (option): VariantOption => ({
                        id: option.id,
                        optionName: option.optionName,
                        weight: option.weight,
                        width: option.width,
                        height: option.height,
                        length: option.length,
                        currency: option.currency,
                        unitPrice: option.unitPrice,
                        originalPrice: option.originalPrice,
                        currentPrice: option.currentPrice,
                      })
                    ),
                  })
                ),
              })
            )
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An error occurred while fetching products.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const updateItemsToShow = () => {
      setItemsToShow(window.innerWidth < 640 ? 1 : 4);
      setCurrentIndex(0);
    };
    updateItemsToShow();
    window.addEventListener("resize", updateItemsToShow);
    return () => window.removeEventListener("resize", updateItemsToShow);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? products.length - itemsToShow : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= products.length - itemsToShow ? 0 : prev + 1
    );
  };

  const handleOptionSelect = (option: VariantOption) => {
    setSelectedOption(option);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!product)
    return <div className="p-8 text-center">Product not found.</div>;

  return (
    <section className="flex flex-col gap-8 p-4 sm:p-24 items-start justify-center">
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 w-full">
        <div className="relative w-full sm:w-1/2 max-w-2xl aspect-square rounded-4xl overflow-hidden">
          <Image
            fill
            src={product.src}
            alt={product.alt}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-8 sm:gap-16 w-full sm:w-1/2 text-md sm:text-lg">
          <div className="flex gap-2">
            {product.status?.isPromo && (
              <span className="px-2 py-1 text-xs font-semibold rounded-md bg-red-500 text-white">
                SALE
              </span>
            )}
            {product.status?.isBestSeller && (
              <span className="px-2 py-1 text-xs font-semibold rounded-md bg-yellow-400 text-black flex items-center gap-1">
                <StarSolid className="w-3 h-3" />
                Best Seller
              </span>
            )}
          </div>
          <h2
            className={`text-4xl sm:text-6xl ${spectral.className} text-black`}
          >
            {product.name}
          </h2>
          <div className="flex flex-col gap-8">
            {product.description?.map((paragraph: string, index: number) => (
              <p key={index} className="text-neutral-500">
                {paragraph}
              </p>
            ))}
          </div>
          {product.variants[0]?.options?.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg">{product.variants[0].variantName}</h2>
              <div className="flex flex-wrap gap-2">
                {product.variants[0].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option)}
                    className={`px-4 py-2 border ${
                      selectedOption?.id === option.id
                        ? "rounded-lg overflow-hidden text-white border-violet-600 bg-violet-600"
                        : "rounded-lg overflow-hidden text-violet-600 hover:text-white border-violet-600 bg-white hover:bg-violet-600"
                    }`}
                  >
                    {option.optionName}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Stepper value={quantity} onChange={(v) => setQuantity(v)} min={1} />
          {selectedOption && (
            <>
              {product.status?.isPromo && selectedOption.originalPrice ? (
                <>
                  <p className="text-2xl sm:text-4xl text-red-500 font-semibold">
                    {product.currency}
                    {selectedOption.currentPrice?.toFixed(2)}
                  </p>
                  <p className="text-neutral-400 line-through text-md">
                    {product.currency}
                    {selectedOption.originalPrice?.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-2xl sm:text-4xl text-black">
                  {product.currency}
                  {(
                    selectedOption.currentPrice ?? selectedOption.unitPrice
                  )?.toFixed(2)}
                </p>
              )}
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => {
                if (!selectedOption) {
                  setErrorMessage("Please select a variant");
                  return;
                }
                try {
                  const pricePerUnit =
                    selectedOption.currentPrice ?? selectedOption.unitPrice;
                  const originalPrice =
                    selectedOption.originalPrice ?? selectedOption.unitPrice;
                  useCart.getState().addItem({
                    id: `${product.id}-${selectedOption.id}`,
                    productId: product.id,
                    variantId: product.variants[0].id,
                    variantOptionId: selectedOption.id,
                    src: product.src,
                    name: product.name + " - " + selectedOption.optionName,
                    weight: selectedOption.weight,
                    width: selectedOption.width,
                    length: selectedOption.length,
                    height: selectedOption.height,
                    unitPrice: selectedOption.unitPrice,
                    originalPrice: originalPrice,
                    currentPrice: selectedOption.currentPrice,
                    subTotalPrice: pricePerUnit * quantity,
                    totalPrice: pricePerUnit * quantity,
                    quantity: quantity,
                  });
                  setSuccessMessage("Added to cart");
                } catch (error) {
                  const errorMessage =
                    "An error occurred while adding products to cart.";
                  setError(errorMessage);
                }
              }}
              className="p-4 w-full rounded-lg overflow-hidden cursor-pointer border text-violet-600 bg-white border-violet-600 hover:text-white hover:bg-violet-600 hover:border-white"
            >
              ADD TO CART
            </button>
            <button
              onClick={() => {
                if (!selectedOption) {
                  setErrorMessage("Please select a variant");
                  return;
                }
                const pricePerUnit =
                  selectedOption.currentPrice ?? selectedOption.unitPrice;
                const originalPrice =
                  selectedOption.originalPrice ?? selectedOption.unitPrice;
                const checkoutItem = {
                  id: `${product.id}-${selectedOption.id}`,
                  productId: product.id,
                  variantId: product.variants[0].id,
                  variantOptionId: selectedOption.id,
                  src: product.src,
                  name: product.name + " - " + selectedOption.optionName,
                  weight: selectedOption.weight,
                  width: selectedOption.width,
                  length: selectedOption.length,
                  height: selectedOption.height,
                  unitPrice: selectedOption.unitPrice,
                  originalPrice: originalPrice,
                  currentPrice: selectedOption.currentPrice,
                  subTotalPrice: pricePerUnit * quantity,
                  totalPrice: pricePerUnit * quantity,
                  quantity: quantity,
                };
                useCheckout
                  .getState()
                  .setCheckoutData([checkoutItem], pricePerUnit * quantity);
                window.location.href = "/checkout";
              }}
              className="p-4 w-full rounded-lg overflow-hidden cursor-pointer border text-white bg-violet-600 hover:text-violet-600 hover:bg-white hover:border-violet-600"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8 sm:gap-16 pt-8 sm:py-24 w-full text-left">
        <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
          INGREDIENTS
        </h2>
        <div className="flex flex-col gap-8">
          {product.additionalInfo1?.map((paragraph: string, index: number) => (
            <p key={index} className="text-neutral-500">
              {paragraph}
            </p>
          ))}
        </div>
        <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
          DIRECTIONS
        </h2>
        <div className="flex flex-col gap-8">
          {product.additionalInfo2?.map((paragraph: string, index: number) => (
            <p key={index} className="text-neutral-500">
              {paragraph}
            </p>
          ))}
        </div>
        <h2 className={`text-4xl sm:text-6xl ${spectral.className} text-black`}>
          YOU MAY ALSO LIKE
        </h2>
        <div className="relative w-full flex items-center">
          <button
            onClick={handlePrev}
            className="flex sm:hidden absolute left-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600"
          >
            <NavArrowLeft className="w-6 h-6 " />
          </button>
          <div className="w-full overflow-hidden ">
            <div
              className={`flex transition-transform duration-500 ${
                itemsToShow === 4 ? "gap-8" : ""
              }`}
              style={{
                transform: `translateX(-${
                  (currentIndex * 100) / itemsToShow
                }%)`,
              }}
            >
              {products.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col shrink-0 gap-4 items-center text-center`}
                  style={{
                    flex:
                      itemsToShow === 1
                        ? "0 0 100%"
                        : `0 0 calc(${100 / itemsToShow}% - ${
                            itemsToShow === 4 ? "2rem" : "0rem"
                          })`,
                  }}
                >
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
                      {item.status?.isPromo &&
                      item.variants?.[0]?.options?.[0]?.originalPrice ? (
                        <>
                          <span className="line-through text-neutral-400 mr-2">
                            {item.currency}
                            {(
                              item.variants[0].options[0].originalPrice ?? 0
                            ).toFixed(2)}
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
                          {(
                            item.variants?.[0]?.options?.[0]?.currentPrice ??
                            item.variants?.[0]?.options?.[0]?.unitPrice ??
                            0
                          ).toFixed(2)}
                        </>
                      )}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="flex sm:hidden absolute right-0 z-10 p-2 rounded-full  shadow text-black hover:text-white bg-white hover:bg-violet-600"
          >
            <NavArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      {successMessage && (
        <div>
          <Toast message={successMessage} type="success" />
        </div>
      )}
      {errorMessage && (
        <div>
          <Toast message={errorMessage} type="error" />
        </div>
      )}
    </section>
  );
}
