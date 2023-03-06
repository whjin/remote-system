//开启webSocket
function StartWebSocket(camDevInd) {
  var url = "ws://localhost:9000/";
  if ("WebSocket" in window) {
    ws = new WebSocket(url);
  } else if ("MozWebSocket" in window) {
    ws = new MozWebSocket(url);
  } else {
    notice(
      "浏览器版本过低，请升级您的浏览器。\\r\\n浏览器要求：IE10+/Chrome14+/FireFox7+/Opera11+",
      "warn"
    );
  }

  ws.onopen = function () {
    m_isConnectWS = true;
    unload();
    sendInitMsg(); //初始化
    //SetRotationStyle(camDevInd); //一开始旋转90度
    m_closed = false;
  };

  ws.onmessage = function (evt) {
    if (typeof evt.data == "string") {
      var str = evt.data;
      if (str.length <= 0) {
        return;
      }
      if (str.indexOf("FileEncodeBase64") >= 0) {
        //base64
        var strs = new Array();
        strs = str.split(m_splitTag);
        var score = strs[2];
        if (m_ComparePicBase64) {
          //设置人脸比对的base64图片
          var myimg = document.getElementById(m_compareShowID);
          myimg.src = "data:image/png;base64," + score;
          m_ComparePicBase64 = false;
        } else if (m_idcardBase64) {
          //设置二代证读卡器base64图片
          var myimg = document.getElementById("head");
          myimg.src = "data:image/png;base64," + score;
          m_idcardBase64 = false;
        } else {
          alert(score);
        }
        return;
      }
      //文字识别
      if (str.indexOf("$-$") >= 0) {
        var strs = new Array();
        strs = str.split("$-$");
        OcrAction(strs[1]);
      }
      if (str.indexOf("$+$") >= 0) {
        var strs = new Array();
        strs = str.split("$+$");
        alert(strs[1]);
      }
      if (str.indexOf("$$$") >= 0) {
        var strs = new Array();
        strs = str.split("$$$");
        alert(strs[1]);
      }

      if (str.indexOf(m_splitTag) >= 0) {
        //视频的每一帧
        var strs = new Array();
        strs = str.split(m_splitTag);
        setImageWithBase64(strs[1]);
      } else {
        if (JSON.parse(evt.data).FuncName == "CaptureEncodeBase64") {
          let path = "";
          let previewBox = document.getElementById("previewBox");
          let myCamera = document.getElementById("myCamera");
          strs = str.split(m_splitTag);
          if (JSON.parse(strs[0]).result) {
            path = "data:image/png;base64," + JSON.parse(strs[0]).result;
            if (previewBox !== null) {
              base64Img.push(path);
              // 增加节点
              deleteAndAddImg();
              // 预览3s
              previewImg(path);
            }
            if (myCamera !== null) {
              // 增加节点
              resetImg();
            }
          } else {
            path = "data:image/png;base64," + base64Img;
          }
          // 增加节点
          if (myCamera !== null) {
            let img = document.getElementById("img");
            if (img) {
              myCamera.removeChild(img);
            }
            myCamera.insertAdjacentHTML(
              "beforeend",
              `<img id="img" ref="img" style="width: 100%;height: 100%" src="${path}" />`
            );
          }
        }
        // 处理其他请求
        handleJsonStrMessage(str, camDevInd);
      }
    }
  };

  ws.onclose = function () {
    m_isConnectWS = false;
    var myimg = document.getElementById("myCanvas");
    myimg.src = "/assets/load1.gif";
    StartWebSocket();
  };
}

function sendWsMessage(jsonObj) {
  var jsonStr = JSON.stringify(jsonObj);
  ws.send(jsonStr);
}

function handleJsonStrMessage(str, camDevInd) {
  var jsonOBJ = JSON.parse(str);
  var name = jsonOBJ.FuncName;
  var re = jsonOBJ.result;
  //初始化
  if (name == "camInitCameraLib") {
    if (re == "0") {
      openDev(camDevInd);
      //获取设备名
      var jsonObj = {
        FuncName: "camGetDevName",
      };
      sendWsMessage(jsonObj);

      //获得麦克风
      jsonObj = {
        FuncName: "camGetAudioDevName",
      };
      sendWsMessage(jsonObj);

      //获得录像格式
      jsonObj = {
        FuncName: "camGetVideoEncodeName",
      };
      sendWsMessage(jsonObj);
    } else {
      notice("未连接高拍仪", "warn");
    }
  }
  //打开设备
  else if (name == "camOpenDev") {
    if (re == 0) {
      //获取分辨率
      var jsonObj = {
        FuncName: "camGetResolution",
      };
      sendWsMessage(jsonObj);

      //获得视频格式
      jsonObj = {
        FuncName: "camGetMediaTypeName",
      };
      sendWsMessage(jsonObj);
    } else {
      notice("未连接高拍仪", "warn");
    }
  }
  //获取设备名
  else if (name == "camGetDevName") {
    // configureDevInfo(re);
  }
  //视频格式
  else if (name == "camGetMediaTypeName") {
    // configureVideoFormate(re);
  }

  //获取分辨率
  else if (name == "camGetResolution") {
    // configureRestionInfo(re);
  }
  //设置分辨率
  else if (name == "camSetResolution") {
    if (re != 0) {
      // alert("设置分辨率失败");
      notice("设置分辨率失败!", "error");
    }
  }
  //拍照
  else if (name == "camCaptureImageFile") {
    if (re != 0) {
      notice("拍照失败!", "error");
      // alert("拍照失败");
    } else {
      retCapture = re;
    }
  }
  //自动裁切
  else if (name == "camSetImageAutoCrop") {
    if (re != 0) {
      // alert("自动裁切失败");
      notice("自动裁切失败!", "error");
    }
  }
  //旋转
  else if (name == "camSetImageRotateMode") {
    if (re != 0) {
      // notice('旋转失败!', 'error');
      // alert("旋转失败");
    }
  }
  //二代证
  else if (name == "idcardrfidReadIDCard") {
    alert(re);
    m_ComparePicBase64 = false;
    showHead();
  }
  //文件上传
  else if (name == "camUpdataFileHttp") {
    var jsonStrRe = JSON.stringify(re);
    alert(jsonStrRe);
  }
  //社保卡
  else if (name == "ReadSBKCaard") {
    alert(re);
  }
  //遍历文件夹
  else if (name == "getFolderDayFileA") {
    alert(re);
  }
  //查看文件
  else if (name == "camShowImage") {
  }
  //删除文件
  else if (name == "camDeleteFile") {
    if (re == 0) {
      alert("文件删除成功！");
    } else {
      alert("文件删除失败！");
    }
  }
  //设置DPI
  else if (name == "camSetImageDPI") {
    if (re == 0) {
      alert("DPI设置成功！");
    } else {
      alert("DPI设置失败！");
    }
  }
  //设置JPG压缩率
  else if (name == "camSetImageJPGQuanlity") {
    if (re == 0) {
      alert("JPG压缩设置成功！");
    } else {
      alert("JPG压缩设置失败！");
    }
  }
  //删除文件夹
  else if (name == "DeleteFolderDayFileA") {
    if (re == 0) {
      alert("删除文件夹成功！");
    } else {
      alert("删除文件夹失败！");
    }
  }
  //读取的银行卡
  else if (name == "ReadBankCard") {
    alert(re);
  }
  //读取的磁条卡
  else if (name == "ReadMagneticCard") {
    alert(re);
  }
  //初始化指纹仪
  else if (name == "fingerprintInit") {
    if (re == "0") {
      alert("初始化指纹仪成功");
    } else {
      alert("初始化指纹仪失败");
    }
  }
  //反初始化指纹仪
  else if (name == "fingerprintUnInit") {
    if (re == "0") {
      alert("反初始化指纹仪成功");
    } else {
      alert("反初始化指纹仪失败");
    }
  }
  //采集指纹
  else if (name == "CollectFingerFeature") {
    if (re == "0") {
      alert("采集指纹成功");
    } else {
      alert("采集失败");
    }
  }
  //比对指纹
  else if (name == "CompareFingerFeature") {
    if (re == "-100") {
      alert("请先采集指纹");
    } else if (re == "0") {
      alert("比对成功");
    } else {
      alert("比对失败");
    }
  }
  //连拍
  else if (name == "camStartAutoCapture") {
    if (re == "0") {
      alert("连拍开启成功");
    }
  }
  //停止连拍
  else if (name == "camStopAutoCapture") {
    if (re == "0") {
      alert("停止连拍成功");
      AutoCaptureBack("-1000");
    }
  }
  //连拍回调
  else if (name == "AutoCaptureBack") {
    if (re == "0") {
      AutoCaptureBack(re);
    } else {
      AutoCaptureBack("-1000");
      alert("连拍回调出错" + String(re));
    }
  }
  //初始化人脸识别模块
  else if (name == "camInitFace") {
    if (re == "0") {
      alert("初始化人脸识别成功");
    } else {
      alert("初始化人脸识别失败");
    }
  }
  //反初始化人脸识别模块
  else if (name == "camUnInitFace") {
    alert(re);
  }
  //比对视频
  else if (name == "camMatchFaceByFileVideo") {
    alert(re);
  }
  //匹配图片
  else if (name == "camMatchFaceByFile") {
    var score = parseInt(re);
    if (score >= 0 && score <= 100) {
      alert("分数：" + re);
    } else {
      alert("error：" + re);
    }
  }
  //选择麦克风
  else if (name == "camGetAudioDevName") {
    // MicrophoneName(re);
  }
  //录像格式
  else if (name == "camGetVideoEncodeName") {
    // VideoName(re);
  }
  //开始录像
  else if (name == "camStartRecord") {
    if (re == 0) {
      alert("开始录像");
      GetVoice();
    } else {
      alert("录像失败");
    }
  }
  //关闭录像
  else if (name == "camStopRecord") {
    if (re == 0) alert("录制成功");
    else alert("录制失败");
  } else if (name == "camGetMicrophoneVolumeLevel") {
    ShowVioce(re);
  } else if (name == "camSetImageAdjust") {
    if (re != 0) {
      alert("设置失败");
    }
  }
  //合并pdf
  else if (name == "camAddFileToPDFList") {
    if (re != 0) {
      alert("添加pdf失败");
    }
  } else if (name == "camCombinePDF") {
    if (re == 0) {
      alert("合并pdf成功");
    } else {
      alert("合并pdf失败");
    }
  } else if (name == "camCombineImage") {
    if (re == 0) {
      alert("合并图片成功");
    } else {
      alert("合并图片失败");
    }
  } else if (name == "camShowImageSettingWindow") {
  } else if (name == "camSetImageWaterMark") {
    if (re == 0) {
      alert("添加水印成功");
    } else {
      alert("添加水印失败");
    }
  } else if (name == "camSetVideoParameter") {
    if (re == 0) {
      alert("设置视频参数成功");
    } else {
      alert("设置视频参数失败");
    }
  } else if (name == "coderRecognizeBarcode") {
    ShowOCRResult(re);
  } else if (name == "zbRecognizeBarcode") {
    ShowOCRResult(re);
  } else if (name == "coderRecognizeBarcodePDF417") {
    ShowOCRResult(re);
  } else if (name == "ocrGetLanguageName") {
    AddLanguage(re);
  } else if (name == "ocrCombineSingleToFile") {
    if (re == 0) {
      var myDate = new Date();

      Msg.value =
        "\r\n" +
        myDate.toLocaleString() +
        "\r\n" +
        "- 识别导出文件：" +
        ocrFile +
        "\r\n" +
        Msg.value;
    } else {
      alert("识别失败，错误号:" + re);
    }
  }
  //else if (name == "ocrCombineToString")
  //{
  //}
  else if (name == "StartSignDevice") {
    if (re == 0) {
      alert("成功");
    }
  } else if (name == "BeginSignMode") {
    if (re == 0) {
      alert("开启手写板成功");
    }
  } else if (name == "EndSignMode") {
    if (re == 0) {
      alert("结束手写板成功");
    }
  } else if (name == "idcardrfidReadIDCardEx") {
    alert(re);
  } else if (name == "CmOutputImageBase64") {
    alert(re);
  } else if (name == "ocrRecognizeBarcodeRect") {
    for (var i = 0; i < re; ++i) {
      var jsonObj = {
        FuncName: "ocrGetBarcodeText",
        argument: {
          nIndex: i,
        },
      };

      sendWsMessage(jsonObj);
    }
  } else if (name == "ocrGetBarcodeText") {
    ShowOCRResult(re);
  }
}
