let room = location.pathname.split("/")[2];

const localVideo = document.getElementsByClassName("bigVideo")[1];
const remoteVideo = document.getElementsByClassName("bigVideo")[0];
localVideo.onloadeddata = () => {
  localVideo.play();
};
remoteVideo.onloadeddata = () => {
  remoteVideo.play();
};

let message = { roomId: room };

let offerState = false;

let repeatJoin = false;
let repeatOffer = false;
let repeatAnswer = false;

let peer = null;
const PeerConnection =
  window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection;
!PeerConnection && message.error("浏览器不支持WebRTC！");

const socket = io(socketUrl + ":3001");

socket.onerror = () => message.error("信令通道创建失败！");

localStorage.setItem("saveRoomId", room);

createRtcConnect();

function createRtcConnect() {
  peer = new PeerConnection(iceServersConfig);

  peer.ontrack = (e) => {
    if (e && e.streams) {
      remoteVideo.srcObject = e.streams[0];
      localStream = e.streams[0];
      prisonerTimeing && prisonerTimeing.start();
    }
  };

  peer.onicecandidate = (e) => {
    if (e && e.candidate) {
      socket.emit("icecandidate", e.candidate, room);
    }
  };

  peer.oniceconnectionstatechange = (e) => {
    let state = peer.iceConnectionState;
    console.log(state, offerState);
    if (state == "disconnected") {
      notice("当前网络已断开，请稍候...", "error");
      if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
      }
    }
  };
}

function createOffer() {
  createRtcConnect();
  startLive().then(() => {
    peer
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      })
      .then((offer) => {
        offerState = true;
        if (offer) {
          peer.setLocalDescription(offer);
          socket.emit("offer", offer, message.roomId);
        }
      });
  });
}

function createAnswer(offer) {
  createRtcConnect();
  startLive().then(() => {
    peer.setRemoteDescription(offer);
    peer
      .createAnswer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      })
      .then((answer) => {
        if (answer) {
          peer.setLocalDescription(answer);
          socket.emit("answer", answer, message.roomId);
        }
      });
  });
}

socket.on("connect", () => {
  startLive();

  socket.emit("joinRoom", {
    room,
    port: location.port,
  });

  socket.on("setRemotePort", (port) => {
    location.port = port;
  });

  // 三合一 0-律师会见 1-家属会见
  socket.on("getMeetingType", (type) => {
    localStorage.setItem("meetingType", type);
  });

  if (!offerState) {
    socket.emit("create_or_join", {
      room: message.roomId,
    });
  } else {
    createOffer();
  }

  socket.on("join_room", (room) => {
    console.log("join_room", offerState);
    message.roomId = room;
    if (!repeatJoin) {
      repeatJoin = true;
      createOffer();
      setTimeout(() => {
        repeatJoin = false;
      }, 1500);
    }
  });

  socket.on("offer", (offer) => {
    console.log("offer", offerState);
    if (!repeatOffer) {
      repeatOffer = true;
      if (offer) {
        createAnswer(offer);
      }
      setTimeout(() => {
        repeatOffer = false;
      }, 1500);
    }
  });

  socket.on("answer", (answer) => {
    console.log("answer", offerState);
    if (!repeatAnswer) {
      repeatAnswer = true;
      if (answer) {
        peer.setRemoteDescription(answer);
      }
      setTimeout(() => {
        repeatAnswer = false;
      }, 1500);
    }
  });

  socket.on("icecandidate", (candidate) => {
    if (offerState && candidate) {
      peer.addIceCandidate(candidate);
    }
  });

  // 获取Base64图片
  socket.on("receivePhoto", (res) => {
    signBox.style.display = "none";
    scanBox.style.display = "inline-block";
    videoBd.className = "videoBd videoBdNew";
    videoTitleNew.style.display = "inline-block";
    contentBorder.style.display = "block";
    let highMeterPhoto = document.getElementById("highMeterPhoto");
    highMeterPhoto.src = res.content;
  });

  // 接受保存的会话信息
  socket.on("receiveSaveMessage", function (res) {
    //type 1表示进入房间保存会话 2表示挂断保存
    meetMessage("1");
    socket.emit("saveMessage", room);
  });

  // 接受保存的会话信息
  socket.on("saveMessage", function (res) {
    //type 1表示进入房间保存会话 2表示挂断保存
    meetMessage("1");
  });

  /*切回视频*/
  socket.on("receiveVideo", function (res) {
    scanBox.style.display = "none";
    signBox.style.display = "none";
    videoBd.className = "videoBd";
    videoTitleNew.style.display = "none";
    contentBorder.style.display = "none";
  });

  // 退出
  socket.on("receiveQuit", function (res) {
    prisonerTimeing && prisonerTimeing.reset();
  });
  // 获取笔录
  socket.on("receiveNote", function (res) {
    signBox.style.display = "inline-block";
    scanBox.style.display = "none";
    videoBd.className = "videoBd videoBdNew";
    videoTitleNew.style.display = "inline-block";
    contentBorder.style.display = "block";
    um.setContent(res.content);
    let eduiEditorBody = document.getElementsByClassName("edui-editor-body")[0];
    eduiEditorBody.scrollTop = res.scroll;
  });
  // 滚动
  socket.on("receiveScroll", function (res) {
    let eduiEditorBody = document.getElementsByClassName("edui-editor-body")[0];
    eduiEditorBody.scrollTop = res.scroll;
  });
});

/*律师视频*/
let bigVideo1 = document.getElementsByClassName("bigVideo")[0];
/*音量控制*/
bigVideo1.volume = 1;
/*在押人员视频*/
let bigVideo2 = document.getElementsByClassName("bigVideo")[1];
bigVideo2.volume = 0;
//切换页面
let scanBox = document.getElementsByClassName("scanBox")[0];
let videoBd = document.getElementsByClassName("videoBd")[0];
let videoTitleNew = document.getElementsByClassName("videoTitleNew")[0];
let contentBorder = document.getElementsByClassName("contentBorder")[0];
let signBox = document.getElementsByClassName("signBox")[0];
/*编辑器*/
const um = UM.getEditor("editor", {
  initialStyle: ".edui-editor-body .edui-body-container p{margin:16px 0}",
});
um.setDisabled("fullscreen");
disableBtn("enable");
function disableBtn(str) {
  let div = document.getElementById("editor");
  let btns = UM.dom.domUtils.getElementsByTagName(div, "button");
  for (let i = 0, btn; (btn = btns[i++]); ) {
    if (btn.id == str) {
      UM.dom.domUtils.removeAttributes(btn, ["disabled"]);
    } else {
      $(btn).attr("disabled", true).addClass("disabled");
    }
  }
}
//type 1表示进入房间保存会话 2表示挂断保存
function meetMessage(type) {
  let url = socketUrl + ":8200/inquiry/meetVideoMessage/saveVideoMessage";
  let roomId = localStorage.getItem("saveRoomId");

  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json",
    data: '{"room":"' + roomId + '","type":' + type + "}",
    async: false,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {},
  });
}
