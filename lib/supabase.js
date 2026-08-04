import { createClient } from "@supabase/supabase-js";

// Client này CHỈ được dùng trong API routes (chạy trên server),
// vì nó dùng service_role key có toàn quyền — không bao giờ đưa xuống trình duyệt.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường."
    );
  }

  return createClient(url, key);
}

export const SONGS_BUCKET = "songs";
export const COVERS_BUCKET = "covers";