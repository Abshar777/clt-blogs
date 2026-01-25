import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Logout successful",
    },
    { status: 200 },
  )

  response.cookies.delete("admin_auth")
  return response
}
