import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, url, cover_url, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ songs: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}