import { NextResponse } from "next/server";
import { getSupabaseAdmin, SONGS_BUCKET, COVERS_BUCKET } from "@/lib/supabase";

function extractStoragePath(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const formData = await req.formData();

    const password = formData.get("password");
    if (password !== process.env.UPLOAD_PASSWORD) {
      return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
    }

    const title = formData.get("title")?.trim();
    const artist = formData.get("artist")?.trim() || "";
    const cover = formData.get("cover");

    if (!title) {
      return NextResponse.json(
        { error: "Thiếu tên bài hát." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const updates = { title, artist };

    // Chỉ upload ảnh bìa mới nếu người dùng có chọn ảnh
    if (cover && cover.size > 0) {
      const coverExt = cover.name.split(".").pop() || "jpg";
      const coverPath = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${coverExt}`;
      const coverBuffer = await cover.arrayBuffer();
      const { error: coverUploadError } = await supabase.storage
        .from(COVERS_BUCKET)
        .upload(coverPath, Buffer.from(coverBuffer), {
          contentType: cover.type || "image/jpeg",
        });
      if (coverUploadError) throw coverUploadError;

      const { data: coverPublicUrlData } = supabase.storage
        .from(COVERS_BUCKET)
        .getPublicUrl(coverPath);
      updates.cover_url = coverPublicUrlData.publicUrl;
    }

    const { data: song, error } = await supabase
      .from("songs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ song });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));

    if (body.password !== process.env.UPLOAD_PASSWORD) {
      return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: song, error: fetchError } = await supabase
      .from("songs")
      .select("url, cover_url")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase
      .from("songs")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    // Dọn file trên storage nếu được — lỗi ở bước này không quan trọng,
    // bài hát vẫn đã được xoá khỏi danh sách.
    try {
      const songPath = extractStoragePath(song.url, SONGS_BUCKET);
      if (songPath) {
        await supabase.storage.from(SONGS_BUCKET).remove([songPath]);
      }
      const coverPath = extractStoragePath(song.cover_url, COVERS_BUCKET);
      if (coverPath) {
        await supabase.storage.from(COVERS_BUCKET).remove([coverPath]);
      }
    } catch {
      // bỏ qua lỗi dọn file
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}