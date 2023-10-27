const net = require("net");
const fs = require("fs").promises;

const server = net.createServer(handleClient);

function handleClient(socket) {
  socket.on("data", async (data) => {
    const request = data.toString();
    const { requestType, path, userAgent, body } = parseRequest(request);

    if (path === "/") {
      sendResponse(socket, 200, "OK", "text/plain", "");
    } else if (path.startsWith("/echo/")) {
      const content = path.substring(6);
      sendResponse(socket, 200, "OK", "text/plain", content);
    } else if (path === "/user-agent") {
      sendResponse(socket, 200, "OK", "text/plain", userAgent);
    } else if (path.startsWith("/files/")) {
      const dir = process.argv[process.argv.indexOf("--directory") + 1];
      if (!dir) {
        socket.end();
        return;
      }

      try {
        if (requestType === "GET") {
          const data = await getFileContent(dir, path.substring(7));
          sendResponse(socket, 200, "OK", "application/octet-stream", data);
        } else if (requestType === "POST") {
          await writeFileContent(dir, path.substring(7), body);
          sendResponse(socket, 201, "Created", "text/plain", body);
        }
      } catch (err) {
        sendResponse(socket, 404, "Not Found", "text/plain", "404 Not Found");
      }
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
  const requestType = lines[0].split(" ")[0];
  const path = lines[0].split(" ")[1];
  const userAgentLine = lines.find((line) => line.startsWith("User-Agent: "));
  const userAgent = userAgentLine ? userAgentLine.substring(12) : "Unknown";
  const body = lines[lines.length - 1];
  return { requestType, path, userAgent, body };
}

async function getFileContent(dir, fileName) {
  const filePath = `${dir}/${fileName}`;
  return await fs.readFile(filePath);
}

async function writeFileContent(dir, fileName, data) {
  const filePath = `${dir}/${fileName}`;
  await fs.writeFile(filePath, data);
}

function sendResponse(socket, statusCode, statusText, contentType, content) {
  const response =
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `Content-Length: ${content.length}\r\n\r\n${content}\r\n`;

  socket.end(response);
}

server.listen(4221, "localhost");
