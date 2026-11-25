import { NextResponse } from "next/server";
import { weddingConfig } from "@/config/wedding.config";
import { getSupabaseAnonClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseAnonClient();
  if (!supabase || process.env.VITEST === "true") {
    return NextResponse.json({
      settings: null,
      schedule: null,
      galleryPhotos: null,
      fallbackConfig: weddingConfig,
    });
  }

  const [settingsRes, scheduleRes, galleryRes] = await Promise.all([
    supabase
      .from("site_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_schedule")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  return NextResponse.json({
    settings: settingsRes.data ?? null,
    schedule: scheduleRes.data ?? null,
    galleryPhotos: galleryRes.data ?? [],
  });
}
