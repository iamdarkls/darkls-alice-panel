"""Additional Glagol playback and music-library operations."""

import base64
import json
import re

import glagol


def _pb_string(out, field, value):
    out.append((field << 3) | 2)
    data = value.encode()
    n = len(data)
    while n >= 0x80:
        out.append((n & 0x7f) | 0x80)
        n >>= 7
    out.append(n)
    out.extend(data)


def audio_play_data(url, title="", subtitle="", offset_ms=0, set_pause=False):
    """protobuf {1:"audio_play", 2: JSON{stream:{...},set_pause}} → base64 (как в zvukd)."""
    stream = {"url": url, "format": "MP3", "type": "Track", "offset_ms": int(offset_ms)}
    if title:
        stream["title"] = title
    if subtitle:
        stream["subtitle"] = subtitle
    payload = json.dumps({"stream": stream, "set_pause": bool(set_pause)}, ensure_ascii=False)
    raw = bytearray()
    _pb_string(raw, 1, "audio_play")
    _pb_string(raw, 2, payload)
    return base64.b64encode(bytes(raw)).decode()


class Playback(glagol.Glagol):
    def audio_play(self, url, title="", subtitle="", offset_ms=0, set_pause=False, timeout=6):
        """Станции отдаётся ссылка на поток: играет её штатный плеер, Алиса остаётся живой."""
        return self.send({"command": "externalCommandBypass",
                          "data": audio_play_data(url, title, subtitle, offset_ms, set_pause)},
                         timeout=timeout)


class Library(glagol.YandexMusic):
    def _short(self, track):
        if not track.get("title"):
            track = {**track, "title": ""}
        return super()._short(track)

    def liked_tracks(self, limit=60):
        """Избранные треки целиком — для вкладки «Избранное»."""
        lib = (self._req(f"/users/{self.uid()}/likes/tracks") or {}).get("library") or {}
        library = [item.get("track") or item for item in (lib.get("tracks") or [])[:limit]]
        missing = [str(t["id"]) for t in library if not t.get("title") and str(t.get("id", "")).isdigit()]
        loaded = {}
        if missing:
            batch = self._req("/tracks", form={"track-ids": ",".join(missing)}) or []
            loaded = {str(t["id"]): t for t in batch if t.get("id") and t.get("title")}
        tracks = [t if t.get("title") else loaded.get(str(t.get("id"))) for t in library]
        return [self._short(t) for t in tracks if t]

    def album_tracks(self, aid):
        if not re.fullmatch(r"[0-9]{1,24}", str(aid)):
            raise ValueError("Некорректный ID альбома")
        a = self._req(f"/albums/{aid}/with-tracks") or {}
        return {"title": a.get("title"), "type": "Album",
                "tracks": [self._short(t) for vol in a.get("volumes", []) for t in vol]}

    def playlists(self, limit=100):
        out = []
        # личные подборки Яндекса: «Плейлист дня», «Премьера», «Дежавю» и т.п.
        try:
            r = self._req("/landing3", {"blocks": "personalPlaylists"}) or {}
            for b in (r.get("blocks") or []):
                if b.get("type") != "personal-playlists":
                    continue
                for e in (b.get("entities") or []):
                    d = (e.get("data") or {}).get("data") or {}
                    if d.get("uid") is None or d.get("kind") is None:
                        continue
                    cover = d.get("cover")
                    out.append({"id": f"{d['uid']}:{d['kind']}", "title": d.get("title") or "Плейлист",
                                "cover": self.cover(cover.get("uri"), 200) if isinstance(cover, dict) else None,
                                "tracks": d.get("trackCount") or 0, "yandex": True})
        except glagol.AuthError:
            pass
        # собственные плейлисты пользователя (эндпоинт бывает недоступен — не ломаем подборки)
        try:
            raw = self._req(f"/users/{self.uid()}/playlists") or []
        except glagol.AuthError:
            raw = []
        for p in raw[:limit]:
            if p.get("kind") is None:
                continue
            out.append({"id": f"{self.uid()}:{p.get('kind')}", "title": p.get("title") or "Плейлист",
                        "cover": self.cover((p.get("cover") or {}).get("uri"), 200),
                        "tracks": p.get("trackCount") or 0})
        return out[:limit]
