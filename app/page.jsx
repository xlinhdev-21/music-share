"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- Icon set (line icons, đơn sắc, dùng currentColor) ---------- */

function Icon({ children, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

const PlayIcon = (p) => (
  <Icon {...p}>
    <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />
  </Icon>
);

const PauseIcon = (p) => (
  <Icon {...p}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
  </Icon>
);

const SkipBackIcon = (p) => (
  <Icon {...p}>
    <path d="M19 20L9 12l10-8v16z" fill="currentColor" stroke="none" />
    <rect x="5" y="4" width="2" height="16" fill="currentColor" stroke="none" />
  </Icon>
);

const SkipForwardIcon = (p) => (
  <Icon {...p}>
    <path d="M5 4l10 8-10 8V4z" fill="currentColor" stroke="none" />
    <rect x="17" y="4" width="2" height="16" fill="currentColor" stroke="none" />
  </Icon>
);

const RepeatIcon = (p) => (
  <Icon {...p}>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </Icon>
);

const DownloadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 21h16" />
  </Icon>
);

const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
);

const VolumeHighIcon = (p) => (
  <Icon {...p}>
    <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
    <path d="M17 8a6 6 0 010 8" />
    <path d="M20 5a10 10 0 010 14" />
  </Icon>
);

const VolumeLowIcon = (p) => (
  <Icon {...p}>
    <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
    <path d="M17 9.5a3.5 3.5 0 010 5" />
  </Icon>
);

const VolumeMuteIcon = (p) => (
  <Icon {...p}>
    <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
    <path d="M16 9l5 6" />
    <path d="M21 9l-5 6" />
  </Icon>
);

/* ---------- Helpers ---------- */

function getTrackNumber(title) {
  const match = title.trim().match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

function sortByTrackNumber(songs) {
  return [...songs].sort((a, b) => {
    const numA = getTrackNumber(a.title);
    const numB = getTrackNumber(b.title);
    if (numA !== numB) return numA - numB;
    return a.title.localeCompare(b.title);
  });
}

function coverStyleFor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const initials = title
    .replace(/^\d+\.\s*/, "")
    .trim()
    .slice(0, 2)
    .toUpperCase();
  return {
    style: {
      background: `linear-gradient(135deg, hsl(${hue}, 70%, 62%), hsl(${
        (hue + 40) % 360
      }, 70%, 48%))`,
    },
    initials,
  };
}

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

async function downloadSong(song) {
  try {
    const res = await fetch(song.url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    const ext = song.url.split(".").pop().split("?")[0] || "mp3";
    a.download = `${song.title}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(song.url, "_blank");
  }
}

const SLEEP_OPTIONS = [15, 30, 45, 60];

export default function HomePage() {
  const [songs, setSongs] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [repeatOne, setRepeatOne] = useState(false);
  const [sleepMenuOpen, setSleepMenuOpen] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState(null);
  const audioRef = useRef(null);
  const sleepIntervalRef = useRef(null);

  useEffect(() => {
    fetch("/api/songs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSongs(sortByTrackNumber(data.songs || [])))
      .catch(() => setSongs([]));
  }, []);

  const currentSong =
    currentIndex !== null && songs ? songs[currentIndex] : null;

  function playAt(index) {
    if (index === currentIndex) {
      togglePlay();
      return;
    }
    setCurrentIndex(index);
    setIsPlaying(true);
  }

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    audioRef.current.src = currentSong.url;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {});
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function togglePlay() {
    if (!currentSong) {
      // Chưa mở bài nào -> phát bài đầu tiên trong danh sách
      if (songs && songs.length > 0) {
        playAt(0);
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function playNext(delta) {
    if (currentIndex === null || !songs) return;
    const next = (currentIndex + delta + songs.length) % songs.length;
    playAt(next);
  }

  function handleEnded() {
    if (repeatOne && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      playNext(1);
    }
  }

  function seekTo(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration) {
      audioRef.current.currentTime = ratio * duration;
    }
  }

  function toggleMute() {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  }

  function startSleepTimer(minutes) {
    clearSleepTimer();
    setSleepRemaining(minutes * 60);
    sleepIntervalRef.current = setInterval(() => {
      setSleepRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          clearInterval(sleepIntervalRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setSleepMenuOpen(false);
  }

  function clearSleepTimer() {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    sleepIntervalRef.current = null;
    setSleepRemaining(null);
  }

  useEffect(() => {
    return () => clearSleepTimer();
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const VolumeIcon =
    volume === 0 ? VolumeMuteIcon : volume < 0.5 ? VolumeLowIcon : VolumeHighIcon;

  return (
    <>
      <main className="main">
        <div className="page-eyebrow">Author: xlinhdev.2208</div>
        <h1 className="page-title">Đang nghe gì hôm nay?</h1>
        <p className="page-subtitle">
          {songs?.length
            ? `${songs.length} bài hát`
            : "Những bài hát tôi đã upload"}
        </p>

        {songs === null && <p className="empty-state">Đang tải...</p>}

        {songs !== null && songs.length === 0 && (
          <p className="empty-state">
            Chưa có bài hát nào. <a href="/upload">Thêm bài hát đầu tiên</a>
          </p>
        )}

        {songs && songs.length > 0 && (
          <div className="track-list">
            <div className="track-list-head">
              <span>#</span>
              <span></span>
              <span>Bài hát</span>
              <span style={{ textAlign: "right" }}>Trạng thái</span>
              <span></span>
            </div>

            {songs.map((song, index) => {
              const { style, initials } = coverStyleFor(song.title);
              const playing = index === currentIndex;
              return (
                <div
                  key={song.id}
                  className={`track-row ${playing ? "playing" : ""}`}
                  onClick={() => playAt(index)}
                >
                  <span className="track-index">
                    {playing && isPlaying ? (
                      <PlayIcon size={12} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="track-cover" style={song.cover_url ? undefined : style}>
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="track-info">
                    <div className="track-title">{song.title}</div>
                    {song.artist && (
                      <div className="track-artist">{song.artist}</div>
                    )}
                  </div>
                  <div className="track-duration">
                    {playing ? (isPlaying ? "Đang phát" : "Tạm dừng") : ""}
                  </div>
                  <button
                    className="track-download"
                    title="Tải xuống"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSong(song);
                    }}
                  >
                    <DownloadIcon size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      <div className="player-bar">
        <div className="player-track">
          {currentSong ? (
            <>
              <div
                className="player-cover"
                style={
                  currentSong.cover_url
                    ? undefined
                    : coverStyleFor(currentSong.title).style
                }
              >
                {currentSong.cover_url ? (
                  <img src={currentSong.cover_url} alt="" />
                ) : (
                  coverStyleFor(currentSong.title).initials
                )}
              </div>
              <div className="player-track-info">
                <div className="player-track-title">
                  {currentSong.title}
                </div>
                {currentSong.artist && (
                  <div className="player-track-artist">
                    {currentSong.artist}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="upload-hint">Chọn một bài hát để nghe</span>
          )}
        </div>

        <div className="player-controls">
          <div className="player-buttons">
            <button
              className={`icon-btn ${repeatOne ? "active" : ""}`}
              onClick={() => setRepeatOne((v) => !v)}
              title="Lặp lại 1 bài"
            >
              <RepeatIcon size={16} />
            </button>
            <button
              className="skip-btn"
              onClick={() => playNext(-1)}
              aria-label="Bài trước"
            >
              <SkipBackIcon size={18} />
            </button>
            <button
              className="play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </button>
            <button
              className="skip-btn"
              onClick={() => playNext(1)}
              aria-label="Bài tiếp theo"
            >
              <SkipForwardIcon size={18} />
            </button>
            {currentSong && (
              <button
                className="icon-btn"
                onClick={() => downloadSong(currentSong)}
                title="Tải bài đang nghe"
              >
                <DownloadIcon size={16} />
              </button>
            )}
          </div>
          <div className="progress-row">
            <span className="time-label">{formatTime(currentTime)}</span>
            <div className="progress-track" onClick={seekTo}>
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="time-label">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-side">
          <div className="volume-control">
            <button
              className="icon-btn"
              onClick={toggleMute}
              title={volume > 0 ? "Tắt tiếng" : "Bật tiếng"}
            >
              <VolumeIcon size={17} />
            </button>
            <input
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>

          <div className="sleep-wrap">
            <button
              className={`icon-btn ${sleepRemaining ? "active" : ""}`}
              onClick={() => setSleepMenuOpen((v) => !v)}
              title="Hẹn giờ tắt nhạc"
            >
              <ClockIcon size={17} />
              {sleepRemaining !== null && (
                <span className="sleep-badge">
                  {Math.ceil(sleepRemaining / 60)}
                </span>
              )}
            </button>
            {sleepMenuOpen && (
              <div className="sleep-menu">
                {SLEEP_OPTIONS.map((m) => (
                  <button key={m} onClick={() => startSleepTimer(m)}>
                    {m} phút
                  </button>
                ))}
                <button
                  className={sleepRemaining === null ? "active" : ""}
                  onClick={() => {
                    clearSleepTimer();
                    setSleepMenuOpen(false);
                  }}
                >
                  Tắt hẹn giờ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}