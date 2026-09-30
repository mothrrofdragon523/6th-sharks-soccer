# Local test server for the game. Like `python3 -m http.server`, but:
# - tells browsers not to reuse old copies of files, so a reload on a phone gets the latest changes
# - lets a browser on this Mac (only) save a baked image or JSON into assets/ with PUT,
#   which is how assets/fans.png is made (see bakeFans in src/main.js)
import http.server
import os

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_PUT(self):
        name = os.path.basename(self.path.split('?')[0])
        local = self.client_address[0] in ('127.0.0.1', '::1')
        if not local or not self.path.startswith('/assets/') or not name.endswith(('.png', '.json')):
            self.send_error(403)
            return
        data = self.rfile.read(int(self.headers['Content-Length']))
        with open(os.path.join(ROOT, 'assets', name), 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()


if __name__ == '__main__':
    os.chdir(ROOT)
    http.server.ThreadingHTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
