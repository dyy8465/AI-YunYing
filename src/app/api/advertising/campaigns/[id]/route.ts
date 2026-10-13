import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { updateCampaignSchema } from "@/lib/validations/advertising";
import { getCampaignById, updateCampaignGuarded } from "@/services/ad.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("advertising:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const campaign = await getCampaignById(id);
    if (!campaign) return jsonError("CAMPAIGN_NOT_FOUND", "广告活动不存在", 404);
    return NextResponse.json(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("advertising:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const input = updateCampaignSchema.parse(await request.json());
    await updateCampaignGuarded(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "CAMPAIGN_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
    return handleApiError(error);
  }
}
