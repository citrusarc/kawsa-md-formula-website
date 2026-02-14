"use client";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import {
  Suspense,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import ReactCountryFlag from "react-country-flag";
import { Country, State, City, IState, ICity } from "country-state-city";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCheckout } from "@/components/store/Checkout";
import { Modal } from "@/components/ui/Modal";
import { EasyParcelRateItem } from "@/types";

const formSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    countryCode: z.string().min(1, "Select country code"),
    phoneNumber: z.string().min(6, "Enter valid phone number"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional(),
    state: z.string().min(1, "Please select your state"),
    city: z.string().optional(),
    postcode: z
      .string()
      .regex(/^[0-9]+$/, "Postcode must be numeric")
      .length(5, "Postcode must be 5 digits"),
    country: z.string().min(1, "Please select your country"),
  })
  .refine(
    (data) => {
      const countryData = Country.getAllCountries().find(
        (c) => c.name === data.country,
      );
      const stateData = countryData
        ? State.getStatesOfCountry(countryData.isoCode).find(
            (s) => s.name === data.state,
          )
        : null;
      const cities =
        countryData && stateData
          ? City.getCitiesOfState(countryData.isoCode, stateData.isoCode)
          : [];
      return !(cities.length > 0 && !data.city);
    },
    {
      path: ["city"],
      message: "Please select your city",
    },
  );

function CheckoutPageContent() {
  const { items, subTotalPrice, shippingFee, totalPrice, setShippingFee } =
    useCheckout();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = status === "error" || status === "failed";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const rateRequestIdRef = useRef(0);
  const availableRatesRef = useRef<EasyParcelRateItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [country] = useState("Malaysia");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [, setShippingError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      countryCode: "+60",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      state: "",
      city: "",
      postcode: "",
      country: "Malaysia",
    },
  });

  const {
    formState: { errors },
    watch,
    setValue,
  } = form;

  const watchedPostcode = watch("postcode");
  const watchedState = watch("state");
  const watchedCountry = watch("country");

  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const watchedCountryISO = useMemo(() => {
    return allCountries.find((c) => c.name === watchedCountry)?.isoCode || "MY";
  }, [watchedCountry, allCountries]);

  const parcelMetrics = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const qty = Number(item.quantity) || 1;
        const weight = Number(item.weight) || 0;
        const width = Number(item.width) || 0;
        const length = Number(item.length) || 0;
        const height = Number(item.height) || 0;
        return {
          totalWeight: acc.totalWeight + weight * qty,
          totalWidth: Math.max(acc.totalWidth, Math.ceil(width)),
          totalLength: Math.max(acc.totalLength, Math.ceil(length)),
          totalHeight: Math.max(acc.totalHeight, Math.ceil(height)),
        };
      },
      {
        totalWeight: 0,
        totalWidth: 0,
        totalLength: 0,
        totalHeight: 0,
      },
    );
  }, [items]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    setShippingFee(0);
    setSelectedServiceId(null);
  }, [items, setShippingFee]);

  useEffect(() => {
    const countryData = allCountries.find((c) => c.name === country);
    setStates(countryData ? State.getStatesOfCountry(countryData.isoCode) : []);
    setSelectedState("");
    setSelectedCity("");
    setValue("state", "");
    setValue("city", "");
  }, [country, allCountries, setValue]);

  useEffect(() => {
    const countryData = allCountries.find((c) => c.name === country);
    const stateData = states.find((s) => s.name === selectedState);
    if (!countryData || !stateData) {
      setCities([]);
      setValue("city", "");
      return;
    }
    setCities(City.getCitiesOfState(countryData.isoCode, stateData.isoCode));
  }, [country, selectedState, states, allCountries, setValue]);

  useEffect(() => {
    if (error) setErrorMessage("Payment failed. Please try again.");
  }, [error]);

  const calculateEasyParcelShippingRate = useCallback(
    async (sendPostcode: string, sendState: string, sendCountry: string) => {
      const requestId = ++rateRequestIdRef.current;
      setIsCalculating(true);
      setShippingError(null);
      try {
        if (
          !sendState ||
          !sendCountry ||
          !sendPostcode ||
          sendPostcode.length !== 5
        ) {
          setShippingFee(0);
          setSelectedServiceId(null);
          return;
        }
        if (!states.find((s) => s.name === sendState)) {
          setShippingFee(0);
          setSelectedServiceId(null);
          return;
        }
        const { totalWeight, totalWidth, totalLength, totalHeight } =
          parcelMetrics;
        if (totalWeight <= 0) {
          setIsCalculating(false);
          return;
        }
        const body = {
          pickPostcode: "81200",
          pickState: "Johor",
          pickCountry: "MY",
          sendPostcode,
          sendState,
          sendCountry,
          weight: totalWeight,
          width: totalWidth,
          length: totalLength,
          height: totalHeight,
        };
        const response = await fetch("/api/easyparcel/rate-checking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (requestId !== rateRequestIdRef.current) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Rate check failed");
        const rates: EasyParcelRateItem[] = Array.isArray(data?.rates)
          ? data.rates
          : [];
        if (rates.length === 0) {
          setShippingFee(0);
          setSelectedServiceId(null);
          return;
        }
        availableRatesRef.current = rates;

        const cheapestRate = rates[0];
        setSelectedServiceId(cheapestRate.serviceId);
        setShippingFee(
          parseFloat(Number(cheapestRate.shipmentTotalRates).toFixed(2)),
        );
      } catch (err) {
        setShippingError(
          "Unable to calculate shipping. Please check your address.",
        );
      } finally {
        setIsCalculating(false);
      }
    },
    [parcelMetrics, setShippingFee, setSelectedServiceId, states],
  );

  useEffect(() => {
    if (
      !watchedPostcode ||
      !watchedState ||
      !watchedCountryISO ||
      watchedPostcode.length !== 5
    ) {
      setShippingFee(0);
      return;
    }
    const debounceTimer = setTimeout(() => {
      calculateEasyParcelShippingRate(
        watchedPostcode,
        watchedState,
        watchedCountryISO,
      );
    }, 400);
    return () => clearTimeout(debounceTimer);
  }, [
    watchedPostcode,
    watchedState,
    watchedCountryISO,
    calculateEasyParcelShippingRate,
    setShippingFee,
  ]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedServiceId) {
      setErrorMessage(
        "Please select a shipping service before placing your order.",
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedRate = availableRatesRef.current.find(
        (r) => r.serviceId === selectedServiceId,
      );

      const payload = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: `${values.countryCode}${values.phoneNumber}`,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || "",
        city: values.city || "",
        state: values.state,
        postcode: values.postcode,
        country: "MY",
        subTotalPrice,
        shippingFee,
        totalPrice,
        easyparcel: {
          rateId: selectedRate?.rateId || "",
          serviceId: selectedServiceId,
          serviceName: selectedRate?.serviceName || "",
          courierId: selectedRate?.courierId || "",
          courierName: selectedRate?.courierName || "",
        },
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          variantOptionId: item.variantOptionId || null,
          itemSrc: item.src,
          itemName: item.name,
          itemWeight: item.weight,
          itemWidth: item.width,
          itemLength: item.length,
          itemHeight: item.height,
          itemCurrency: "RM",
          itemUnitPrice: item.currentPrice ?? item.unitPrice,
          itemQuantity: item.quantity,
          itemTotalPrice: (item.currentPrice ?? item.unitPrice) * item.quantity,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: string; checkout_url?: string; orderNumber?: string };
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        throw new Error("Server error. Please try again.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Order creation failed");
      }

      if (!data.checkout_url) {
        throw new Error("No checkout URL received");
      }

      localStorage.setItem("lastOrderNumber", data.orderNumber || "");
      window.location.href = data.checkout_url;
      form.reset();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "An error occurred";
      setErrorMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <div className="p-8">Loading your items...</div>;

  return (
    <section className="flex flex-col gap-8 p-4 sm:p-24">
      {items.length === 0 ? (
        <div className="space-y-4 sm:space-y-8">
          <h2 className="text-xl font-semibold text-violet-600">
            Nothing to checkout
          </h2>
          <p className="text-neutral-400">
            Looks like you haven&apos;t added any items to your cart.
          </p>
          <Link
            href="/shop-our-products"
            className="block p-4 w-fit rounded-lg overflow-hidden cursor-pointer border border-violet-600 text-violet-600 bg-white hover:text-white hover:bg-violet-600"
          >
            Explore Our Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 w-full">
          <div className="order-2 sm:order-1 space-y-4 sm:space-y-8">
            <h2 className="text-xl font-semibold text-violet-600">
              Order Summary
            </h2>
            <div className="flex flex-col gap-4 sm:gap-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="relative shrink-0 w-32 h-32 rounded-xl sm:rounded-2xl overflow-hidden">
                    <Image
                      fill
                      src={item.src}
                      alt={item.name}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="line-clamp-2 wrap-break-words font-semibold">
                      {item.name}
                    </p>
                    <p className="text-neutral-400">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-violet-600 font-semibold">
                      RM{(item.currentPrice ?? item.unitPrice) * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
              <div>
                <p className="text-neutral-400">
                  Sub Total: RM{subTotalPrice.toFixed(2)}
                </p>
                <p className="text-neutral-400">
                  Shipping Fee:{" "}
                  {isCalculating
                    ? "Estimating your shipping…"
                    : `RM${shippingFee.toFixed(2)}`}
                </p>
                <p className="mt-4 sm:mt-8 text-xl font-semibold">
                  Total: RM{totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 sm:order-2 p-6 sm:p-8 w-full h-fit rounded-2xl sm:rounded-4xl overflow-hidden shadow-md border border-neutral-200 text-neutral-600 bg-white">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 sm:space-y-8"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel
                        className={`${
                          errors.fullName ? "text-red-600" : "text-neutral-400"
                        }`}
                      >
                        Full Name<span className="-ml-1.5 text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-4">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel
                          className={`${
                            errors.email ? "text-red-600" : "text-neutral-400"
                          }`}
                        >
                          Email<span className="-ml-1.5 text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="example@example.com"
                            className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PhoneNumber */}
                  <div className="space-y-1 flex-1">
                    <h2
                      className={`text-sm font-medium ${
                        errors.countryCode || errors.phoneNumber
                          ? "text-red-600"
                          : "text-neutral-400"
                      }`}
                    >
                      Phone Number<span className="ml-0.5 text-red-400">*</span>
                    </h2>
                    <div className="flex w-full gap-2">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="h-12! rounded-xl sm:rounded-2xl">
                                  <SelectValue placeholder="+60">
                                    {field.value}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  <SelectItem
                                    value="+60"
                                    className="h-12 rounded-xl sm:rounded-2xl"
                                  >
                                    <ReactCountryFlag
                                      countryCode="MY"
                                      svg
                                      style={{ width: "20px", height: "20px" }}
                                    />
                                    <span>Malaysia (+60)</span>
                                  </SelectItem>
                                  <SelectItem
                                    value="+62"
                                    className="h-12 rounded-xl sm:rounded-2xl"
                                  >
                                    <ReactCountryFlag
                                      countryCode="ID"
                                      svg
                                      style={{ width: "20px", height: "20px" }}
                                    />
                                    <span>Indonesia (+62)</span>
                                  </SelectItem>
                                  <SelectItem
                                    value="+65"
                                    className="h-12 rounded-xl sm:rounded-2xl"
                                  >
                                    <ReactCountryFlag
                                      countryCode="SG"
                                      svg
                                      style={{ width: "20px", height: "20px" }}
                                    />
                                    <span>Singapore (+65)</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="123456789"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {(errors.countryCode || errors.phoneNumber) && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.countryCode?.message ||
                          errors.phoneNumber?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1 flex-1">
                  <h2
                    className={`text-sm font-medium ${
                      errors.addressLine1 ||
                      errors.addressLine2 ||
                      errors.state ||
                      errors.city ||
                      errors.postcode ||
                      errors.country
                        ? "text-red-600"
                        : "text-neutral-400"
                    }`}
                  >
                    Address<span className="ml-0.5 text-red-400">*</span>
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Address Line 1"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Address Line 2 (Optional)"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedState(value);
                                }}
                                value={selectedState}
                              >
                                <SelectTrigger
                                  className={`w-full h-12! rounded-xl sm:rounded-2xl border ${
                                    errors.state
                                      ? "border-red-600"
                                      : "border-neutral-200"
                                  }`}
                                >
                                  <SelectValue placeholder="Select state...">
                                    {field.value}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  {states.map((state) => (
                                    <SelectItem
                                      key={state.isoCode}
                                      value={state.name}
                                    >
                                      {state.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedCity(value);
                                }}
                                value={selectedCity}
                                disabled={cities.length === 0}
                              >
                                <SelectTrigger
                                  className={`w-full h-12! rounded-xl sm:rounded-2xl border ${
                                    errors.city
                                      ? "border-red-600"
                                      : "border-neutral-200"
                                  }`}
                                >
                                  <SelectValue
                                    placeholder={
                                      cities.length === 0
                                        ? "No city available"
                                        : "Select city..."
                                    }
                                  >
                                    {field.value}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  {cities.map((city) => (
                                    <SelectItem
                                      key={city.name}
                                      value={city.name}
                                    >
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="12345"
                                className="w-full h-12 items-center justify-start text-left rounded-xl sm:rounded-2xl"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select disabled value="Malaysia">
                                <SelectTrigger className="w-full h-12! rounded-xl sm:rounded-2xl">
                                  <SelectValue>{field.value}</SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  className="rounded-xl sm:rounded-2xl"
                                >
                                  {Country.getAllCountries().map((country) => (
                                    <SelectItem
                                      key={country.name}
                                      value={country.name}
                                    >
                                      {country.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {(errors.addressLine1 ||
                    errors.addressLine2 ||
                    errors.state ||
                    errors.city ||
                    errors.postcode ||
                    errors.country) && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.addressLine1?.message ||
                        errors.addressLine2?.message ||
                        errors.state?.message ||
                        errors.city?.message ||
                        errors.postcode?.message ||
                        errors.country?.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting || isCalculating || !selectedServiceId}
                  className="p-4 w-full sm:w-fit rounded-lg overflow-hidden cursor-pointer border border-violet-600 text-white bg-violet-600 hover:text-violet-600 hover:bg-white disabled:cursor-auto disabled:border-neutral-200 disabled:text-white disabled:bg-neutral-200"
                >
                  {submitting ? "Sending your order..." : "Place Order"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      )}
      <Modal
        title="Order Unsuccessful!"
        message={errorMessage ?? ""}
        CTA="Try Again"
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageContent />
    </Suspense>
  );
}
