#!/usr/bin/env python3
# 당근톡 아이콘 생성(의존성 없음): 당근색 둥근 사각 + 흰 말풍선 + 점 3개를 그려
# 16/48/128 RGBA PNG 로 직접 인코딩한다. PIL/ImageMagick 불필요.
import os
import struct
import zlib

ORANGE = (0xFF, 0x6F, 0x0F, 255)
WHITE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)


def rounded_rect(x, y, x0, y0, x1, y1, r):
    """픽셀 (x,y) 가 모서리 반경 r 인 둥근 사각 [x0,x1)x[y0,y1) 안에 있나."""
    if x < x0 or x >= x1 or y < y0 or y >= y1:
        return False
    cx = min(max(x, x0 + r), x1 - 1 - r)
    cy = min(max(y, y0 + r), y1 - 1 - r)
    dx, dy = x - cx, y - cy
    return dx * dx + dy * dy <= r * r


def in_circle(x, y, cx, cy, r):
    dx, dy = x - cx, y - cy
    return dx * dx + dy * dy <= r * r


def render(size):
    s = size
    pad = max(1, round(s * 0.06))
    outer_r = s * 0.24
    # 말풍선 영역
    bx0, by0 = s * 0.24, s * 0.26
    bx1, by1 = s * 0.76, s * 0.64
    bub_r = s * 0.12
    dot_r = max(1, round(s * 0.045))
    dot_y = (by0 + by1) / 2
    dot_cx = [s * 0.37, s * 0.5, s * 0.63]
    px = []
    for y in range(s):
        for x in range(s):
            c = CLEAR
            if rounded_rect(x, y, pad, pad, s - pad, s - pad, outer_r):
                c = ORANGE
                if rounded_rect(x, y, bx0, by0, bx1, by1, bub_r):
                    c = WHITE
                    for cx in dot_cx:
                        if in_circle(x, y, cx, dot_y, dot_r):
                            c = ORANGE
                            break
            px.append(c)
    return px


def png_bytes(size, px):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # 각 스캔라인 filter = 0
        for x in range(size):
            raw += bytes(px[y * size + x])

    def chunk(typ, data):
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "icons")
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    for size in (16, 48, 128):
        data = png_bytes(size, render(size))
        with open(os.path.join(out_dir, f"{size}.png"), "wb") as f:
            f.write(data)
        print(f"wrote {size}.png ({len(data)} bytes)")


if __name__ == "__main__":
    main()
