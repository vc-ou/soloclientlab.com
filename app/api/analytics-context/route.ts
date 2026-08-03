import { NextResponse } from "next/server";
import { ANALYTICS_DISABLED_COOKIE } from "@/lib/analytics-preferences";
import { getVisitorIp, isIgnoredVisitorIp } from "@/lib/visitor-ip";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const visitorIp = getVisitorIp(request.headers);
  const browserDisabled = request.headers.get("cookie")?.includes(`${ANALYTICS_DISABLED_COOKIE}=1`) ?? false;

  return NextResponse.json(
    {
      umamiExcluded: browserDisabled || isIgnoredVisitorIp(visitorIp),
      browserDisabled
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
