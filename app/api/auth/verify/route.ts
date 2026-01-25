import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get("admin_auth")

    if (isAdmin) {
      return NextResponse.json({ authenticated: true }, { status: 200 })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
