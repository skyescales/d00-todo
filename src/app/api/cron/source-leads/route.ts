import { NextRequest, NextResponse } from "next/server";
import { runDailySourcing } from "@/lib/sourcing";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow the Places sweep + details calls room to run

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runDailySourcing();
  return NextResponse.json(result);
}
