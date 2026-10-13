import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { campaignQuerySchema, createCampaignSchema } from "@/lib/validations/advertising";
import { createCampaignGuarded, getCampaigns } from "@/services/ad.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("advertising:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = campaignQuerySchema.parse(params);
    return NextResponse.json(await getCampaigns(query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("advertising:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const input = createCampaignSchema.parse(await request.json());
    const campaign = await createCampaignGuarded(input);
    return NextResponse.json({ id: campaign.id }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "STORE_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
    return handleApiError(error);
  }
}
