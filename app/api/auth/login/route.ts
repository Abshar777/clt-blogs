import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      console.error("ADMIN_USERNAME/ADMIN_PASSWORD are not set")
      return NextResponse.json(
        { success: false, message: "Admin login is not configured" },
        { status: 500 },
      )
    }

    if (username === adminUsername && password === adminPassword) {
      const response = NextResponse.json(
        {
          success: true,
          message: "Login successful",
          admin: {
            username: adminUsername,
          },
        },
        { status: 200 },
      )

      // Set auth cookie
      response.cookies.set("admin_auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid credentials",
      },
      { status: 401 },
    )
  } catch (error) {
    console.error("POST /api/auth/login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred",
      },
      { status: 500 },
    )
  }
}
