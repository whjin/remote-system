let room = location.pathname.split("/")[2];

// 初始化高拍仪摄像头
load(camDevInd);

const localVideo = document.getElementsByClassName("bigVideo")[1];
const remoteVideo = document.getElementsByClassName("bigVideo")[0];
localVideo.onloadeddata = () => {
  localVideo.play();
};
remoteVideo.onloadeddata = () => {
  remoteVideo.play();
};

let message = { roomId: room };
let hearingTime = 0;

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

setInterval(() => {
  hearingTime++;
}, 60000);

createRtcConnect();

function createRtcConnect() {
  peer = new PeerConnection(iceServersConfig);

  peer.ontrack = (e) => {
    if (e && e.streams) {
      remoteVideo.srcObject = e.streams[0];
      localStream = e.streams[0];
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

  socket.on("hangUp", () => {
    hangUp();
  });

  // 接受保存的会话信息
  socket.on("receiveSaveMessage", (res) => {
    let roomId = localStorage.getItem("url");
    //type 1表示进入房间保存会话 2表示挂断保存
    saveVideoMessage({ type: "1", room: roomId });
    socket.emit("saveMessage", room);
  });

  // 接受保存的会话信息
  socket.on("saveMessage", function (res) {
    let roomId = localStorage.getItem("url");
    //type 1表示进入房间保存会话 2表示挂断保存
    saveVideoMessage({ type: "1", room: roomId });
  });
});

let guaduanDom = document.getElementById("hangUp");
let layerTab = document.getElementsByClassName("layerTab")[0];
guaduanDom.style.right = "100px";
layerTab.style.right = "90px";

/*在押人员视频*/
let bigVideo1 = document.getElementsByClassName("bigVideo")[0];
bigVideo1.volume = 1;

/*律师视频*/
let bigVideo2 = document.getElementsByClassName("bigVideo")[1];
/*初始音量*/
bigVideo2.volume = 0;

// 律师视频tab页
let contentBorder = document.getElementsByClassName("contentBorder")[0];
let videoBd = document.getElementsByClassName("videoBd")[0];
let highMeter = document.getElementsByClassName("highMeter")[0];
let writeNote = document.getElementsByClassName("writeNote")[0];

layerTab.onclick = (ev) => {
  if (ev.target.tagName == "LI") {
    // 清空
    for (let i = 0; i < layerTab.children.length; i++) {
      layerTab.children[i].className = "";
    }
    ev.target.className = "layerAct";
    if (ev.target.dataset.idx == "1") {
      videoBd.className = "videoBd";
      contentBorder.style.display = "none";
      highMeter.style.display = "none";
      writeNote.style.display = "none";
      socket.emit("sendVideo", {
        roomId: message.roomId,
        status: 1,
      });
    } else if (ev.target.dataset.idx == "2") {
      highMeter.style.display = "inline-block";
      videoBd.className = "videoBd videoBdNew";
      contentBorder.style.display = "block";
      writeNote.style.display = "none";
    } else {
      highMeter.style.display = "none";
      videoBd.className = "videoBd videoBdNew";
      contentBorder.style.display = "block";
      writeNote.style.display = "inline-block";
    }
  }
};
document.getElementById("hangUp").addEventListener(
  "click",
  function () {
    document.getElementsByClassName("mian_bg2")[0].style.display = "block";
  },
  false
);
document.getElementById("cancelGuaDuan").onclick = function () {
  document.getElementsByClassName("mian_bg2")[0].style.display = "none";
};
//第三方介入时更改以前上一个律师端的房间状态
async function meetVideoKickOutMessage(msg) {
  let url =
    socketUrl + ":8200/inquiry/inquiryManagement/meetVideoKickOutMessage";
  let data = JSON.stringify(msg);
  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json",
    data: data,
    async: false,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {},
  });
}
// 更改房间的使用状态
async function meetVideoMessage(msg) {
  let url = socketUrl + ":8200/inquiry/inquiryManagement/saveVideoMessage";
  let data = JSON.stringify(msg);
  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json",
    data: data,
    async: false,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {},
  });
}
// 更改房间的使用状态
async function saveVideoMessage(msg) {
  let url = socketUrl + ":8200/inquiry/meetVideoMessage/saveVideoMessage";
  let data = JSON.stringify(msg);
  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json",
    data: data,
    async: false,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {},
  });
}
/*高拍仪*/
/*预览3s定时器*/
let timer;
/*存储图片base64*/
let base64Img = [];
/*图片编辑器*/
let cro;
// 选择照片的idx
let highPhotoIdx = -1;
// 选择的照片
let highPhoto;
/*预览*/
function previewImg(path, takePhoto = true) {
  let highMeterBox = document.getElementById("highMeterBox");
  let previewImg = document.getElementById("previewImg");
  let previewBox = document.getElementById("previewBox");
  highMeterBox.style.display = "none";
  previewBox.style.display = "block";
  previewImg.src = path;
  if (takePhoto) {
    timer = setTimeout(function () {
      highMeterBox.style.display = "block";
      previewBox.style.display = "none";
    }, 3000);
  }
}
/*编辑图片*/
let mian_bg = document.getElementsByClassName("mian_bg")[0];
let bigImg = document.getElementsByClassName("bigImg")[0];

window["isSendNote"] = false; // 获取签名前必须推送文档给在押端
function showBigPhoto(ev) {
  mian_bg.style.display = "block";
  bigImg.src = ev.src;
  cutPhoto(bigImg, ev);
}
function cutPhoto(ev, smallEv) {
  /*先把上次的图片编辑注销*/
  if (cro) {
    cro.destroy();
  }
  const cropper = new Cropper(ev, {
    minCropBoxWidth: 152,
    minCropBoxHeight: 52,
    background: false,
  });
  cro = cropper;
  /*确认裁剪*/
  let confirm = document.getElementsByClassName("confirm")[0];
  confirm.onclick = function () {
    ev.src = cropper.getCroppedCanvas().toDataURL("image/jpeg");
    base64Img[smallEv.dataset.id] = ev.src;
    smallEv.src = ev.src;
    cropper.destroy();
    mian_bg.style.display = "none";
    /*确定裁剪后重新选择该图片*/
    chooseBigPhoto(smallEv, false);
  };
  /*退出弹窗*/
  let bigImgOut = document.getElementById("bigImgOut");
  bigImgOut.onclick = function () {
    mian_bg.style.display = "none";
    /*确定裁剪后重新选择该图片*/
    chooseBigPhoto(smallEv, false);
  };
  /*左旋*/
  let leftScale = document.getElementsByClassName("leftScale")[0];
  leftScale.onclick = function () {
    cropper.rotate(-90);
  };
  /*右旋*/
  let rightScale = document.getElementsByClassName("rightScale")[0];
  rightScale.onclick = function () {
    cropper.rotate(90);
  };
}
/*删除\增加图片重新遍历*/
function deleteAndAddImg(idx = -1) {
  // 先清空原来的
  let node = document.getElementById("highMeterPhoto");
  node.innerHTML = `<select id="resoultion" style="display: none;">
									<option value="0">3664*2744</option>
								</select>`;
  let string;
  for (let i = 0; i < base64Img.length; i++) {
    string = `<div class="scanSmall scanFile" style="position: absolute;top:${
      134 * i
    }px">
                            <div>
                            	<img class="CameraPhoto image" data-id="${i}" src="${
      base64Img[i]
    }" style="width: 100%;height: 100%;" onmousedown="chooseBigPhoto(this)" />
                            </div>
                            <p>
                                <span class="number">${i + 1}</span>
                            </p>
                        </div>`;
    node.insertAdjacentHTML("beforeend", string);
  }
  if (idx == -1) {
    /*重新遍历后选择照片为空*/
    highPhotoIdx = -1;
  }
}
/*选择照片*/
function chooseBigPhoto(el, move = true) {
  /*选择*/
  let elementStyle = document.getElementsByClassName("scanFile");
  for (let i = 0; i < elementStyle.length; i++) {
    elementStyle[i].style.border = "1px solid rgba(0,0,0,0)";
  }
  el.parentElement.parentElement.style.border = "1px solid #4EA5CC";
  highPhotoIdx = el.dataset.id;
  highPhoto = el;
  /*拖动*/
  if (move) {
    let ev = window.event || arguments.callee.caller.arguments[0];
    ev.stopPropagation() ? ev.stopPropagation() : (ev.cancelBubble = true);
    //兼容去除默认(必须)
    ev.preventDefault ? ev.preventDefault() : (returnValue = false);
    ev = ev || window.event;
    //鼠标位置-物体离定位位置左/上距离
    let y = ev.clientY - el.parentElement.parentElement.offsetTop;
    document.onmousemove = function (ev) {
      ev = ev || window.event;
      let top = ev.clientY - y;
      el.parentElement.parentElement.style.top = top + "px";
      if (parseInt(el.parentElement.parentElement.style.top) <= 0) {
        el.parentElement.parentElement.style.top = "0px";
      }
      if (
        parseInt(el.parentElement.parentElement.style.top) >=
        (base64Img.length - 1) * 134
      ) {
        el.parentElement.parentElement.style.top =
          (base64Img.length - 1) * 134 + "px";
      }
      document.onmouseup = function () {
        for (let i = 0; i < base64Img.length; i++) {
          if (
            parseInt(el.parentElement.parentElement.style.top) >=
              i * 134 - 10 &&
            parseInt(el.parentElement.parentElement.style.top) <= i * 134 + 10
          ) {
            base64Img.splice(highPhotoIdx, 1);
            base64Img.splice(i, 0, el.src);
            deleteAndAddImg();
            for (let j = 0; j < elementStyle.length; j++) {
              elementStyle[j].style.border = "1px solid rgba(0,0,0,0)";
            }
            elementStyle[i].style.border = "1px solid #4EA5CC";
            highPhotoIdx = i;
            highPhoto = elementStyle[i].children[0].children[0];
            break;
          } else if (i == base64Img.length - 1) {
            deleteAndAddImg(highPhotoIdx);
            elementStyle[highPhotoIdx].style.border = "1px solid #4EA5CC";
            break;
          }
        }
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
    document.onmouseup = function () {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  }
  /*预览*/
  previewImg(base64Img[highPhotoIdx], false);
}
/*推送*/
document.getElementById("sendPhoto").onclick = function (ev) {
  if (highPhotoIdx == -1) {
    notice("未选择文件!", "error");
  } else {
    socket.emit("sendPhoto", {
      roomId: message.roomId,
      content: base64Img[highPhotoIdx],
    });
    notice("推送成功!", "success");
  }
};
/*编辑*/
document.getElementsByClassName("editThisPhoto")[0].onclick = function (ev) {
  if (highPhotoIdx == -1) {
    notice("未选择文件！", "error");
  } else {
    showBigPhoto(highPhoto);
  }
};
/*删除*/
document.getElementsByClassName("deleteThisPhoto")[0].onclick = function (ev) {
  if (highPhotoIdx == -1) {
    notice("未选择文件！", "error");
  } else {
    document.getElementsByClassName("mian_bg3")[0].style.display = "block";
  }
};
document.getElementById("cancelGuaDuan2").onclick = function () {
  document.getElementsByClassName("mian_bg3")[0].style.display = "none";
};
document.getElementById("confirmGuaDuan2").onclick = function () {
  base64Img.splice(highPhotoIdx, 1);
  //删除节点
  deleteAndAddImg();
  /*右边空白*/
  let highMeterBox = document.getElementById("highMeterBox");
  let previewBox = document.getElementById("previewBox");
  highMeterBox.style.display = "none";
  previewBox.style.display = "none";
  document.getElementsByClassName("mian_bg3")[0].style.display = "none";
};

/*编辑器*/
const um = UM.getEditor("editor", {
  lang: /^zh/.test(
    navigator.language || navigator.browserLanguage || navigator.userLanguage
  )
    ? "zh-cn"
    : "en",
  langPath: UMEDITOR_CONFIG.UMEDITOR_HOME_URL + "lang/",
  focus: true,
  pageBreakTag: "<!–nextpage–>",
  toolbar: [
    " undo redo | bold italic underline strikethrough | superscript subscript | forecolor backcolor |",
    "| justifyleft justifycenter justifyright justifyjustify |",
    "insertorderedlist insertunorderedlist | selectall cleardoc fontsize",
    "| horizontal noteTemplate print",
  ],
  initialStyle: ".edui-editor-body .edui-body-container p{margin:16px 0}",
});
let templateArr = [];
let currentIndex = 0;
let lastIndex = 0;
// 获取笔录模板
let id = localStorage.getItem("arraignmentId");
$.ajax({
  type: "post",
  url: socketUrl + ":8200/inquiry/inquiryRoomInfo/getTranscriptTemp",
  data: '{"id":"' + id + '", "currency": true}',
  dataType: "json",
  contentType: "application/json",
  success: function (res) {
    if (res.state.code == 200) {
      templateArr = res.data;
      templateArr.forEach((item) => {
        // 添加是否为默认模板的标志位
        item.isCommon = true;
      });
      if (templateArr.length > 0) {
        paintTemplate(templateArr);
        $(".templateBox").children().eq(0).addClass("active");
      }
    }
  },
  error: function (err) {},
});
let template = document.getElementsByClassName("template")[0];
document
  .getElementsByClassName("edui-btn edui-btn-noteTemplate")[0]
  .addEventListener("click", function () {
    template.style.display = "block";
  });
let storeBox = document.getElementsByClassName("storeBox")[0];
// 暂存模板
function stageTemplate() {
  const lastTemp = templateArr[lastIndex];
  if (lastTemp.isCommon) {
    let newTemp = {
      fileName: "用户-" + lastTemp.fileName,
      pageCount: lastTemp.pageCount,
      imgPath: lastTemp.imgPath,
      content: um.getContent(),
      isGlobal: false,
      isCommon: false,
    };
    templateArr.push(newTemp);
  } else {
    lastTemp.content = um.getContent();
  }
  changeTemplateStatus(currentIndex);
  storeBox.style.display = "none";
}
// 丢弃 模板
function discardTemplate() {
  changeTemplateStatus(currentIndex);
  storeBox.style.display = "none";
}
function changeTemplateStatus(index) {
  paintTemplate(templateArr);
  const templateBox = $(".templateBox");
  templateBox.children().removeClass("active");
  templateBox.children().eq(index).addClass("active");
  setTimeout(function () {
    let content =
      typeof templateArr[index] != "undefined"
        ? templateArr[index].content
        : "";
    um.setContent(content, false);
    template.style.display = "none";
  }, 500);
  lastIndex = index;
}
let chooseTime = 0;
function storeBoxBlock(index) {
  if (chooseTime != 0) {
    storeBox.style.display = "block";
    currentIndex = index;
  } else {
    changeTemplateStatus(index);
  }
  chooseTime++;
}
let templateBox = document.getElementsByClassName("templateBox")[0];
function paintTemplate(arr) {
  let html = "";
  for (let index = 0; index < arr.length; index++) {
    const item = arr[index];
    html += '<div onclick="storeBoxBlock(' + index + ')">';
    html += '<img src="' + item.imgPath + '"/>';
    if (item.isGlobal) {
      html += "<p>" + item.fileName + "</p>";
      html += "<span>" + item.pageCount + "页</span>";
      html += "</div>";
    } else {
      html +=
        '<p><img src="/assets/mine.png" style="display: inline-block;width: 12px;height: 12px"/>';
      html += "<span>" + item.fileName + "</span></p>";
      html += "<span>" + item.pageCount + "页</span>";
      html += "</div>";
    }
    templateBox.innerHTML = html;
  }
}
// 监听滚轮事件
let eduiEditorBody = document.getElementsByClassName("edui-editor-body")[0];
let scrollNow = 0;
eduiEditorBody.onscroll = function () {
  scrollNow = eduiEditorBody.scrollTop;
  socket.emit("sendScroll", {
    roomId: message.roomId,
    scroll: eduiEditorBody.scrollTop,
  });
};
document.getElementById("sendNote").addEventListener(
  "click",
  function () {
    socket.emit("sendNote", {
      roomId: message.roomId,
      content: um.getContent(),
      scroll: scrollNow,
    });
    isSendNote = true;
    notice("推送成功", "success");
  },
  false
);
let editor = document.getElementById("editor");
let x = 0;
let y = 0;
editor.addEventListener(
  "click",
  function (ev) {
    x = ev.pageX - editor.getBoundingClientRect().left;
    y = ev.pageY - editor.getBoundingClientRect().top;
  },
  false
);
editor.oncontextmenu = function (ev) {
  ev.preventDefault() ? ev.preventDefault() : (ev.returnValue = false);
};

/*签名版*/
let noteSignImg = -1;
document.onclick = function (ev) {
  if (ev.target.className != "ppCanvas") {
    let imgg = document.getElementsByClassName("ppCanvas");
    for (let i = 0; i < imgg.length; i++) {
      imgg[i].style.border = "2px solid transparent";
      let next = imgg[i].nextElementSibling;
      next.style.display = "none";
    }
    noteSignImg = -1;
  }
};
function move(el) {
  let imgg = document.getElementsByClassName("ppCanvas");
  for (let i = 0; i < imgg.length; i++) {
    imgg[i].style.border = "2px solid transparent";
    let next = imgg[i].nextElementSibling;
    next.style.display = "none";
    if (imgg[i] == el) {
      noteSignImg = i;
      el.style.border = "2px solid red";
      el.nextElementSibling.style.display = "block";
    }
  }
}
function remove(el) {
  let ppCanvasBox = document.getElementById("ppCanvasBox");
  ppCanvasBox.removeChild(el.parentElement);
}
function fuzhi(el) {
  let editor = document.getElementById("editor");
  let ppCanvas = document.getElementsByClassName("ppCanvas");
  if (ppCanvas.length == 0) {
    editor.insertAdjacentHTML(
      "afterbegin",
      '<p id="ppCanvasBox" style="margin:0;position:relative;"></p>'
    );
  }
  let a = document.getElementById("ppCanvasBox");
  a.insertAdjacentHTML(
    "afterbegin",
    `<img class="ppCanvas" src="${
      el.src
    }" alt="" style="position:absolute;left:30px;top:${
      editor.parentElement.scrollTop + 30
    }px;z-index:1000;cursor:pointer;border:2px solid transparent;" onmouseenter="move(this)">`
  );
}
function shanchu() {
  let editor = document.getElementById("ppCanvasBox");
  let imgg = document.getElementsByClassName("ppCanvas");
  if (noteSignImg != -1) {
    editor.removeChild(imgg[noteSignImg]);
  } else {
    notice("没有选中签名!", "error");
  }
}

let recordedBlobs;
let mediaRecorder;
function startRecording() {
  recordedBlobs = [];
  let options = { mimeType: "video/webm;codecs=vp9" };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm;codecs=vp8" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "" };
      }
    }
  }

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    return;
  }

  mediaRecorder.onstop = (event) => {};
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10);
  setTimeout(() => {
    stopRecording();
    downloadWebM();
  }, 300000);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function stopRecording() {
  mediaRecorder.stop();
}
let fileNumber = 0;
function downloadWebM() {
  fileNumber = fileNumber + 1;
  const blob = new Blob(recordedBlobs, { type: "video/webm" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  const fileName = room + "_" + fileNumber + ".webm";
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
  burnerAdd(fileName);
}

// 传递房间和文件名
function burnerAdd(fileName) {
  let url = socketUrl + ":8200/inquiry/burnerOperate/burnerAdd";
  let data = '{"room":"' + room + '","fileName":"' + fileName + '"}';
  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json",
    data: data,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {},
  });
}

// 询问是否刻录
function askVideotapeBlock() {
  askVideotape("start", "0");
}
function askVideotape(type, videotape, arraignmentId) {
  let data;
  let url;
  if (type == "start") {
    data = '{"roomIndex":"1", "bNotBurn":"' + videotape + '"}';
    url = "http://127.0.0.1/InquestStartCDW";
  } else {
    data = '{"roomIndex":"1","bCancelWrite":"0" }';
    url = "http://127.0.0.1/InquestStopCDW";
  }
  $.ajax({
    type: "post",
    url: url,
    data: data,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {
      if (type == "end") {
        let msg;
        try {
          msg = GktelCefConfig.inquestResumeSegment;
        } catch (err) {
          msg = "{}";
        }
        let caseNo = localStorage.getItem("caseNo");
        let newMeg = Object.assign(
          {
            room: message.roomId,
            arraignmentId: arraignmentId,
            caseNo,
            time: 15,
          },
          JSON.parse(msg)
        );
        meetVideoMessage(newMeg);
        location.href = socketUrl + ":3001/login";
      }
    },
  });
  if (type == "start") {
    startLive();
    document.getElementsByClassName("mian_bg4")[0].style.display = "none";
  }
}
function askVideoKickOuttape(type, videotape, arraignmentId) {
  let data;
  let url;
  if (type == "start") {
    data = '{"roomIndex":"1", "bNotBurn":"' + videotape + '"}';
    url = "http://127.0.0.1/InquestStartCDW";
  } else {
    data = '{"roomIndex":"1","bCancelWrite":"0" }';
    url = "http://127.0.0.1/InquestStopCDW";
  }
  $.ajax({
    type: "post",
    url: url,
    data: data,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {
      if (type == "end") {
        let msg;
        try {
          msg = GktelCefConfig.inquestResumeSegment;
        } catch (err) {
          msg = "{}";
        }
        let caseNo = localStorage.getItem("caseNo");
        let newMeg = Object.assign(
          {
            room: message.roomId,
            arraignmentId: arraignmentId,
            caseNo,
            time: 15,
          },
          JSON.parse(msg)
        );
        meetVideoKickOutMessage(newMeg);
        let guaduanTimer = setTimeout(function () {
          location.href = socketUrl + ":3001/login";
          clearTimeout(guaduanTimer);
        }, 3000);
      }
    },
  });
  if (type == "start") {
    startLive();
    document.getElementsByClassName("mian_bg4")[0].style.display = "none";
  }
}
// 更改案件的提讯次数、提讯时长
async function arraignmentEnd(caseNo, time) {
  let url = socketUrl + ":8200/inquiry/inquiryManagement/arraignmentEnd";
  let data = '{"caseNo":"' + caseNo + '","time":"' + time + '"}';
  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json",
    data: data,
    async: false,
    success: function (result) {
      if (result.status == "200") {
      }
    },
    error: function (err) {},
  });
}
document.getElementById("confirmGuaDuan").onclick = hangUp;
/*提供给浏览器使用*/
function hangUp(type) {
  let arraignmentId = localStorage.getItem("arraignmentId");
  let caseNo = localStorage.getItem("caseNo");
  templateArr = [];
  socket.emit("sendQuit", {
    roomId: message.roomId,
    status: type || "logOut",
  });
  arraignmentEnd(caseNo, hearingTime);
  if (type == "kickOut" || type == undefined) {
    askVideoKickOuttape("end", "0", arraignmentId);
  } else {
    askVideotape("end", "0", arraignmentId);
  }

  let roomId = localStorage.getItem("url");
  saveVideoMessage({ type: "2", room: roomId });
  saveVideoMessage({ type: "2", room: room });
  // 清理登录缓存
  let storage = JSON.parse(JSON.stringify(localStorage));
  if (Object.keys(storage).length) {
    Object.keys(storage).forEach((key) => {
      if (key != "roomNo" && key != "meetingType") {
        localStorage.removeItem(key);
      }
    });
  }
}

/*退出*/
document.getElementById("logout").onclick = logout;
function logout() {
  let arraignmentId = localStorage.getItem("arraignmentId");
  templateArr = [];
  socket.emit("sendQuit", {
    roomId: message.roomId,
    status: "arraignmentId",
  });
  askVideotape("end", "0", arraignmentId);
  let msg;
  try {
    msg = GktelCefConfig.inquestResumeSegment;
  } catch (err) {
    msg = "{}";
  }
  let endTime = dateFormat("YYYY-MM-DD hh:mm:ss", new Date());
  let caseNo = localStorage.getItem("caseNo");
  let newMeg = Object.assign(
    { room: message.roomId, caseNo },
    { endTime: endTime },
    JSON.parse(msg)
  );
  meetVideoMessage(newMeg);
  $.ajax({
    type: "post",
    url: "http://127.0.0.1/EnvironmentExit",
    success: function (str) {},
    error: function () {},
  });
  // 清理登录缓存
  let storage = JSON.parse(JSON.stringify(localStorage));
  if (Object.keys(storage).length) {
    Object.keys(storage).forEach((key) => {
      if (key != "roomNo" && key != "meetingType") {
        localStorage.removeItem(key);
      }
    });
  }
}
