import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    console.log(username, password)
    // Hardcoded credentials check
    if (username === "admin_root" && password === "admin123") {
      const response = NextResponse.json(
        {
          success: true,
          message: "Login successful",
          admin: {
            username: "admin_root",
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
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred",
      },
      { status: 500 },
    )
  }
}
