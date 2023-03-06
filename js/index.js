// pro
let socketUrl = "http://192.168.1.54";
// dev
// let socketUrl = "http://localhost";

const iceServersConfig = {
  iceServers: [
    {
      urls: ["stun:68.232.28.46:3488", "stun:192.168.1.56:3488"],
    },
    {
      urls: ["turn:68.232.28.46:3478", "turn:192.168.1.56:3478"],
      username: "admin",
      credential: "gktel12345",
    },
  ],
};

// 点击音量
function clickVoice(ele, eleBtn) {
  if (!ele.muted) {
    eleBtn.src = "../assets/videoVoiceMuted.png";
  } else {
    eleBtn.src = "../assets/videoVoice.png";
  }
  ele.muted = !ele.muted;
  return false;
}
// 调节音量
function changeVoice(ev, ele, eleBtn, volume, volumeBar) {
  ele.muted = false;
  let percentage;
  if (ev.target == volumeBar) {
    percentage = (volumeBar.offsetHeight - ev.offsetY) / volumeBar.offsetHeight;
  } else {
    percentage = (volume.offsetHeight - ev.offsetY) / volumeBar.offsetHeight;
  }
  // 解决border误差
  if (percentage <= 0.98) {
    volume.style.height = percentage * 100 + "px";
  } else {
    volume.style.height = volumeBar.offsetHeight - 2 + "px";
  }
  if (percentage > 1) {
    percentage = 1;
  }
  ele.volume = percentage;
  if (ele.volume == 0) {
    eleBtn.src = "../assets/videoVoiceMuted.png";
  } else {
    eleBtn.src = "../assets/videoVoice.png";
  }
}
//进入全屏
function FullScreen(ele) {
  if (ele.requestFullscreen) {
    ele.requestFullscreen();
  } else if (ele.mozRequestFullScreen) {
    ele.mozRequestFullScreen();
  } else if (ele.webkitRequestFullScreen) {
    ele.webkitRequestFullScreen();
  }
}
//退出全屏
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
}

// 调用麦克风、摄像头
function startLive() {
  return new Promise(async (resolve, reject) => {
    let stream;
    let videoId = "";
    try {
      await navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
        for (let i = 0; i !== deviceInfos.length; ++i) {
          const deviceInfo = deviceInfos[i];
          if (deviceInfo.kind == "videoinput") {
            // 外置摄像头为（罗技高清网络摄像机 C930c (046d:0891)）, 一体机摄像头为（PC Camera (058f:3861)）
            if (deviceInfo.label.includes("C930c")) {
              videoId = deviceInfo.deviceId;
              break;
            } else if (deviceInfo.label.includes("Camera")) {
              videoId = deviceInfo.deviceId;
            }
          }
        }
      });
      // 尝试调取本地摄像头/麦克风
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: videoId,
        },
        audio: true,
      });
      // 摄像头/麦克风获取成功
      localVideo.srcObject = stream;
    } catch (err) {
      // 摄像头/麦克风获取失败
      notice("获取摄像头/麦克风失败!", "error");
      reject();
      return;
    }
    // 流程开始,将媒体轨道添加到轨道集
    try {
      stream.getTracks().map((track) => {
        peer.addTrack(track, stream);
      });
    } catch (error) {
      console.log("addTrack error");
    }
    resolve(stream);
  });
}

// 通知提醒
function notice(text, type, time = 3000) {
  let notice = document.getElementById("notice");
  let noticeIcon = document.getElementById("noticeIcon");
  let noticeText = document.getElementById("noticeText");
  if (notice.style.display == "none") {
    notice.style.display = "block";
    $("#notice").animate({ top: "30px" });
    noticeText.innerHTML = text;
    if (type == "success") {
      notice.style.border = "1px solid rgba(20,141,249,1)";
      notice.style.boxShadow = "inset 0 0 15px rgba(20,141,249,0.5)";
      noticeIcon.style.background = 'url("../assets/success.png") no-repeat';
    } else if (type == "error") {
      notice.style.border = "1px solid rgba(255,0,0,1)";
      notice.style.boxShadow = "inset 0 0 15px rgba(255,0,0,0.5)";
      noticeIcon.style.background = 'url("../assets/error.png") no-repeat';
    } else {
      notice.style.border = "1px solid rgba(234,149,39,1)";
      notice.style.boxShadow = "inset 0 0 15px rgba(234,149,39,0.5)";
      noticeIcon.style.background = 'url("../assets/warn.png") no-repeat';
    }
    if (time) {
      let timer = setTimeout(function () {
        notice.style.display = "none";
        $("#notice").animate({ top: "0" });
      }, time);
    }
  } else {
    return;
  }
}

function closeNotice() {
  document.getElementById("notice").style.display = "none";
  $("#notice").animate({ top: "0" });
}

// 系统登录
function confirm() {
  let value = document.getElementById("login").value;
  if (value) {
    let room = localStorage.getItem("roomNo");
    let params = { room, value };
    $.ajax({
      type: "post",
      url: socketUrl + ":8200/inquiry/inquiryManagement/findInqueryByCode",
      async: true,
      data: JSON.stringify(params),
      dataType: "json",
      contentType: "application/json",
      success: function (res) {
        if (res.state.code == 200) {
          const { data } = res;
          if (data.roomStatus == 1) {
            const socket = io(socketUrl + ":3001");
            socket.emit("sendHangUp", data.remoteRoom);
            $.ajax({
              type: "get",
              url: socketUrl + ":8200/inquiry/inquiryRoomInfo/updateRoomStatus",
              dataType: "json",
              contentType: "application/json",
              data: { roomStatus: 3, roomNo: data.url },
              async: false,
              success: function () {
                loginSystem(data);
              },
              error: function (err) {},
            });
          } else {
            loginSystem(data);
          }
        } else {
          notice(res.state.msg, "error");
        }
      },
      error: function (err) {
        notice("请求错误", err);
      },
    });
  } else {
    notice("验证码不能为空", "error");
  }
}

// 回车登录
window.onkeydown = function (e) {
  if (e.keyCode == 13) {
    confirm();
  }
};

// 跳转
function loginSystem(data) {
  const { caseName, interrogator, xm, url } = data;
  let message = { caseName, interrogator, xm };
  let roomId = { roomCode: url };
  localStorage.setItem("url", url);
  passMessage(JSON.stringify(message));
  passRoom(JSON.stringify(roomId));
  localStorage.setItem("remoteSigned", data.remoteSigned);
  localStorage.setItem("arraignmentId", data.id);
  localStorage.setItem("caseNo", data.caseNo);
  location.href = socketUrl + ":3001/lawyer/" + data.url;
}

// 传递数据到客户端
function passMessage(data) {
  $.ajax({
    type: "post",
    url: "http://127.0.0.1/SetShowString",
    data: data,
    success: function (res) {},
    error: function () {},
  });
}

// 传房间号到客户端
function passRoom(data) {
  $.ajax({
    type: "post",
    url: "http://127.0.0.1/SetCameraByRoomInfo",
    data: data,
    success: function (res) {},
    error: function () {},
  });
}

// 退出系统
function logout() {
  $.ajax({
    type: "post",
    url: "http://127.0.0.1/EnvironmentExit",
    success: function (res) {},
    error: function () {},
  });
}
