"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function nameWithoutExt(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

export default function UploadPage() {
  const [password, setPassword] = useState("");
  const [artist, setArtist] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const [existingSongs, setExistingSongs] = useState(null);
  const [edits, setEdits] = useState({}); // id -> { title, artist, coverFile, coverPreview, saving, message }

  useEffect(() => {
    loadExistingSongs();
  }, []);

  function loadExistingSongs() {
    fetch("/api/songs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const songs = data.songs || [];
        setExistingSongs(songs);
        const initialEdits = {};
        songs.forEach((s) => {
          initialEdits[s.id] = {
            title: s.title,
            artist: s.artist || "",
            coverFile: null,
            coverPreview: s.cover_url || null,
            saving: false,
            message: "",
          };
        });
        setEdits(initialEdits);
      })
      .catch(() => setExistingSongs([]));
  }

  function updateEdit(id, patch) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveEdit(id) {
    const edit = edits[id];
    if (!password) {
      updateEdit(id, { message: "Nhập mật khẩu ở form phía trên trước." });
      return;
    }
    updateEdit(id, { saving: true, message: "" });

    const formData = new FormData();
    formData.append("password", password);
    formData.append("title", edit.title);
    formData.append("artist", edit.artist);
    if (edit.coverFile) {
      formData.append("cover", edit.coverFile);
    }

    try {
      const res = await fetch(`/api/songs/${id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        updateEdit(id, { saving: false, message: data.error || "Lỗi" });
      } else {
        updateEdit(id, {
          saving: false,
          message: "Đã lưu ✓",
          coverFile: null,
          coverPreview: data.song.cover_url || edit.coverPreview,
        });
      }
    } catch {
      updateEdit(id, { saving: false, message: "Không thể kết nối" });
    }
  }

  async function deleteSong(id, title) {
    if (!password) {
      updateEdit(id, { message: "Nhập mật khẩu ở form phía trên trước." });
      return;
    }
    if (!confirm(`Xoá hẳn bài "${title}"? Không thể hoàn tác.`)) return;

    updateEdit(id, { saving: true, message: "" });
    try {
      const res = await fetch(`/api/songs/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateEdit(id, { saving: false, message: data.error || "Lỗi" });
        return;
      }
      setExistingSongs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      updateEdit(id, { saving: false, message: "Không thể kết nối" });
    }
  }

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
    loadExistingSongs();
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

      <div className="page-eyebrow" style={{ marginTop: 48 }}>
        Quản lý
      </div>
      <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
        Bài hát đã có ({existingSongs?.length ?? "..."})
      </h2>
      <p className="page-subtitle">
        Sửa tên, nghệ sĩ, hoặc gắn/đổi ảnh bìa mà không cần upload lại file
        nhạc. Cần nhập mật khẩu ở form phía trên trước khi lưu hoặc xoá.
      </p>

      {existingSongs === null && <p className="empty-state">Đang tải...</p>}
      {existingSongs !== null && existingSongs.length === 0 && (
        <p className="empty-state">Chưa có bài hát nào.</p>
      )}

      {existingSongs && existingSongs.length > 0 && (
        <div className="manage-list">
          {existingSongs.map((song) => {
            const edit = edits[song.id];
            if (!edit) return null;
            return (
              <div key={song.id} className="manage-item">
                <label className="upload-cover-picker manage-cover">
                  {edit.coverPreview ? (
                    <img src={edit.coverPreview} alt="" />
                  ) : (
                    <span>+</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      updateEdit(song.id, {
                        coverFile: file,
                        coverPreview: file
                          ? URL.createObjectURL(file)
                          : edit.coverPreview,
                      });
                    }}
                  />
                </label>

                <div className="manage-fields">
                  <input
                    type="text"
                    value={edit.title}
                    onChange={(e) =>
                      updateEdit(song.id, { title: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Nghệ sĩ"
                    value={edit.artist}
                    onChange={(e) =>
                      updateEdit(song.id, { artist: e.target.value })
                    }
                  />
                </div>

                <div className="manage-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={edit.saving}
                    onClick={() => saveEdit(song.id)}
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={edit.saving}
                    onClick={() => deleteSong(song.id, edit.title)}
                  >
                    Xoá
                  </button>
                </div>

                {edit.message && (
                  <span className="manage-message">{edit.message}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 20 }}>
        <Link className="back-link" href="/">
          ← Về trang nghe nhạc
        </Link>
      </p>
    </main>
  );
}