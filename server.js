const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// // nodejs引入jquery
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = new JSDOM("<!doctype html><html><body></body></html>")
  .window;
global.document = document;
const window = document.defaultView;
const $ = require("jquery")(window);

app.use("/css", express.static("css"));
app.use("/js", express.static("js"));
app.use("/assets", express.static("assets"));

app.get("/lawyer/:roomId", (req, res) => {
  res.sendFile(__dirname + "/lawyer.html");
});

app.get("/prisoner/:roomId", (req, res) => {
  res.sendFile(__dirname + "/prisoner.html");
});

app.get("/header", (req, res) => {
  res.sendFile(__dirname + "/header.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

app.get("/time", (req, res) => {
  res.sendFile(__dirname + "/time.html");
});

io.on("connection", (socket) => {
  socket.on("create_or_join", ({ room }) => {
    socket.join(room);
    socket.to(room).emit("join_room", room);
    let clients = io.sockets.adapter.rooms[room];
    if (clients) {
      socket.to(room).emit("receiveSaveMessage", room);
    }
  });

  socket.on("offer", (offer, room) => {
    socket.join(room);
    socket.to(room).emit("offer", offer);
  });

  socket.on("answer", (answer, room) => {
    socket.join(room);
    socket.to(room).emit("answer", answer);
  });

  socket.on("icecandidate", (candidate, room) => {
    socket.join(room);
    socket.to(room).emit("icecandidate", candidate);
  });

  // 转发图片至在押人员屏幕
  socket.on("sendPhoto", (res) => {
    socket.to(res.roomId).emit("receivePhoto", res);
  });
  // 转发挂断
  socket.on("sendQuit", (res) => {
    socket.to(res.roomId).emit("receiveQuit", res);
  });
  // 转发切换视频
  socket.on("sendVideo", (res) => {
    socket.to(res.roomId).emit("receiveVideo", res);
  });
  // 转发笔记至在押人员屏幕
  socket.on("sendNote", (res) => {
    socket.to(res.roomId).emit("receiveNote", res);
  });
  // 转发滚动
  socket.on("sendScroll", (res) => {
    socket.to(res.roomId).emit("receiveScroll", res);
  });

  socket.on("sendHangUp", (message) => {
    socket.to(message).emit("hangUp");
  });
  // 转发保存会话信息
  socket.on("saveMessage", (res) => {
    socket.to(res).emit("saveMessage", res);
  });

  // 三合一 缓存在押端端口
  socket.on("joinRoom", (msg) => {
    const { room, port } = msg;
    socket.join(room);
    socket.to(room).emit("setPort", port);
  });

  // 三合一 同步在押端端口
  socket.on("getRemotePort", (msg) => {
    let { room, port } = msg;
    socket.to(room).emit("setRemotePort", port);
  });

  // 三合一 0-律师会见 1-家属会见
  socket.on("setMeetingType", (msg) => {
    let { room, type } = msg;
    socket.to(room).emit("getMeetingType", type);
  });
});

http.listen(3001, () => {
  console.log("start server success, Listening port: 3001");
});
