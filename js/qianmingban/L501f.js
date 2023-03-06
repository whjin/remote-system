/* global jQuery */
/*eslint-disable*/

"use strict";

// API Url

var apiUrl = "";
try {
  let ip = localStorage.getItem("remoteSigned");
  apiUrl = "http://" + ip + ":8089/PPSignSDK/";
} catch (e) {
  apiUrl = "http://" + location.hostname + ":8089/PPSignSDK/";
}
// initialize device web api
var initUrl = apiUrl + "InitialDevice?id=7&width=740&height=480";
// uninitialize device web api
var uninitUrl = apiUrl + "UninitialDevice?id=7";
// get ink web api
var getInkUrl = apiUrl + "GetInks";
// get fingerprint ink api
var getFingerPrintUrl = apiUrl + "GetFingerPrintImage?FPImageOnly=0";
// set fp img api
var setDisplayedFPImageAtUrl =
  apiUrl +
  "SetDisplayedFPImageAt?nCanvasWidth=140&nCanvasHeight=280&nLeft=20&nTop=65&nWidth=100&nHeight=150";
// clear ink api
var clrInkUrl = apiUrl + "Clear";
// open & close LCD api
var oplcdUrl = apiUrl + "OpenLCD";
var cllcdUrl = apiUrl + "CloseLCD";
// get pen width api
var penwidthUrl = apiUrl + "SetPenWidth?Width=";
// get pen style api
var penstyUrl = apiUrl + "SetPenStyle?Style=";
// get save drawing api
var savedrawUrl = apiUrl + "SaveDrawingImage?";
// get size api
var getsizeUrl = apiUrl + "GetSize";
// get point api
var getpointUrl = apiUrl + "GetPointer";
// get about api
var aboutUrl = apiUrl + "About";
// get Version ID api ( for L398 & E560 )
var veridUrl = apiUrl + "VersionID";
// get pen ID api ( for L398 & E560 )
var penidUrl = apiUrl + "PenID";
// get pad ID api ( for L398 & E560 )
var padidUrl = apiUrl + "PadID";
// Display device information in LCD api ( only for L398 )
var diilUrl = apiUrl + "DisplayDeviceInfoInLCD?show=";
// Get device information api
var devinfoUrl = apiUrl + "GetDeviceInfo?type=";
// get Encode api
var encodeUrl = apiUrl + "Encode?type=";
// get Decode api
var decodeUrl = apiUrl + "Decode?type=";
// get Set clip api
var setclipUrl = apiUrl + "SetClip";
// get valid api
var validUrl = apiUrl + "IsValid";
// save device data api
var savedataUrl = apiUrl + "SaveDeviceData";
// read device data api
var readdataUrl = apiUrl + "ReadDeviceData";
// save device data api
var cleardataUrl = apiUrl + "ClearDeviceData";
// Get Decode File Path
var decodepathUrl = apiUrl + "GetDecodeFilePath";
// GetDeviceConfirmOrCancelKeyStatus
var confirmStatusUrl = apiUrl + "GetDeviceConfirmOrCancelKeyStatus";
// Save draw video
var saveDrawingVideoUrl = apiUrl + "SaveDrawingVideo";
// Get video base64 code
var getDrawingVideoBase64DataUrl = apiUrl + "GetDrawingVideoBase64Data";
// Enable Save Video Data
var enableSaveVideoDataUrl = apiUrl + "EnableSaveVideoData?show=1";
var disableSaveVideoDataUrl = apiUrl + "EnableSaveVideoData?show=0";
var saveFPUrl = apiUrl + "SaveFPImage?";
var TestApi = apiUrl + "Test";
// 登录
var loginApi = "";

var canvas;
var context;
var FPcanvas;
var FPcontext;

var isPolling = false;
var isInitDevice = false; //初始化签名板，避免重复调用

var filenameCache = "";
var checkVideoIsGeneratge = false;
var isFirstPlay = true;

var LastVideoBase64Resp;

function TestHandShake() {
  $.ajax({
    url: TestApi,
    type: "GET",
    cache: false,
  })
    .done(function () {})
    .fail(function () {});
}

// initialize device
function initDevice() {
  //event.preventDefault();
  // alert(apiUrl);
  if (!isSendNote) {
    notice("请先推送文档！", "error");
    return false;
  }
  if (!isInitDevice) {
    if (!um.isFocus()) {
      notice("选中签名位置!", "error");
      return false;
    }
    isInitDevice = true;
    $.ajax({
      url: initUrl,
      type: "GET",
      cache: false,
    })
      .done(function (response) {
        if (response == true) {
          isPolling = true;
          getInk();
          setDisplayedFPImageAt();
          getStatus();

          $(".init").removeAttr("disabled");
          $("#initBtn").attr("disabled", "disabled");
          // document.getElementById('VideoStatusBtn').innerHTML = 'Enable';
        } else {
          // alert('No device!');
          notice("没有检测到签名板!", "error");
          isInitDevice = false;
        }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        // alert('Connection fail(' + jqXHR.status + ')!');
        notice("检测签名板请求失败！", "error");
        // notice("Connection fail(" + jqXHR.status + ")!", "error");
        isInitDevice = false;
      });
  } else {
    notice("等待在押人员签名，请稍后！", "error");
  }
}

function setDisplayedFPImageAt() {
  $.ajax({
    url: setDisplayedFPImageAtUrl,
    type: "GET",
    cache: false,
  }).done(function (response) {
    getFPInk();
  });
}

// uninitialize device
function uninitDevice() {
  //event.preventDefault();
  isPolling = false;
  $.ajax({
    url: uninitUrl,
    type: "GET",
    cache: false,
  }).done(function (response) {
    if (response == true) {
      var encodeArea = $("#encode");
      var decodeArea = $("#decode");
      try {
        var canvas = document.getElementById("ppCanvas");
        context.clearRect(0, 0, canvas.width, canvas.height);
        var FPcanvas = document.getElementById("ppfpCanvas");
        FPcontext.clearRect(0, 0, FPcanvas.width, FPcanvas.height);
      } catch (e) {}
      encodeArea.html("");
      decodeArea.html("");

      $(".init").attr("disabled", "disabled");
      $(".videoControl").attr("disabled", "disabled");
      $("#initBtn").removeAttr("disabled");
    }
    isInitDevice = false;
    um.blur();
  });
}

// switch initialize
$("#initSwitch").click(function () {
  if ($(this).prop("checked")) {
    initDevice();
  } else {
    uninitDevice();
  }
});

// initialize canvas and setup context
window.onload = function () {
  TestHandShake();
  canvas = document.getElementById("ppCanvas");

  if (canvas.getContext) {
    context = canvas.getContext("2d");
  }

  FPcanvas = document.getElementById("ppfpCanvas");

  if (FPcanvas.getContext) {
    FPcontext = FPcanvas.getContext("2d");
  }
};

window.onbeforeunload = function (e) {
  if (isPolling) {
    uninitDevice();
    var milliseconds = 1000;
    var start = new Date().getTime();

    while (true) {
      if (new Date().getTime() - start > milliseconds) {
        break;
      }
    }
  }
};

function getStatus() {
  // 用polling的方式向self-host發送request取得簽名板按鈕status
  (function poll() {
    var timeId = setTimeout(function () {
      clearTimeout(timeId);

      // 取得狀態
      if (isPolling) {
        $.ajax({
          url: confirmStatusUrl,
          type: "GET",
          cache: false,
        })
          .done(function (result) {
            if (result == "2") {
            } else if (result == "1") {
              notice("在押人员已提交", "success");
              /*当签名版点击确定时将签名与指纹的src传到小图，同时签名版关闭*/
              let CanvasSrc = [ppfpCanvasSrc, ppCanvasSrc];
              SynthesisCanvasSrc(CanvasSrc);
              uninitDevice();
              isInitDevice = false;
            } else if (result == "0") {
              clearInk();
            }
          })
          .fail(function () {
            console.log("Fail to get confirmed status!");
          })
          .always(function () {
            if (isPolling) {
              poll();
            } else {
            }
          });
      }
    }, 500);
  })();
}

function SynthesisCanvasSrc(CanvasSrc) {
  let myImage = document.createElement("canvas");
  myImage.width = 150;
  myImage.height = 100;
  let cxt = myImage.getContext("2d");
  function cc(n) {
    if (n <= 1) {
      let img = new Image();
      img.src = CanvasSrc[n];
      img.onload = function () {
        if (n == 0) {
          cxt.drawImage(img, 30, -60, 105, 210);
        } else {
          cxt.drawImage(img, 0, 0, 148, 96);
        }
        cc(n + 1);
      };
    } else {
      let base64 = myImage.toDataURL();
      if (um.isFocus()) {
        // 方法1 李军
        let bk_start = um.selection.getRange().createBookmark().start; // 创建一个临时dom，用于获取当前光标的坐标
        bk_start.parentElement.style.position = "relative";
        bk_start.id = "ppCanvasBox";
        bk_start.style.display = "inline-block";
        bk_start.style.width = "154px";
        bk_start.style.height = "104px";
        bk_start.style.position = "absolute";
        bk_start.style.top = "-52px";
        bk_start.style.marginLeft = "-86px";
        var signImg = `<img class="ppCanvas" src="${base64}" alt="" style="float:left;cursor:pointer;border:2px solid transparent;" onclick="move(this)" />
            <span class="fuzhiAndShanchu" style="position:absolute;right: 0;top: 0;text-indent:0;display: none;" onclick="remove(this)">-</span>`;
        bk_start.innerHTML = signImg;
      } else {
        // 原来逻辑 一般不会进来这里
        // let ppCanvas = document.getElementsByClassName('canvasAll')[0];
        // ppCanvas.src = base64;
        let editor = document.getElementById("editor");
        let ppCanvas = document.getElementsByClassName("ppCanvas");
        if (ppCanvas.length == 0) {
          editor.insertAdjacentHTML(
            "afterbegin",
            '<p id="ppCanvasBox" style="margin:0;z-index: 100;" ondragstart="return false;"></p>'
          );
        }
        let a = document.getElementById("ppCanvasBox");
        a.insertAdjacentHTML(
          "afterbegin",
          `<div style="position:absolute;left:${
            Number(x) - 70 < 0 ? 0 : Number(x) - 70 > 550 ? 550 : Number(x) - 70
          }px;top:${
            Number(y) - 50 > 0 ? Number(y) - 50 : 0
          }px;width:154px;height:104px;overflow: hidden;">
                              <img class="ppCanvas" src="${base64}" alt="" style="z-index:1000;cursor:pointer;border:2px solid transparent;" onclick="move(this)">
                              <span class="fuzhiAndShanchu" style="position:absolute;right: 0;top: 0;display: none;" onclick="remove(this)">-</span>
                          </div>`
        );
      }
    }
  }
  cc(0);
}

function enableSaveVideoData() {
  $.ajax({
    url: enableSaveVideoDataUrl,
    type: "GET",
    cache: false,
  }).done(function () {
    clearInk();
    document.getElementById("VideoStatusBtn").innerHTML = "Disable";
    $(".videoControl").removeAttr("disabled");
  });
}

function disableSaveVideoData() {
  $.ajax({
    url: disableSaveVideoDataUrl,
    type: "GET",
    cache: false,
  }).done(function () {
    clearInk();
    document.getElementById("VideoStatusBtn").innerHTML = "Enable";
    $(".videoControl").attr("disabled", "disabled");
  });
}

function getFPInk() {
  (function poll() {
    var timeId = setTimeout(function () {
      clearTimeout(timeId);

      if (isPolling) {
        $.ajax({
          url: getFingerPrintUrl,
          type: "GET",
          cache: false,
        })
          .done(function (data) {
            var dataInfos = JSON.parse(data);
            dataInfos.forEach(function (value) {
              if (value.EventType == 3) {
                drawFPImage(value.Image);
              }
            });
          })
          .always(function () {
            if (isPolling) {
              poll();
            } else {
            }
          });
      }
    }, 50);
  })();
}

let ppfpCanvasSrc = "";
function drawFPImage(base64) {
  var dataUrl = "data:image/png;base64,";

  dataUrl = dataUrl + base64;

  // 在image中載入圖檔，再畫到canvas呈現
  var img = new Image();

  img.addEventListener(
    "load",
    function () {
      FPcontext &&
        FPcontext.drawImage(this, 0, 0, FPcanvas.width, FPcanvas.height);
    },
    false
  );

  img.src = dataUrl;
  ppfpCanvasSrc = dataUrl;
}

function getInk() {
  // 用polling的方式向self-host發送request取得簽名板畫面(base64格式)
  (function poll() {
    var timeId = setTimeout(function () {
      clearTimeout(timeId);

      if (isPolling) {
        $.ajax({
          url: getInkUrl,
          type: "GET",
          cache: false,
        })
          .done(function (data) {
            var dataInfos = JSON.parse(data);
            dataInfos.forEach(function (value) {
              if (value.EventType == 0) {
                drawImage(value.Image);
              }
            });
          })
          .always(function () {
            if (isPolling) {
              poll();
            } else {
            }
          });
      }
    }, 50);
  })();
}
let ppCanvasSrc = "";
function drawImage(base64) {
  var dataUrl = "data:image/png;base64,";

  dataUrl = dataUrl + base64;

  // 在image中載入圖檔，再畫到canvas呈現
  var img = new Image();

  img.addEventListener(
    "load",
    function () {
      context && context.drawImage(this, 0, 0, canvas.width, canvas.height);
    },
    false
  );

  img.src = dataUrl;
  ppCanvasSrc = dataUrl;
}

// clear Ink
function clearInk() {
  $.ajax({
    url: clrInkUrl,
    type: "GET",
    cache: false,
    success: function success() {
      var canvas = document.getElementById("ppCanvas");

      context.clearRect(0, 0, canvas.width, canvas.height);

      var FPcanvas = document.getElementById("ppfpCanvas");

      FPcontext.clearRect(0, 0, FPcanvas.width, FPcanvas.height);
    },
  });
}

// open lcd
function openLcd() {
  $.ajax({
    url: oplcdUrl,
    type: "GET",
    cache: false,
  });
  $(".shutdown").fadeOut("fast");
}
// close lcd
function closeLcd() {
  $.ajax({
    url: cllcdUrl,
    type: "GET",
    cache: false,
  });
  $(".shutdown").fadeIn("fast");
}

// pen width change case
function pwChange() {
  var pwVal = $("#penWidth").val();

  $.ajax({
    url: penwidthUrl + pwVal,
    type: "GET",
    cache: false,
  }).done(function () {
    clearInk();
  });

  // alert( penwidthUrl + pwVal );
}

//  pen style change case
function psChange() {
  var psVal = $("#penStyle").val();

  $.ajax({
    url: penstyUrl + psVal,
    type: "GET",
    cache: false,
  });

  // alert(penstyUrl + psVal);
}

// save drawing images
function saveDrawing() {
  var getsdType = $("#sdType").val();
  var getsdDpi = $("#sdDpi").val();
  var localPath = "DrawImage_" + generateString(5);
  var sdT, sdD;

  switch (getsdType) {
    case "1":
      sdT = ".BMP";
      break;
    case "2":
      sdT = ".JPG";
      break;
    case "3":
      sdT = ".PNG";
      break;
    case "4":
      sdT = ".GIF";
      break;
    case "5":
      sdT = ".TIFF";
      break;
    case "7":
      sdT = ".PDF";
      break;
    case "8":
      sdT = ".SVG";
      break;
  }

  if (getsdDpi == "0") {
    sdD = "150";
  } else {
    sdD = "300";
  }

  $.ajax({
    url:
      savedrawUrl +
      "type=" +
      getsdType +
      "&dpi=" +
      getsdDpi +
      "&path=" +
      localPath +
      sdT,
    type: "GET",
    cache: false,
  }).done(function (resp) {
    if (Boolean(parseInt(resp))) {
      alert("Save file " + localPath + " failed" + ", result=" + resp);
    } else {
      if (
        navigator.userAgent.indexOf("WOW64") != -1 ||
        navigator.userAgent.indexOf("Win64") != -1
      ) {
        alert("File：" + resp + " saved\nDpi：" + sdD);
      } else {
        alert("File：" + resp + " saved\nDpi：" + sdD);
      }
    }
  });
}

function saveVideo() {
  var getsvType = $("#svType").val();
  var getsvFps = $("#svFps").val();
  var localPath = "DrawVideo_" + generateString(5);
  var svT;

  switch (getsvType) {
    case "1":
      svT = ".mp4";
      break;
    case "2":
      svT = ".wmv";
      break;
  }

  $.ajax({
    url:
      saveDrawingVideoUrl +
      "?type=" +
      getsvType +
      "&fpsindex=" +
      getsvFps +
      "&path=" +
      localPath +
      svT,
    type: "GET",
    cache: false,
  }).done(function (resp) {
    $.ajax({
      url: getDrawingVideoBase64DataUrl,
      type: "GET",
      cache: false,
    })
      .done(function (resp2) {
        LastVideoBase64Resp = resp2;

        if (Boolean(parseInt(resp2))) {
          alert("Save video " + localPath + " failed" + ", result=" + resp2);
        } else {
          var RespStruct = JSON.parse(LastVideoBase64Resp)[0];

          if (
            navigator.userAgent.indexOf("WOW64") != -1 ||
            navigator.userAgent.indexOf("Win64") != -1
          ) {
            alert(
              "File：" +
                resp +
                " saved\n" +
                "Received base64 data size :" +
                RespStruct.Image.length +
                "\n" +
                "Rechecked base64 data size :" +
                RespStruct.ImageLength
            );
          } else {
            alert(
              "File：" +
                resp +
                " saved\n" +
                "Received base64 data size :" +
                RespStruct.Image.length +
                "\n" +
                "Rechecked base64 data size :" +
                RespStruct.ImageLength
            );
          }

          filenameCache = resp;

          if (!checkVideoIsGeneratge && !isFirstPlay) {
            playback();
          }
          isFirstPlay = true;
          checkVideoIsGeneratge = true;
        }
      })
      .fail(function () {})
      .always(function () {});
    ///////////////////////////////////////////////////
  });
}

function videoStatusClick() {
  var type = document.getElementById("VideoStatusBtn").innerHTML;
  if (type == "Enable") {
    enableSaveVideoData();
  } else {
    disableSaveVideoData();
  }
}
// playback drawing video
function playbackButtonClick() {
  isFirstPlay = false;
  checkVideoIsGeneratge = false;

  if (checkVideoIsGeneratge) {
    playback();
  } else {
    saveVideo();
  }
}

function playback() {
  var VideoFormat = JSON.parse(LastVideoBase64Resp)[0];
  var videoBase64 = "data:video/mp4;base64," + VideoFormat.Image;
  $("#playbackModal").modal("show");
  $("#playback-video").get(0).src = videoBase64;
}

// Set clip
function setClip() {
  var scWidth = $("#scWidth").val();
  var scHeight = $("#scHeight").val();

  if (!scWidth || scWidth < 0) {
    alert("Insert Width!");
    return;
  }
  if (!scHeight || scHeight < 0) {
    alert("Insert height!");
    return;
  }

  var canvas = document.getElementById("ppCanvas");
  context.clearRect(0, 0, canvas.width, canvas.height);

  $.ajax({
    url: setclipUrl + "?width=" + scWidth + "&height=" + scHeight,
    type: "GET",
    cache: false,
  });
}

// get size
function getSize() {
  $.ajax({
    url: getsizeUrl,
    type: "GET",
    cache: false,
    success: function success(data) {
      if (data == "-8") {
        alert("Ink Empty.\nresult=" + data);
      } else {
        alert("result=" + data);
      }
    },
    error: function error() {
      alert("Get size fail!");
    },
  });
}

// get pointer
function getPointer() {
  var pointContant = $("#pointContant");

  pointContant.empty();
  $.ajax({
    url: getpointUrl,
    type: "GET",
    cache: false,
    dataType: "JSON",
    success: function success(resp) {
      var oJson = jQuery.parseJSON(resp);
      var dataLength = oJson.length;

      if (dataLength == 0) {
        alert("Point information is empty.");
      } else {
        $("#myModal").modal("show");
        for (var i = 0; i < dataLength; i++) {
          pointContant.append(
            "<tr><td>" +
              oJson[i].x +
              "</td><td>" +
              oJson[i].y +
              '</td><td align="right">' +
              oJson[i].pressure +
              '</td><td align="right">' +
              oJson[i].bStrokeEnd +
              '</td><td align="right">' +
              oJson[i].Time +
              "</td></tr>"
          );
        }
      }
    },
    error: function error() {
      alert("Get point information fail!");
    },
  });
}

// get about
function getAbout() {
  $.ajax({
    url: aboutUrl,
    type: "GET",
    cache: false,
  });
}

// get version id
function getVerid() {
  $.ajax({
    url: veridUrl,
    type: "GET",
    cache: false,
  }).done(function (data) {
    alert(data);
  });
}

// get pad id
function getPadid() {
  $.ajax({
    url: padidUrl,
    type: "GET",
    cache: false,
  }).done(function (data) {
    alert(data);
  });
}

// get pen id
function getPenid() {
  $.ajax({
    url: penidUrl,
    type: "GET",
    cache: false,
  }).done(function (data) {
    alert(data);
  });
}

// show device info in lcd
function showDiilcd() {
  $.ajax({
    url: diilUrl + "1",
    type: "GET",
    cache: false,
  });
}

// hide device info in lcd
function hideDiilcd() {
  $.ajax({
    url: diilUrl + "0",
    type: "GET",
    cache: false,
  });
}

// get device information
function getDevinf() {
  var diVal = $("#devInfo").val();

  $.ajax({
    url: devinfoUrl + diVal,
    type: "GET",
    cache: false,
  }).done(function (data) {
    if (diVal == 1) {
      if (data == "true") {
        alert("Connected\nresult=" + data);
      } else {
        alert("Disconnected\nresult=" + data);
      }
    } else {
      alert("result=" + data);
    }
  });
}

function saveFP() {
  var getsdType = $("#FPType").val();
  var getsdDpi = $("#sdDpi").val();
  var localPath = "FPImage_" + generateString(5);
  var sdT, sdD;

  switch (getsdType) {
    case "1":
      sdT = ".BMP";
      break;
    case "2":
      sdT = ".JPG";
      break;
    case "3":
      sdT = ".PNG";
      break;
    case "4":
      sdT = ".GIF";
      break;
    case "5":
      sdT = ".TIFF";
      break;
  }

  if (getsdDpi == "0") {
    sdD = "150";
  } else {
    sdD = "300";
  }

  $.ajax({
    url:
      saveFPUrl +
      "type=" +
      getsdType +
      "&dpi=" +
      getsdDpi +
      "&path=" +
      localPath +
      sdT,
    type: "GET",
    cache: false,
  }).done(function (resp) {
    if (Boolean(parseInt(resp))) {
      alert("Save file " + localPath + " failed" + ", result=" + resp);
    } else {
      if (
        navigator.userAgent.indexOf("WOW64") != -1 ||
        navigator.userAgent.indexOf("Win64") != -1
      ) {
        alert("File：" + resp + " saved");
      } else {
        alert("File：" + resp + " saved");
      }
    }
  });
}
// Encode
function encode() {
  var encodeType = 3;
  var encodeArea = $("#encode");

  $.ajax({
    url: encodeUrl + encodeType,
    type: "GET",
    cache: false,
  }).done(function (data) {
    encodeArea.html(data);
  });
}

// Decode
function decode() {
  var encodeContent = $("#encode").val();
  var encodeType = 3;
  var decodeArea = $("#decode");
  var decodeFormat;

  switch (encodeType) {
    case "1":
      decodeFormat = ".BMP";
      break;
    case "2":
      decodeFormat = ".JPG";
      break;
    case "3":
      decodeFormat = ".PNG";
      break;
    case "4":
      decodeFormat = ".GIF";
      break;
    case "5":
      decodeFormat = ".TIFF";
      break;
  }

  if (encodeType == 6) {
    $.ajax({
      url: decodeUrl + encodeType,
      type: "POST",
      cache: false,
      data: encodeContent,
      success: function success(resp) {
        decodeArea.append("X\t\t\t\tY\t\t\t\tbStrokeEnd\n");
        var data = JSON.parse(resp);
        for (var i = 0; i < data.length; i++) {
          var x = data[i].x,
            y = data[i].y,
            bStrokeEnd = data[i].bStrokeEnd;

          decodeArea.append(
            x + "\t\t\t\t" + y + "\t\t\t\t" + bStrokeEnd + "\n"
          );
        }
      },
    });
  } else {
    $.ajax({
      url:
        decodeUrl +
        encodeType +
        "&path=Decode_Image_" +
        generateString(5) +
        decodeFormat,
      type: "POST",
      cache: false,
      data: encodeContent,
      success: function success() {
        $.ajax({
          url: decodepathUrl,
          type: "GET",
          cache: false,
          success: function success(resp) {
            alert("File：" + resp + "\nSaved.");
          },
        });
      },
    });
  }
}

// Get Valid
function getValid() {
  $.ajax({
    url: validUrl,
    type: "GET",
    cache: false,
    success: function success(data) {
      if (data) {
        alert("Protect is Valid");
      } else {
        alert("Protect is Not Valid");
      }
    },
  });
}

// Save Device Data
function saveData() {
  var svData = $("#svData").val();
  var svPath = "?path=sample_save.txt";

  $.ajax({
    url: savedataUrl + svPath,
    type: "GET",
    cache: false,
    data: {
      index: svData,
    },
  }).done(function (result) {
    alert("Upload " + result + " data into device.");
  });
}

// Read Device Data
function readData() {
  var reData = $("#reData").val();
  var rePath = "?path=sample_read.txt";

  $.ajax({
    url: readdataUrl + rePath,
    type: "GET",
    cache: false,
    data: {
      index: reData,
    },
  }).done(function (resp) {
    alert("Download device data to " + resp);
  });
}

// Clear Device Data
function clearData() {
  var clData = $("#clData").val();

  $.ajax({
    url: cleardataUrl,
    type: "GET",
    cache: false,
    data: {
      index: clData,
    },
  }).done(function (resp) {
    if (resp == 0) {
      alert("Clear Data success.");
    } else {
      alert("Clear Data failed.");
    }
  });
}

// Generate random number
function generateString(length) {
  var text = "";
  var possible = "0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
