"""本地预览入口：成功绑定端口后才打开浏览器（Python 3 标准库）。"""
from __future__ import annotations

import argparse
import http.server
from pathlib import Path
import os
import sys
import webbrowser


def main() -> int:
    parser = argparse.ArgumentParser(description='启动知行个人研究与效率工作台')
    parser.add_argument('--port', type=int, default=8000, help='首选端口，默认8000')
    parser.add_argument('--no-browser', action='store_true', help='启动后不自动打开浏览器')
    args = parser.parse_args()
    os.chdir(Path(__file__).resolve().parent)

    server = None
    last_error = None
    for port in (args.port, args.port + 1, args.port + 2):
        if port > 65535 or port < 1:
            continue
        try:
            server = http.server.ThreadingHTTPServer(
                ('127.0.0.1', port),
                http.server.SimpleHTTPRequestHandler,
            )
            break
        except OSError as error:
            last_error = error
            print(f'端口 {port} 不可用：{error}', flush=True)

    if server is None:
        print(f'启动失败：所有尝试的端口均不可用。最后错误：{last_error}', file=sys.stderr, flush=True)
        return 1

    url = f'http://127.0.0.1:{server.server_address[1]}/'
    print(f'服务器已启动。请访问：{url}', flush=True)
    print('注意：此窗口需要保持打开。按 Ctrl+C 可停止服务器。', flush=True)

    if not args.no_browser:
        try:
            opened = webbrowser.open(url, new=2)
            if not opened:
                print(f'未自动打开浏览器，请手动访问：{url}', flush=True)
        except Exception as error:
            print(f'自动打开浏览器失败（服务仍可用）：{error}', flush=True)
            print(f'请手动访问：{url}', flush=True)

    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        print('\n服务器已停止。', flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
