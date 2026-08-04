import { NextResponse } from "next/server";
import { getSupabaseAdmin, SONGS_BUCKET } from "@/lib/supabase";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const password = formData.get("password");
    if (password !== process.env.UPLOAD_PASSWORD) {
      return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
    }

    const file = formData.get("file");
    const title = formData.get("title")?.trim();
    const artist = formData.get("artist")?.trim() || "";

    if (!file || !title) {
      return NextResponse.json(
        { error: "Thiếu file nhạc hoặc tên bài hát." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Kiểm tra trùng tên bài hát (không phân biệt hoa/thường, khoảng trắng thừa)
    const { data: existing, error: checkError } = await supabase
      .from("songs")
      .select("id")
      .ilike("title", title)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { duplicate: true, error: "Bài hát đã tồn tại, bỏ qua." },
        { status: 409 }
      );
    }

    const ext = file.name.split(".").pop() || "mp3";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(SONGS_BUCKET)
      .upload(path, Buffer.from(arrayBuffer), {
        contentType: file.type || "audio/mpeg",
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(SONGS_BUCKET)
      .getPublicUrl(path);

    const { data: song, error: insertError } = await supabase
      .from("songs")
      .insert({ title, artist, url: publicUrlData.publicUrl })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ song });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}