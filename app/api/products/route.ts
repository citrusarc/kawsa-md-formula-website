import { NextResponse } from "next/server";
import { getProducts } from "@/lib/getProducts";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
