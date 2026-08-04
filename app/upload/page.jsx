"use client";

import { useState } from "react";
import Link from "next/link";

export default function UploadPage() {
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Vui lòng chọn một file nhạc." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("password", password);
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Có lỗi xảy ra." });
      } else {
        setMessage({ type: "success", text: "Đã upload thành công! 🎉" });
        setTitle("");
        setArtist("");
        setFile(null);
        document.getElementById("file-input").value = "";
      }
    } catch (err) {
      setMessage({ type: "error", text: "Không thể kết nối tới server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="main">
      <div className="page-eyebrow">Riêng tư</div>
      <h1 className="page-title">Thêm bài hát</h1>
      <p className="page-subtitle">Chỉ mình bạn nên biết trang này</p>

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
          <label>Tên bài hát</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Nghệ sĩ / ca sĩ (tuỳ chọn)</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>
        <div>
          <label>File nhạc (mp3, wav, m4a...)</label>
          <input
            id="file-input"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Đang upload..." : "Upload"}
        </button>

        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
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