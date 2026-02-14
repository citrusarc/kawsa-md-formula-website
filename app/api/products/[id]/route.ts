import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/neon/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const productData = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pv.id,
              'variantName', pv."variantName",
              'variant_options', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'id', vo.id,
                    'optionName', vo."optionName",
                    'weight', vo.weight,
                    'width', vo.width,
                    'length', vo.length,
                    'height', vo.height,
                    'currency', vo.currency,
                    'unitPrice', vo."unitPrice",
                    'originalPrice', vo."originalPrice",
                    'currentPrice', vo."currentPrice"
                  )
                ), '[]'::json)
                FROM variant_options vo
                WHERE vo."variantId" = pv.id
              )
            )
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'::json
        ) as product_variants
      FROM products p
      LEFT JOIN product_variants pv ON pv."productId" = p.id
      WHERE p.id = ${id}
      GROUP BY p.id
    `;

    if (!productData || productData.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const otherProductsData = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pv.id,
              'variantName', pv."variantName",
              'variant_options', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'id', vo.id,
                    'optionName', vo."optionName",
                    'weight', vo.weight,
                    'width', vo.width,
                    'length', vo.length,
                    'height', vo.height,
                    'currency', vo.currency,
                    'unitPrice', vo."unitPrice",
                    'originalPrice', vo."originalPrice",
                    'currentPrice', vo."currentPrice"
                  )
                ), '[]'::json)
                FROM variant_options vo
                WHERE vo."variantId" = pv.id
              )
            )
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'::json
        ) as product_variants
      FROM products p
      LEFT JOIN product_variants pv ON pv."productId" = p.id
      WHERE p.id != ${id}
      GROUP BY p.id
    `;

    return NextResponse.json({
      product: productData[0],
      otherProducts: otherProductsData || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
