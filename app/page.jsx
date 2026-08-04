"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [songs, setSongs] = useState(null);

  useEffect(() => {
   fetch("/api/songs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSongs(data.songs || []))
      .catch(() => setSongs([]));
  }, []);

  return (
    <div className="container">
      <h1>🎵 My Music</h1>
      <p className="subtitle">Những bài hát tôi đã upload</p>

      {songs === null && <p className="empty">Đang tải...</p>}

      {songs !== null && songs.length === 0 && (
        <p className="empty">Chưa có bài hát nào.</p>
      )}

      {songs?.map((song) => (
        <div className="song-card" key={song.id}>
          <div className="song-title">{song.title}</div>
          {song.artist && <div className="song-artist">{song.artist}</div>}
          <audio controls src={song.url} preload="none" />
        </div>
      ))}
    </div>
  );
}
