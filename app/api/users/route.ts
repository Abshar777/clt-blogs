import { connectDB } from "@/lib/mongodb";
import { Author } from "@/lib/models/Author";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const users = await Author.find().sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get("admin_auth");
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    if (!data.name || !data.profession || !data.link) {
      return NextResponse.json(
        { error: "name, profession and link are required" },
        { status: 400 },
      );
    }

    const user = await Author.create({
      name: data.name,
      profession: data.profession,
      link: data.link,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
