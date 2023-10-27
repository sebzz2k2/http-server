const net = require("net");
const fs = require("fs");

const server = net.createServer(handleClient);

function handleClient(socket) {
  socket.on("data", (data) => {
    const request = data.toString();
    const { path, userAgent } = parseRequest(request);

    console.log(`Request: ${path} (${userAgent})`);

    if (path === "/") {
      sendResponse(socket, 200, "OK", "text/plain", "");
    } else if (path.startsWith("/echo/")) {
      const content = path.substring(6);
      sendResponse(socket, 200, "OK", "text/plain", content);
    } else if (path === "/user-agent") {
      sendResponse(socket, 200, "OK", "text/plain", userAgent);
    } else if (path.startsWith("/files/")) {
      const dirIndex = process.argv.indexOf("--directory") + 1;
      if (dirIndex === 0) {
        socket.end();
      }
      const dir = process.argv[dirIndex];
      const fileName = path.substring(7);
      fs.readFile(`${dir}/${fileName}`, (err, data) => {
        if (err) {
          sendResponse(socket, 404, "Not Found", "text/plain", "404 Not Found");
          return;
        }
        sendResponse(socket, 200, "OK", "application/octet-stream", data);
      });
    } else {
      sendResponse(socket, 404, "Not Found", "text/plain", "404 Not Found");
    }
  });

  socket.on("close", () => {
    socket.end();
  });
}

function parseRequest(request) {
  const lines = request.split("\r\n");
  const path = lines[0].split(" ")[1];
  const userAgentLine = lines.find((line) => line.startsWith("User-Agent: "));
  const userAgent = userAgentLine ? userAgentLine.substring(12) : "Unknown";
  return { path, userAgent };
}

function sendResponse(socket, statusCode, statusText, contentType, content) {
  const response =
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `Content-Length: ${content.length}\r\n\r\n${content}\r\n`;

  socket.end(response);
}

server.listen(4221, "localhost");
