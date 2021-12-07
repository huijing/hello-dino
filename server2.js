const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_METHOD,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR
} = http2.constants;

/* 
To generate some random certificate and key for this to work run:
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout localhost-privkey.pem -out localhost-cert.pem 
*/
const options = {
  key: fs.readFileSync('./localhost-privkey.pem'),
  cert: fs.readFileSync('./localhost-cert.pem')
}

const server = http2.createSecureServer(options);

const serverRoot = "./";

function respondToStreamError(err, stream) {
  console.log(err);
  if (err.code === 'ENOENT') {
    stream.respond({ ":status": HTTP_STATUS_NOT_FOUND });
  } else {
    stream.respond({ ":status": HTTP_STATUS_INTERNAL_SERVER_ERROR });
  }
  stream.end();
}

server.on('stream', (stream, headers) => {
  const reqPath = headers[HTTP2_HEADER_PATH];
  let fullPath = path.join(serverRoot, reqPath);
  if (fullPath == './') {
    fullPath = './index.html'
  }
  const extname = String(path.extname(fullPath)).toLowerCase()
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  }

  const responseMimeType = mimeTypes[extname] || 'application/octet-stream'

  if (fullPath.endsWith(".html")) {
    // handle HTML file
    stream.respondWithFile(fullPath, {
      "content-type": "text/html"
    }, {
      onError: (err) => {
        respondToStreamError(err, stream);
      }
    });

    } else {
      // handle static file
      stream.respondWithFile(fullPath, {
        'content-type': responseMimeType
      }, {
        onError: (err) => respondToStreamError(err, stream)
      });
    }
});

console.log('Server running at https://localhost:6789/')
server.listen(6789);
