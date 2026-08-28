import { NextRequest, NextResponse } from "next/server";
import { runDailySourcing } from "@/lib/sourcing";

export const dynamic = "force-dynamic";
// Claude research (dozens of web searches/fetches) can run several minutes.
// 800s requires a Vercel Pro plan with Fluid Compute enabled - see README.
export const maxDuration = 800;

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
