const net = require("net");

const server = net.createServer((socket) => {
    socket.on("data", (stream) => {
        const data = stream.toString();
        const path = data.split(" ")[1];
        if (path === "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        }else if(path.substring(1,5) === "echo"){
            socket.write("HTTP/1.1 200 OK\r\n");
            socket.write("Content-Type: text/plain\r\n");
            socket.write("Content-Length: " + path.substring(6).length + "\r\n\r\n")
            socket.write(path.substring(6)+"\r\n");
            socket.end();
        }else{
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        socket.end()
    });
    socket.on("close", () => {
        socket.end();
        server.close();
    });
});

server.listen(4221, "localhost");
