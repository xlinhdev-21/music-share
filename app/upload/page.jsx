"use client";

import { useState } from "react";
import Link from "next/link";

function nameWithoutExt(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

export default function UploadPage() {
  const [password, setPassword] = useState("");
  const [artist, setArtist] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleFilesChange(e) {
    const files = Array.from(e.target.files || []);
    const newEntries = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      title: nameWithoutExt(file.name),
      cover: null,
      coverPreview: null,
      status: "pending",
      message: "",
    }));
    setEntries(newEntries);
  }

  function updateEntry(id, patch) {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  }

  function updateTitle(id, title) {
    updateEntry(id, { title });
  }

  function updateCover(id, file) {
    const preview = file ? URL.createObjectURL(file) : null;
    updateEntry(id, { cover: file, coverPreview: preview });
  }

  async function uploadOne(entry) {
    updateEntry(entry.id, { status: "uploading" });

    const formData = new FormData();
    formData.append("password", password);
    formData.append("title", entry.title);
    formData.append("artist", artist);
    formData.append("file", entry.file);
    if (entry.cover) {
      formData.append("cover", entry.cover);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.status === 409 && data.duplicate) {
        updateEntry(entry.id, { status: "duplicate", message: "Đã tồn tại" });
      } else if (!res.ok) {
        updateEntry(entry.id, {
          status: "error",
          message: data.error || "Lỗi",
        });
      } else {
        updateEntry(entry.id, { status: "done", message: "Đã thêm" });
      }
    } catch {
      updateEntry(entry.id, {
        status: "error",
        message: "Không thể kết nối",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (entries.length === 0) return;

    setLoading(true);
    for (const entry of entries) {
      await uploadOne(entry);
    }
    setLoading(false);
  }

  const doneCount = entries.filter((e) => e.status === "done").length;
  const duplicateCount = entries.filter((e) => e.status === "duplicate").length;
  const errorCount = entries.filter((e) => e.status === "error").length;
  const finished =
    entries.length > 0 &&
    entries.every((e) => ["done", "duplicate", "error"].includes(e.status));

  return (
    <main className="main">
      <div className="page-eyebrow">Riêng tư</div>
      <h1 className="page-title">Thêm bài hát</h1>
      <p className="page-subtitle">
        Chọn một hoặc nhiều file cùng lúc, có thể gắn ảnh bìa riêng cho từng
        bài — bài nào trùng tên sẽ tự động bị bỏ qua.
      </p>

      <form className="form-panel" onSubmit={handleSubmit}>
        <div>
          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Nghệ sĩ / ca sĩ (áp dụng cho tất cả file chọn lần này, tuỳ chọn)</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>
        <div>
          <label>File nhạc (chọn được nhiều file)</label>
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFilesChange}
            required
          />
        </div>

        {entries.length > 0 && (
          <div className="upload-list">
            {entries.map((entry) => (
              <div key={entry.id} className="upload-item">
                <label className="upload-cover-picker">
                  {entry.coverPreview ? (
                    <img src={entry.coverPreview} alt="" />
                  ) : (
                    <span>+</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={entry.status !== "pending"}
                    onChange={(e) =>
                      updateCover(entry.id, e.target.files?.[0] || null)
                    }
                  />
                </label>
                <input
                  type="text"
                  className="upload-item-title"
                  value={entry.title}
                  disabled={entry.status !== "pending"}
                  onChange={(e) => updateTitle(entry.id, e.target.value)}
                />
                <span className={`upload-status status-${entry.status}`}>
                  {entry.status === "pending" && "Chờ upload"}
                  {entry.status === "uploading" && "Đang tải..."}
                  {entry.status === "done" && "✓ Đã thêm"}
                  {entry.status === "duplicate" && "⏭ Trùng, bỏ qua"}
                  {entry.status === "error" && `✗ ${entry.message}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading || entries.length === 0}>
          {loading
            ? "Đang upload..."
            : `Upload ${entries.length > 0 ? entries.length + " bài" : ""}`}
        </button>

        {finished && (
          <div className="form-message success">
            Xong: {doneCount} bài mới
            {duplicateCount > 0 && `, ${duplicateCount} bài bị trùng`}
            {errorCount > 0 && `, ${errorCount} bài lỗi`}.
          </div>
        )}
      </form>

      <p style={{ marginTop: 20 }}>
        <Link className="back-link" href="/">
          ← Về trang nghe nhạc
        </Link>
      </p>
    </main>
  );
}