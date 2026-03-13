import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

function unauthorized(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 401, headers: CORS_HEADERS }
  );
}

function validateApiKey(request: NextRequest): boolean {
  const secret = process.env.EXTERNAL_API_KEY;
  if (!secret) return false;

  const fromHeader = request.headers.get("x-api-key");
  const fromAuth = request.headers.get("authorization")?.replace("Bearer ", "");
  const fromQuery = new URL(request.url).searchParams.get("api_key");

  const provided = fromHeader || fromAuth || fromQuery;
  return provided === secret;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorized("Invalid or missing API key. Provide via X-API-Key header, Bearer token, or ?api_key= query param.");
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const inStock = searchParams.get("in_stock");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const format = searchParams.get("format");

  try {
    const db = createAdminClient();

    if (id) {
      const { data, error } = await db
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      return NextResponse.json(
        { success: true, product: formatProduct(data, format) },
        { headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
      );
    }

    let query = db
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (inStock === "true") {
      query = query.eq("in_stock", true);
    } else if (inStock === "false") {
      query = query.eq("in_stock", false);
    }

    const pageLimit = Math.min(Number(limit) || 100, 500);
    const pageOffset = Math.max(Number(offset) || 0, 0);
    query = query.range(pageOffset, pageOffset + pageLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const products = (data || []).map((row) => formatProduct(row, format));

    return NextResponse.json(
      {
        success: true,
        products,
        pagination: {
          total: count ?? products.length,
          limit: pageLimit,
          offset: pageOffset,
          has_more: (count ?? 0) > pageOffset + pageLimit,
        },
      },
      { headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatProduct(row: any, format: string | null) {
  const base = {
    id: row.id,
    name: row.name,
    description: row.description,
    long_description: row.long_description,
    price: Number(row.price),
    currency: row.currency || "EUR",
    category: row.category,
    artisan: row.artisan,
    country: row.country,
    image: row.image,
    tags: row.tags || [],
    in_stock: row.in_stock,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (format === "shopify") {
    return {
      title: base.name,
      body_html: `<p>${base.long_description || base.description}</p>`,
      vendor: base.artisan,
      product_type: base.category,
      tags: base.tags.join(", "),
      variants: [{ price: base.price.toFixed(2), sku: base.id, inventory_quantity: base.in_stock ? 999 : 0 }],
      images: base.image ? [{ src: base.image }] : [],
    };
  }

  if (format === "woocommerce") {
    return {
      name: base.name,
      type: "simple",
      regular_price: base.price.toFixed(2),
      description: base.long_description || base.description,
      short_description: base.description,
      sku: base.id,
      categories: [{ name: base.category }],
      tags: base.tags.map((t: string) => ({ name: t })),
      images: base.image ? [{ src: base.image }] : [],
      stock_status: base.in_stock ? "instock" : "outofstock",
      meta_data: [
        { key: "artisan", value: base.artisan },
        { key: "country", value: base.country },
      ],
    };
  }

  return base;
}
