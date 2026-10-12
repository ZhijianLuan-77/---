"""在真实HTTP服务启动后检查首页和静态模块的加载（仅依赖标准库）。"""
from __future__ import annotations

import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "/": [b"<html", b"src/app.js"],
    "/src/app.js": [b"./core.js", b"./storage.js"],
    "/src/core.js": [b"export"],
    "/src/storage.js": [b"export"],
    "/src/styles.css": [b"@media"],
    "/assets/favicon.svg": [b"<svg"],
}


def main() -> None:
    server = subprocess.Popen(
        [sys.executable, "-u", "start_server.py", "--no-browser", "--port", "18567"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        bufsize=1,
    )
    try:
        deadline = time.monotonic() + 10
        address = None
        while time.monotonic() < deadline:
            line = server.stdout.readline() if server.stdout else ""
            if line:
                match = re.search(r"http://127\.0\.0\.1:\d+/?", line)
                if match:
                    address = match.group(0).rstrip("/")
                    break
            if server.poll() is not None:
                raise AssertionError(f"服务器提前退出，退出码={server.returncode}")
        if not address:
            raise AssertionError("服务器未在10秒内输出可访问地址")
        for path, fragments in EXPECTED.items():
            with urlopen(address + path, timeout=5) as response:
                payload = response.read()
                assert response.status == 200, (path, response.status)
                assert all(fragment in payload for fragment in fragments), path
            print(f"PASS HTTP GET {path}")
        print(f"HTTP SMOKE PASS: {len(EXPECTED)} resources loaded")
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()


if __name__ == "__main__":
    main()
