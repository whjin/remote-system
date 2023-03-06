// 深拷贝
function deepCopy(obj) {
  if (typeof obj != "object") {
    return obj;
  }
  let result = Array.isArray(obj) ? [] : {};
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (typeof obj[i] == "object" && obj[i] != null) {
        result[i] = deepCopy(obj[i]);
      } else {
        result[i] = obj[i];
      }
    }
  }
  return result;
}

// 数组、对象去重
function unique(arr) {
  if (!Array.isArray(arr)) {
    return;
  }
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (result.indexOf(arr[i]) == -1) {
      result.push(arr[i]);
    }
  }
  return result;
}

// 数组排序(快速排序)
function sortArray(arr) {
  if (arr.length <= 1) {
    return arr;
  }
  let index = Math.floor(arr.length / 2);
  let minArr = arr.splice(index, 1)[0];
  let left = [];
  let right = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < minArr) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  return sortArray(left).concat([minArr], sortArray(right));
}

// 格式化日期类型,fmt格式可选择
function dateFormat(fmt, date) {
  let ret;
  let opt = {
    "Y+": date.getFullYear().toString(), // 年
    "M+": (date.getMonth() + 1).toString(), // 月
    "D+": date.getDate().toString(), // 日
    "h+": date.getHours().toString(), // 时
    "m+": date.getMinutes().toString(), // 分
    "s+": date.getSeconds().toString(), // 秒
    "ms+": date.getMilliseconds().toString(), // 毫秒
  };
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt);
    if (ret) {
      fmt = fmt.replace(
        ret[1],
        ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
      );
    }
  }
  return fmt;
}

// 获取当前日期
function getDate() {
  let nowDate = document.getElementById("nowDate");
  let nowWeek = document.getElementById("nowWeek");
  let nowTime = document.getElementById("nowTime");
  let date = dateFormat("YYYY-MM-DD", new Date());
  let time = dateFormat("hh:mm", new Date());
  nowDate.innerHTML = date;
  nowWeek.innerHTML = getWeek();
  nowTime.innerHTML = time;
}

// 获取星期
function getWeek() {
  let weeks = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  let now = new Date();
  let day = now.getDay();
  let week = weeks[day];
  return week;
}

function showNum(num) {
  return num < 10 ? "0" + num : num;
}
