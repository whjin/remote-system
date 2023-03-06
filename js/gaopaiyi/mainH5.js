let saveText = "C:/tmp/";

function load(camDevInd) {
  //启动服务
  StartWebSocket(camDevInd);
}

function unload() {
  if (m_closed) {
    return;
  }
  //反初始化
  var jsonObj = {
    FuncName: "camUnInitCameraLib",
  };
  sendWsMessage(jsonObj);
}
//初始化
function sendInitMsg() {
  var jsonObj = {
    FuncName: "camInitCameraLib",
  };
  sendWsMessage(jsonObj);
}
//设置预览区域
function sendPreZoneSize() {
  var w = document.getElementById("myCanvas").width;
  var h = document.getElementById("myCanvas").height;

  var jsonObj = {
    FuncName: "PreZoneSize",
    argument: {
      width: w,
      height: h,
    },
  };
  sendWsMessage(jsonObj);
}
//打开设备
function openDev(camDevInd) {
  if (m_closed) {
    StartWebSocket();
  }

  sendPreZoneSize();
  //打开摄像头
  var jsonObj = {
    FuncName: "camOpenDev",
    argument: {
      devIndex: camDevInd || 0,
      subtype: 0,
      width: 0,
      height: 0,
    },
  };
  sendWsMessage(jsonObj);
  //开始预览
  jsonObj = {
    FuncName: "camStartPreview",
  };
  sendWsMessage(jsonObj);
}

function showpicture(path) {
  var jsonObj = {
    FuncName: "camShowImage",
    argument: {
      FilePath: path,
    },
  };
  sendWsMessage(jsonObj);
}

function DevSetting() {
  var objSelect = document.getElementById("device");
  var jsonObj = {
    FuncName: "camShowImageSettingWindow",
    argument: {
      devIndex: objSelect.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
}
//关闭设备
function closeDev() {
  var objSelect = document.getElementById("device");
  var jsonObj = {
    FuncName: "camCloseDev",
    argument: {
      devIndex: objSelect.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
}

//显示设备名
function configureDevInfo(names) {
  //设备名字
  var objSelect = document.getElementById("device");
  objSelect.options.length = 0;

  for (var i = 0; i < names.length; i++) {
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }

  //设置设备
  objSelect.onchange = function () {
    //打开摄像头
    var jsonObj = {
      FuncName: "camOpenDev",
      argument: {
        devIndex: objSelect.selectedIndex,
        subtype: 0,
        width: 0,
        height: 0,
      },
    };
    sendWsMessage(jsonObj);
  };
}

//显示视频格式
function configureVideoFormate(names) {
  var objSelect = document.getElementById("videoStyle");
  objSelect.options.length = 0;

  for (var i = 0; i < names.length; i++) {
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }

  objSelect.onchange = function () {
    //切换视频格式
    closeDev();

    var objDev = document.getElementById("device");
    var jsonObj = {
      FuncName: "camOpenDev",
      argument: {
        devIndex: objDev.selectedIndex,
        subtype: objSelect.selectedIndex,
        width: 0,
        height: 0,
      },
    };
    sendWsMessage(jsonObj);
  };
}

//设置 分辨率
function configureRestionInfo(names) {
  var objSelect = document.getElementById("resoultion");
  objSelect.options.length = 0;

  for (var i = 0; i < names.length; i++) {
    if (names[i].length <= 0) {
      continue;
    }
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }

  //设置分辨率
  objSelect.onchange = function () {
    var jsonObj = {
      FuncName: "camSetResolution",
      argument: {
        index: objSelect.selectedIndex,
      },
    };
    sendWsMessage(jsonObj);
  };
}

function configureVideoStyle(names) {
  var objSelect = document.getElementById("videoStyle");
  objSelect.options.length = 0;

  for (var i = 1; i < names.length; i++) {
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }

  //设置视频格式
  objSelect.onchange = function () {
    //sendWsMessage("SetMediaType"+m_splitTag+String(objSelect.selectedIndex));
  };
}

function ResizeImage(imageDest, W, H) {
  //显示框宽度W,高度H
  var image = new Image();
  image.src = imageDest.src;
  image.width = 2592;
  image.height = 1944;
  if (image.width > 0 && image.height > 0) {
    //比较纵横比
    if (image.width / image.height >= W / H) {
      //相对显示框：宽>高
      if (image.width > W) {
        //宽度大于显示框宽度W，应压缩高度
        imageDest.width = W;
        imageDest.height = (image.height * W) / image.width;
      } //宽度少于或等于显示框宽度W，图片完全显示
      else {
        imageDest.width = image.width;
        imageDest.height = image.height;
      }
    } //同理
    else {
      if (image.height > H) {
        imageDest.height = H;
        imageDest.width = (image.width * H) / image.height;
      } else {
        imageDest.width = image.width;
        imageDest.height = image.height;
      }
    }
  }
}
//
//显示每一帧
function setImageWithBase64(str) {
  var myimg = document.getElementById("myCanvas");
  myimg.src = "data:image/png;base64," + str;
  //ResizeImage(myimg, myimg.width, myimg.height);
}

//旋转
function SetRotationStyle(camDevInd) {
  // var objSelect = document.getElementById("rotationStyle");
  if (camDevInd !== undefined && camDevInd !== null) {
    var jsonObj = {
      FuncName: "camSetImageRotateMode",
      argument: {
        rotateMode: camDevInd,
      },
    };
    sendWsMessage(jsonObj);
  }
}
//自动裁切
function SetCutStyle() {
  var objSelect = document.getElementById("cutStyle");

  var jsonObj = {
    FuncName: "camSetImageAutoCrop",
    argument: {
      CropType: objSelect.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
  if (objSelect.selectedIndex > 4) {
    SavePara();
  }
}
//图像处理
function setImageAdjust() {
  var objectSelect = document.getElementById("imageAdjust");
  var jsonObj = {
    FuncName: "camSetImageAdjust",
    argument: {
      Type: objectSelect.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
}
//判断文件存在
function CheckImgExists(imgurl) {
  var ret = "file://" + imgurl;
  var ImgObj = new Image(); //判断图片是否存在
  ImgObj.src = ret;
  //没有图片，则返回-1
  if (ImgObj.fileSize > 0 || (ImgObj.width > 0 && ImgObj.height > 0)) {
    return true;
  } else {
    return false;
  }
}
//拍照
function Capture() {
  var time = new Date();
  var checktime = time.getHours();
  var filepath =
    saveText +
    time.getYear() +
    time.getMonth() +
    time.getDate() +
    time.getDate() +
    time.getTime() +
    ".jpg";
  var jsonObj = {
    FuncName: "camCaptureImageFile",
    argument: {
      filePath: filepath,
    },
  };
  sendWsMessage(jsonObj);

  let timer = setTimeout(function () {
    addlist("highMeterPhoto", filepath);
  }, 2000);
}

//文件上传
function HttpUpload(type) {
  if (type == 1) {
    var filepath = document.getElementById("UploadsaveText").value;
    var urlpath = document.getElementById("urlText").value;
    var jsonObj = {
      FuncName: "camUpdataFileHttp",
      argument: {
        filePath: filepath,
        url: urlpath,
        param: "param:123",
        response: "",
      },
    };
  } else if (type == 2) {
    var filepath = document.getElementById("UploadsaveText").value;
    var FtpAddressText = document.getElementById("FtpAddressText").value;
    var user = document.getElementById("user").value;
    var pwd = document.getElementById("pwd").value;
    var iport = document.getElementById("iport").value;
    var floder = document.getElementById("floder").value;
    var jsonObj = {
      FuncName: "camUpdataFileFtp",
      argument: {
        strfilePath: filepath,
        strftpPath: FtpAddressText,
        struserName: user,
        struserPsd: pwd,
        iPort: parseInt(iport),
        strtargetName: floder,
      },
    };
  }
  sendWsMessage(jsonObj);
}
//读取二代证
function ReadIDCard() {
  var jsonObj = {
    FuncName: "idcardrfidReadIDCardEx",
    argument: {},
  };
  sendWsMessage(jsonObj);
}

function showHead() {
  m_idcardBase64 = true;
  var filepath = document.getElementById("HeadPath").value;
  var jsonObj = {
    FuncName: "FileEncodeBase64",
    argument: {
      filePath: filepath,
    },
  };
  sendWsMessage(jsonObj);
}
//读取银行卡
function ReadBankCard() {
  var jsonObj = {
    FuncName: "ReadBankCard",
  };
  sendWsMessage(jsonObj);
}

//读取磁条卡
function ReadMagneticCard() {
  var jsonObj = {
    FuncName: "ReadMagneticCard",
  };
  sendWsMessage(jsonObj);
}

//读取社保卡
function ReadSBKCard() {
  var jsonObj = {
    FuncName: "ReadSBKCaard",
  };
  sendWsMessage(jsonObj);
}

//初始化指纹仪
function InitFingerData() {
  var jsonObj = {
    FuncName: "fingerprintInit",
    argument: {},
  };
  sendWsMessage(jsonObj);
}

//反初始化指纹仪
function UinitFingerData() {
  var jsonObj = {
    FuncName: "fingerprintUnInit",
    argument: {},
  };
  sendWsMessage(jsonObj);
}

//采集指纹
function GetFingerPic(num) {
  var jsonObj = {
    FuncName: "CollectFingerFeature",
    argument: {
      number: num,
    },
  };
  sendWsMessage(jsonObj);
}

//对比指纹
function ComperaFingerPic() {
  var jsonObj = {
    FuncName: "CompareFingerFeature",
    argument: {},
  };
  sendWsMessage(jsonObj);
}

//图片base64
function CaptureBase64() {
  var filepath = saveText;
  var jsonObj = {
    FuncName: "FileEncodeBase64",
    argument: {
      filePath: filepath,
    },
  };
  sendWsMessage(jsonObj);
}

// 文档传输拍照
function CaptureBase64Ex() {
  let highMeterBox = document.getElementById("highMeterBox");
  if (highMeterBox.style.display == "none") {
    document.getElementById("previewBox").style.display = "none";
    highMeterBox.style.display = "block";
    /*重新渲染一次，取消选中*/
    deleteAndAddImg();
  } else {
    if (ws.readyState != 0) {
      var Index = document.getElementById("resoultion").selectedIndex;
      var jsonObj = {
        FuncName: "CaptureEncodeBase64",
        argument: {
          nIndex: Index,
        },
      };
      sendWsMessage(jsonObj);
    } else {
      notice("请重启高拍仪SDK", "error");
    }
  }
}

// 预约申请高拍仪拍照
function hignMeterBase64Ex(selectedIndex) {
  // 高拍仪摄像头拍照为0，上路摄像头拍照nIndex为1
  if (ws.readyState == 1) {
    let Index = document.getElementById("resoultion").selectedIndex;
    let jsonObj = {
      FuncName: "CaptureEncodeBase64",
      argument: { nIndex: selectedIndex || Index },
    };
    sendWsMessage(jsonObj);
  }
}

//删除文件
function DeleteFile() {
  var filepath = saveText;
  var jsonObj = {
    FuncName: "camDeleteFile",
    argument: {
      FilePath: filepath,
    },
  };
  sendWsMessage(jsonObj);
}
//查看文件
function OpenFile() {
  var filepath = saveText;
  var jsonObj = {
    FuncName: "camShowImage",
    argument: {
      FilePath: filepath,
    },
  };
  sendWsMessage(jsonObj);
}

//遍历文件夹
function FindJPGFile() {
  var filepath = document.getElementById("Distory").value;
  var jsonObj = {
    FuncName: "getFolderDayFileA",
    argument: {
      Dictpry: filepath,
    },
  };
  sendWsMessage(jsonObj);
}
//删除文件夹
function RemoveDictory() {
  var filepath = document.getElementById("Distory").value;
  var jsonObj = {
    FuncName: "DeleteFolderDayFileA",
    argument: {
      Dictpry: filepath,
    },
  };
  sendWsMessage(jsonObj);
}
//设置DPI
function DPISet() {
  var xdpi = document.getElementById("dpix").value;
  var ydpi = document.getElementById("dpiy").value;
  var jsonObj = {
    FuncName: "camSetImageDPI",
    argument: {
      xDPI: parseInt(xdpi),
      yDPI: parseInt(ydpi),
    },
  };
  sendWsMessage(jsonObj);
}
//设置JPG压缩率
function JPGQSet() {
  var JPGQ = document.getElementById("jpg").value;
  var jsonObj = {
    FuncName: "camSetImageJPGQuanlity",
    argument: {
      quanlity: parseInt(JPGQ),
    },
  };
  sendWsMessage(jsonObj);
}

//设置手动裁剪区域
function CropZoneSet() {
  var left = document.getElementById("left").value;
  var right = document.getElementById("right").value;
  var top = document.getElementById("top").value;
  var bottom = document.getElementById("bottom").value;

  var jsonObj = {
    FuncName: "camSetImageCusCropRect",
    argument: {
      left: parseInt(left),
      right: parseInt(right),
      top: parseInt(top),
      bottom: parseInt(bottom),
    },
  };
  sendWsMessage(jsonObj);
}

function showBase64info(str) {
  alert("Base64数据为：" + str);
}

var AutoCaptureTime = 0;
//连拍
function continuCapture() {
  var filepath = saveText + "\\autoCapture.jpg";
  var jsonObj = {
    FuncName: "camStartAutoCapture",
    argument: {
      type: 0,
      param: 4,
      filePath: filepath,
    },
  };
  AutoCaptureTime = 4;
  sendWsMessage(jsonObj);
}
//定时连拍
function timeCapture() {
  var filepath = saveText + "\\autoCapture.jpg";
  var jsonObj = {
    FuncName: "camStartAutoCapture",
    argument: {
      type: 1,
      param: 4,
      filePath: filepath,
    },
  };
  AutoCaptureTime = 4;
  sendWsMessage(jsonObj);
}
//停止连拍
function StopAutoCapture() {
  var jsonObj = {
    FuncName: "camStopAutoCapture",
    argument: {},
  };
  sendWsMessage(jsonObj);
}

//处理回调
function AutoCaptureBack(re) {
  var progress0 = document.getElementById("autoCaptureProgress");

  if (re == "-1000") {
    progress0.value = "0";
  } else {
    progress0.value = "100";
    setTimeout(function () {
      progress0.value = "0";
    }, (AutoCaptureTime / 2) * 1000);
  }
}

//初始化人脸识别模块
function InitFaceSDK() {
  var jsonObj = {
    FuncName: "camInitFace",
    argument: {},
  };
  sendWsMessage(jsonObj);
}
//反初始化人脸识别模块
function UinitFaceSDK() {
  var jsonObj = {
    FuncName: "camUnInitFace",
    argument: {},
  };
  sendWsMessage(jsonObj);
}

//匹配视频
function compareVideo() {
  var url1 = document.getElementById("imgOne").value;

  var jsonObj = {
    FuncName: "camMatchFaceByFileVideo",
    argument: {
      filePath: url1,
      videoFilePath: "",
      ldelayTime: 0,
    },
  };
  sendWsMessage(jsonObj);
}

//路径比对
function comparePic() {
  var url1 = document.getElementById("imgOne").value;
  var url2 = document.getElementById("imgTwo").value;

  var jsonObj = {
    FuncName: "camMatchFaceByFile",
    argument: {
      filePath1: url1,
      filePath2: url2,
    },
  };
  sendWsMessage(jsonObj);
}

//裁切人脸
function FaceCropChanged() {
  var num = document.getElementById("FaceCrop").checked ? 5 : 0;

  var jsonObj = {
    FuncName: "camSetImageAutoCrop",
    argument: {
      CropType: num,
    },
  };
  sendWsMessage(jsonObj);
}

//活体
function LiveBodyChanged() {
  var num = document.getElementById("LiveBody").checked ? 1 : 0;
  var jsonObj = {
    FuncName: "camSetLivingBodyState",
    argument: {
      bOpen: num,
    },
  };
  sendWsMessage(jsonObj);
}

//获得麦克风名字
function MicrophoneName(names) {
  //设备名字

  var objSelect = document.getElementById("Microphone");
  objSelect.options.length = 0;

  for (var i = 0; i < names.length; i++) {
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }
}
//获得视频格式名字
function VideoName(names) {
  //设备名字
  var objSelect = document.getElementById("VideoType");
  objSelect.options.length = 0;
  for (var i = 0; i < names.length; i++) {
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }

  objSelect.onchange = function () {
    var pathobj = document.getElementById("SaveVieoText");
    var savepath = pathobj.value;
    var index = objSelect.selectedIndex;
    var text = objSelect.options[index].text;
    var str = savepath.indexOf(".") + 1;
    str = savepath.substr(0, str) + text;
    pathobj.setAttribute("value", str);
  };
}
//开始视频名字
function StartVideo() {
  var savepath = document.getElementById("SaveVieoText").value;
  var objSelect = document.getElementById("device");
  var CurMicphone = document.getElementById("Microphone");
  var CurVideoFormat = document.getElementById("VideoType");
  var jsonObj = {
    FuncName: "camStartRecord",
    argument: {
      filePath: savepath,
      micphone: CurMicphone.selectedIndex,
      videoFormat: CurVideoFormat.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
}
//关闭视频
function StopVideo() {
  var objSelect = document.getElementById("device");
  var jsonObj = {
    FuncName: "camStopRecord",
    argument: {
      devIndex: objSelect.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
  var objSelect = document.getElementById("voice");
  objSelect.setAttribute("Value", 0);
}
//录音声音反馈
function GetVoice() {
  var objSelect = document.getElementById("voice");
  var jsonObj = {
    FuncName: "camGetMicrophoneVolumeLevel",
    argument: {
      devIndex: objSelect.selectedIndex,
    },
  };
  sendWsMessage(jsonObj);
}

function ShowVioce(volume) {
  var objSelect = document.getElementById("voice");
  objSelect.setAttribute("Value", volume);
}
//合并PDF
var count = 0;

function addFile() {
  count++;

  var newDiv =
    "<div id=divUpload" +
    count +
    ">" +
    " <input  id=file" +
    count +
    " type=text width=1000 size=50 name=upload/>" +
    "<a href=javascript:delUpload('divUpload" +
    count +
    "')>删除</a>" +
    " </div>";

  var newDiv2 = "<div id=index" + count + ">" + count + " </div>";
  document
    .getElementById("uploadContent")
    .insertAdjacentHTML("beforeEnd", newDiv);
  document.getElementById("Div2").insertAdjacentHTML("beforeEnd", newDiv2);
}

function delUpload(diva) {
  document
    .getElementById("Div2")
    .removeChild(document.getElementById("index" + count));
  count--;
  document
    .getElementById(diva)
    .parentNode.removeChild(document.getElementById(diva));
}

function CombineFile() {
  for (var i = 1; i < count + 1; i++) {
    var path = document.getElementById("file" + i).value;
    if (path == null) {
      continue;
    }
    if (path.value == "") {
      continue;
    }
    var ret = AddFileToPDFList(path);
  }
  var fileext = ".pdf";
  var strFolder = document.getElementById("pdftext").value;
  var myDate = new Date();
  var myName =
    "Image_" +
    myDate.getFullYear() +
    (myDate.getMonth() + 1) +
    myDate.getDate() +
    "_" +
    myDate.getHours() +
    myDate.getMinutes() +
    myDate.getSeconds() +
    myDate.getMilliseconds();

  var newFile = strFolder + "\\" + myName + fileext;
  var result = CombinePDF(newFile, 50);
}

function AddFileToPDFList(path) {
  var filepath = path;
  var jsonObj = {
    FuncName: "camAddFileToPDFList",
    argument: {
      filePath: filepath,
    },
  };
  sendWsMessage(jsonObj);
}

function CombinePDF(path, JQ) {
  var JpegQuaility = JQ;
  var filepath = path;
  var jsonObj = {
    FuncName: "camCombinePDF",
    argument: {
      filePath: filepath,
      JpegQuality: JpegQuaility,
    },
  };
  sendWsMessage(jsonObj);
}

function CombinePicture() {
  var path1 = document.getElementById("file1").value;
  var path2 = document.getElementById("file2").value;
  var fileext = ".jpg";
  var strFolder = document.getElementById("pdftext").value;
  var myDate = new Date();
  var myName =
    "Image_" +
    myDate.getFullYear() +
    (myDate.getMonth() + 1) +
    myDate.getDate() +
    "_" +
    myDate.getHours() +
    myDate.getMinutes() +
    myDate.getSeconds() +
    myDate.getMilliseconds();
  var newFile = strFolder + "\\" + myName + fileext;

  var objectSelect = document.getElementById("CombineType").selectedIndex;
  var iType = 0;
  if (objectSelect == 0) {
    iType = 7;
  } else {
    iType = 4;
  }

  var ioffsetX = 0;
  var ioffsetY = 0;

  var jsonObj = {
    FuncName: "camCombineImage",
    argument: {
      filePath1: path1,
      filePath2: path2,
      PdfPath: newFile,
      Type: iType,
      offsetX: ioffsetX,
      offsetY: ioffsetY,
    },
  };
  sendWsMessage(jsonObj);
}

//图片添加路径  YOUNG
function imgFormatter(value, row, index) {
  if ("" != value && null != value) {
    var strs = new Array(); //定义一数组
    if (value.substr(value.length - 1, 1) == ",") {
      value = value.substr(0, value.length - 1);
    }
    strs = value.split(","); //字符分割
    var rvalue = "";
    for (i = 0; i < strs.length; i++) {
      rvalue +=
        '<img onclick=download("' +
        strs[i] +
        "\") style='width:66px; height:60px;margin-left:3px;' src='<%=path%>" +
        strs[i] +
        "' title='点击查看图片'/>";
    }
    return rvalue;
  }
}

//水印
function AddWaterMark() {
  var wm_Msg = document.getElementById("WaterMarkMsg").value;
  var wm_type = document.getElementById("WaterMarktype").value;
  var wm_fontSize = document.getElementById("WaterMarkfontSize").value;
  var wm_font = document.getElementById("WaterMarkfont").value;
  var wm_fItalic = document.getElementById("WaterMarkfItalic").value;
  var wm_fUnderline = document.getElementById("WaterMarkfUnderline").value;
  var wm_fWeight = document.getElementById("WaterMarkfWeight").value;
  var wm_angle = document.getElementById("WaterMarkangle").value;
  var wm_transparent = document.getElementById("WaterMarktransparent").value;
  var wm_R = document.getElementById("WaterMarkcolorR").value;
  var wm_G = document.getElementById("WaterMarkcolorG").value;
  var wm_B = document.getElementById("WaterMarkcolorB").value;
  var wm_isAvailabel = document.getElementById("WaterMarkisAvailabel").value;

  var jsonObj = {
    FuncName: "camSetImageWaterMark",
    argument: {
      strMsg: wm_Msg,
      itype: parseInt(wm_type),
      ifontSize: parseInt(wm_fontSize),
      strfont: wm_font,
      iItalic: parseInt(wm_fItalic),
      iUnderline: parseInt(wm_fUnderline),
      iWeight: parseInt(wm_fWeight),
      fangle: parseFloat(wm_angle),
      ftransparent: parseFloat(wm_transparent),
      icolorR: parseInt(wm_R),
      icolorG: parseInt(wm_G),
      icolorB: parseInt(wm_B),
      isAvailabel: parseInt(wm_isAvailabel),
    },
  };
  sendWsMessage(jsonObj);
}

function SetVideoParameter() {
  var vp1 = document.getElementById("VideoSetPara1").value;
  var vp2 = document.getElementById("VideoSetPara2").value;
  var vSettingValue = document.getElementById("VideoSetting").value;
  var vIsVideoSetAuto = document.getElementById("IsVideoSetAuto").value;

  var jsonObj = {
    FuncName: "camSetVideoParameter",
    argument: {
      ipara1: parseInt(vp1),
      ipara2: parseInt(vp2),
      ilvalue: parseInt(vSettingValue),
      iflag: parseInt(vIsVideoSetAuto),
    },
  };

  sendWsMessage(jsonObj);
}

function coderRecBarcode() {
  var BarcodePath = document.getElementById("OCR_Pathtext").value;
  var jsonObj = {
    FuncName: "coderRecognizeBarcode",
    argument: {
      strBarcodePath: BarcodePath,
    },
  };

  sendWsMessage(jsonObj);
}

function RecBarcode() {
  var BarcodePath = document.getElementById("OCR_Pathtext").value;

  var nCodeType = codetype.options[codetype.selectedIndex].value;

  var img = new Image();

  // 改变图片的src
  img.src = BarcodePath;

  // 加载完成执行
  img.onload = function () {
    // 打印
    var w, h;
    w = img.width;
    h = img.height;
    var jsonObj;
    if (nCodeType == 1) {
      jsonObj = {
        FuncName: "ocrRecognizeBarcodeRect",
        argument: {
          strBarcodePath: BarcodePath,
          nCodeType: parseInt(nCodeType),
          ileft: parseInt(w / 2),
          itop: 0,
          iright: parseInt(w),
          ibottom: parseInt(h / 2),
        },
      };
    } else if (nCodeType == 2) {
      jsonObj = {
        FuncName: "ocrRecognizeBarcodeRect",
        argument: {
          strBarcodePath: BarcodePath,
          nCodeType: parseInt(nCodeType),
          ileft: 0,
          itop: 0,
          iright: parseInt(w / 2),
          ibottom: parseInt(h / 2),
        },
      };
    }

    sendWsMessage(jsonObj);
  };
}

function ShowOCRResult(msg) {
  var myDate = new Date();
  var Ret = "\r\n" + myDate.toLocaleString() + "\r\n";

  Ret += msg;

  Msg.value = Ret + Msg.value;
}

function AddLanguage(names) {
  //设备名字

  var objSelect = document.getElementById("language");
  objSelect.options.length = 0;

  for (var i = 0; i < names.length; i++) {
    var op = new Option(names[i], i);
    objSelect.options[objSelect.length] = op;
  }

  objSelect.options[102].selected = true;
}

function RecToFile(type) {
  var fileext = document.getElementById("filetype").value;
  var strFolder = document.getElementById("OCR_SavePathtext").value;
  var myDate = new Date();
  var myName =
    "OCR_" +
    myDate.getFullYear() +
    (myDate.getMonth() + 1) +
    myDate.getDate() +
    "_" +
    myDate.getHours() +
    myDate.getMinutes() +
    myDate.getSeconds() +
    myDate.getMilliseconds();

  ocrFile = strFolder + "\\" + myName + fileext;

  var languageID = language.options[language.selectedIndex].value;
  if (type == 1) {
    var jsonObj = {
      FuncName: "ocrCombineSingleToFile",
      argument: {
        strImagePath: OCR_Pathtext.value,
        strFilePath: ocrFile,
        language: parseInt(languageID),
      },
    };
    sendWsMessage(jsonObj);
  } else if (type == 2) {
    var jsonObj = {
      FuncName: "ocrCombineSingleToString",
      argument: {
        strImagePath: OCR_Pathtext.value,
        language: parseInt(languageID),
      },
    };
    sendWsMessage(jsonObj);
  }
}

function InitOCR() {
  //识别语言
  var jsonObj = {
    FuncName: "ocrGetLanguageName",
  };
  sendWsMessage(jsonObj);
}

function InitSign() {
  var jsonObj = {
    FuncName: "StartSignDevice",
  };
  sendWsMessage(jsonObj);
}

function UinitSign() {
  var jsonObj = {
    FuncName: "StopSignMode",
  };
  sendWsMessage(jsonObj);
}

function BeginSign() {
  var jsonObj = {
    FuncName: "BeginSignMode",
  };
  sendWsMessage(jsonObj);
}

function GetSign() {
  var jsonObj = {
    FuncName: "CmOutputImageBase64",
  };
  sendWsMessage(jsonObj);
}

function EndSign() {
  var jsonObj = {
    FuncName: "EndSignMode",
  };
  sendWsMessage(jsonObj);
}

function OcrAction(strResult) {
  var myDate = new Date();

  Msg.value =
    "\r\n" +
    myDate.toLocaleString() +
    "\r\n" +
    "- 识别结果：" +
    strResult +
    "\r\n" +
    Msg.value;
}
