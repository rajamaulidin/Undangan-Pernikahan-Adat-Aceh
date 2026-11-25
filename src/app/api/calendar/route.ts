import { NextResponse } from "next/server";
import { weddingConfig } from "@/config/wedding.config";
import { buildIcsContent } from "@/lib/calendar";

export async function GET() {
  const coupleSummary = `${weddingConfig.couple.bride.nickname} & ${weddingConfig.couple.groom.nickname}`;
  const icsBody = buildIcsContent(
    weddingConfig.receptionSchedule,
    coupleSummary
  );

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="resepsi-intat-linto-baro.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
