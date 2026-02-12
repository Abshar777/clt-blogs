import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const allowedOrigins = [
    "https://clt-academy.com",
    "https://www.deltadigitalacademy.com",
    "https://deltadigitalacademy.com",
  ];
  const origin = request.headers.get("origin") || "";
  const response = NextResponse.next();

  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  return response;
}

// Optionally specify which routes to apply middleware to
export const config = {
  matcher: "/api/:path*", // Apply only to API routes
};
