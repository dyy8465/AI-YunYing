import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", app: "amazon-seller-os", phase: 1 });
}
