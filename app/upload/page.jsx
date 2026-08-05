"use client";

import { useEffect, useRef, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const searchWrapRef = useRef(null);

  useEffect(() => {
    loadExistingSongs();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadExistingSongs() {
    fetch("/api/songs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setExistingSongs(data.songs || []))
      .catch(() => setExistingSongs([]));
  }

  function selectSong(song) {
    setSelectedSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist || "");
    setEditCoverFile(null);
    setEditCoverPreview(song.cover_url || null);
    setEditMessage("");
    setSearchTerm(song.title);
    setDropdownOpen(false);
  }

  function clearSelection() {
    setSelectedSong(null);
    setSearchTerm("");
    setEditMessage("");
  }

  async function saveEdit() {
    if (!selectedSong) return;
    if (!password) {
      setEditMessage("Nhập mật khẩu ở form bên trái trước.");
      return;
    }
    setEditSaving(true);
    setEditMessage("");

    const formData = new FormData();
    formData.append("password", password);
    formData.append("title", editTitle);
    formData.append("artist", editArtist);
    if (editCoverFile) formData.append("cover", editCoverFile);

    try {
      const res = await fetch(`/api/songs/${selectedSong.id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMessage(data.error || "Lỗi");
      } else {
        setEditMessage("Đã lưu ✓");
        setExistingSongs((prev) =>
          prev.map((s) => (s.id === selectedSong.id ? data.song : s))
        );
        setSelectedSong(data.song);
        setEditCoverFile(null);
      }
    } catch {
      setEditMessage("Không thể kết nối");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selectedSong) return;
    if (!password) {
      setEditMessage("Nhập mật khẩu ở form bên trái trước.");
      return;
    }
    if (!confirm(`Xoá hẳn bài "${selectedSong.title}"? Không thể hoàn tác.`))
      return;

    setEditSaving(true);
    try {
      const res = await fetch(`/api/songs/${selectedSong.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMessage(data.error || "Lỗi");
        setEditSaving(false);
        return;
      }
      setExistingSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
      clearSelection();
    } catch {
      setEditMessage("Không thể kết nối");
      setEditSaving(false);
    }
  }


function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function normalizeTitle(title) {
  return normalizeText(title.replace(/^\d+\.\s*/, ""));
}function getTrackNumber(title) {
  const match = title.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : null;
}

const keyword = normalizeText(searchTerm.trim());

const filteredSongs = (existingSongs || [])
  .filter((song) => {
    const original = normalizeText(song.title);
    const normalized = normalizeTitle(song.title);

    return (
      original.includes(keyword) ||
      normalized.includes(keyword)
    );
  })
  .sort((a, b) => {
    const numA = getTrackNumber(a.title);
    const numB = getTrackNumber(b.title);

    // Cả hai đều có số -> sắp theo số
    if (numA !== null && numB !== null) {
      return numA - numB;
    }

    // Có số đứng trước
    if (numA !== null) return -1;
    if (numB !== null) return 1;

    // Không có số -> ABC
    return a.title.localeCompare(b.title, "vi");
  });

  /* ---------- Phần upload (giữ nguyên logic cũ) ---------- */

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
    if (entry.cover) formData.append("cover", entry.cover);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 409 && data.duplicate) {
        updateEntry(entry.id, { status: "duplicate", message: "Đã tồn tại" });
      } else if (!res.ok) {
        updateEntry(entry.id, { status: "error", message: data.error || "Lỗi" });
      } else {
        updateEntry(entry.id, { status: "done", message: "Đã thêm" });
      }
    } catch {
      updateEntry(entry.id, { status: "error", message: "Không thể kết nối" });
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
      <h1 className="page-title">Thêm & quản lý bài hát</h1>
      <p className="page-subtitle">
        Upload bài mới ở bên trái, tìm và sửa/xoá bài đã có ở bên phải.
      </p>

      <div className="upload-layout">
        {/* ---------- Cột trái: upload ---------- */}
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
            <label>Nghệ sĩ / ca sĩ (áp dụng cho lần upload này, tuỳ chọn)</label>
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
                    onChange={(e) =>
                      updateEntry(entry.id, { title: e.target.value })
                    }
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

        {/* ---------- Cột phải: tìm kiếm & quản lý ---------- */}
        <div className="manage-panel">
          <label>Tìm bài hát để sửa / xoá</label>
          <div className="search-combobox" ref={searchWrapRef}>
            <input
              type="text"
              placeholder={
                existingSongs === null
                  ? "Đang tải..."
                  : "Gõ tên bài hát..."
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
                if (selectedSong && e.target.value !== selectedSong.title) {
                  setSelectedSong(null);
                }
              }}
              onFocus={() => setDropdownOpen(true)}
            />
            {dropdownOpen && existingSongs && existingSongs.length > 0 && (
              <div className="search-dropdown">
                {filteredSongs.length === 0 && (
                  <div className="search-empty">Không tìm thấy bài nào</div>
                )}
                {filteredSongs.slice(0, 30).map((song) => (
                  <button
                    type="button"
                    key={song.id}
                    className="search-result-item"
                    onClick={() => selectSong(song)}
                  >
                    <span className="search-result-title">{song.title}</span>
                    {song.artist && (
                      <span className="search-result-artist">
                        {song.artist}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {existingSongs !== null && existingSongs.length === 0 && (
            <p className="empty-state" style={{ padding: "30px 10px" }}>
              Chưa có bài hát nào.
            </p>
          )}

          {selectedSong && (
            <div className="edit-card">
              <div className="edit-card-top">
                <label className="upload-cover-picker manage-cover">
                  {editCoverPreview ? (
                    <img src={editCoverPreview} alt="" />
                  ) : (
                    <span>+</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setEditCoverFile(f);
                      if (f) setEditCoverPreview(URL.createObjectURL(f));
                    }}
                  />
                </label>
                <div className="manage-fields">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nghệ sĩ"
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                  />
                </div>
              </div>

              <div className="manage-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={editSaving}
                  onClick={saveEdit}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={editSaving}
                  onClick={deleteSelected}
                >
                  Xoá
                </button>
                <button
                  type="button"
                  className="back-link"
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}
                  onClick={clearSelection}
                >
                  Đóng
                </button>
              </div>

              {editMessage && (
                <span className="manage-message">{editMessage}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link className="back-link" href="/">
          ← Về trang nghe nhạc
        </Link>
      </p>
    </main>
  );
}