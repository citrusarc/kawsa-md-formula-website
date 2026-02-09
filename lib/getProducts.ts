import { sql } from "@/utils/neon/client";

import {
  ProductsItem,
  ProductVariant,
  VariantOption,
  GetProductsItem,
} from "@/types";

export async function getProducts(): Promise<ProductsItem[]> {
  try {
    const data = await sql`
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
      GROUP BY p.id
    `;

    if (!data || data.length === 0) {
      console.warn("No data returned from products query");
      return [];
    }

    const transformedData: ProductsItem[] = (data as GetProductsItem[]).map(
      (product) => ({
        id: product.id,
        src: product.src,
        alt: product.alt,
        name: product.name,
        description: Array.isArray(product.description)
          ? product.description
          : JSON.parse(product.description || "[]"),
        additionalInfo1: Array.isArray(product.additionalInfo1)
          ? product.additionalInfo1
          : JSON.parse(product.additionalInfo1 || "[]"),
        additionalInfo2: Array.isArray(product.additionalInfo2)
          ? product.additionalInfo2
          : JSON.parse(product.additionalInfo2 || "[]"),
        currency: product.currency,
        status: product.status,
        variants: product.product_variants.map(
          (variant): ProductVariant => ({
            id: variant.id,
            variantName: variant.variantName,
            options: variant.variant_options.map(
              (option): VariantOption => ({
                id: option.id,
                optionName: option.optionName,
                weight: option.weight,
                width: option.width,
                length: option.length,
                height: option.height,
                currency: option.currency,
                unitPrice: option.unitPrice,
                originalPrice: option.originalPrice,
                currentPrice: option.currentPrice,
              }),
            ),
          }),
        ),
      }),
    );

    return transformedData;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error(
      `Failed to fetch products: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
