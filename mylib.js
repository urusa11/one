window.onOpenCvReady = function() {
  document.getElementById('loading-opencv-msg').remove();
}

window.onload = function() {
  $("input:checkbox").prop("disabled", true);
}

$(document).ready(function() {
  $('#input_3_2 input[type=checkbox]').click(function() {
    if ($("#input_3_2 input[type=checkbox]:checked").length >= 2)
      $("input:checkbox").prop("disabled", true);
    else
      $("input:checkbox").prop("disabled", false);
  });
})

var fileUploadEl = document.getElementById('file-upload1'),
  srcImgEl = document.getElementById('src-image1')
fileUploadEl.addEventListener("change", function(e) {
  srcImgEl.src = URL.createObjectURL(e.target.files[0]);
}, false);

var fileUploadE2 = document.getElementById('file-upload2'),
  srcImgE2 = document.getElementById('src-image2')
fileUploadE2.addEventListener("change", function(e) {
  srcImgE2.src = URL.createObjectURL(e.target.files[0]);
}, false);

var s1, s1a, s2, c1, c2, c3, c4, srow = 0,
  scol = 0,
  crow = 0,
  ccol = 0,
  c34row = 0,
  c34col = 0,
  A, B, A_inv;

srcImgEl.onload = function() {
  var src = cv.imread(srcImgEl);
  srow = src.rows;
  scol = src.cols;
  s1 = getpixels(src);
  document.getElementById("image1size").innerHTML = ('大小' + srow + '*' + scol);
}

srcImgE2.onload = function() {
  var src = cv.imread(srcImgE2);
  crow = src.rows;
  ccol = src.cols;
  c1 = getpixels(src);
  document.getElementById("image2size").innerHTML = ('大小' + crow + '*' + ccol);
}

function getarr(n) {
  var arr = new Array();
  for (var i = 0; i < n; i++)
    arr[i] = new Array();
  return arr;
}

function srgb(r, g, b, s) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.s = s;
}

function getpixels(src) {
  var p = new getarr(src.rows);
  for (var y = 0; y < src.rows; y++) {
    for (var x = 0; x < src.cols; x++) {
      var tmp = src.ucharPtr(y, x);
      p[y][x] = new srgb(tmp[0], tmp[1], tmp[2], tmp[3]);
    }
  }
  return p;
}

function getAB() {
  A = document.getElementById('AA').value * 1;
  B = document.getElementById('AB').value * 1;
  if (A % 2 == 0 || 256 % A == 0 || A < 0)
    window.alert("錯誤:隨機數A錯誤");
  if (B < 1 || B > 255)
    window.alert("錯誤:隨機數B錯誤");
  //console.log(A, B);
}

function getA_inv(n) {
  var inv;
  for (var i = 0; i < 256; i++) {
    var flag = (n * i) % 256;
    if (flag == 1)
      inv = i;
  }
  return inv;
}

function affine() {
  getAB();
  AC = new getarr(srow);
  s1a = new getarr(srow);
  for (var y = 0; y < srow; y++) {
    for (var x = 0; x < scol; x++) {
      s1a[y][x] = new srgb((s1[y][x].r * A + B) % 256, (s1[y][x].g * A + B) % 256, (s1[y][x].b * A + B) % 256, 255);
    }
  }
}

function xorpixels() {
  affine();
  s2 = new getarr(crow);
  for (var y = 0; y < srow; y++) {
    for (var x = 0; x < scol; x++) {
      for (var n = 0; n < 4; n++) {
        s2[2 * y + Math.floor(n / 2)][2 * x + (n % 2)] = s1a[y][x];
      }
    }
  }
  c2 = new getarr(crow);
  for (var y = 0; y < crow; y++) {
    for (var x = 0; x < ccol; x++) {
      c2[y][x] = new srgb(s2[y][x].r ^ c1[y][x].r, s2[y][x].g ^ c1[y][x].g, s2[y][x].b ^ c1[y][x].b, 255);
    }
  }
}

function getphotos() {
  xorpixels();
  var num = document.getElementById('quantity');
  var photos = new Array(16);
  for (var i = 0; i < num.value; i++) {
    var tmp = getarr(crow);
    photos[i] = tmp;
  }
  for (var y = 0; y < crow; y += 2) {
    for (var x = 0; x < ccol; x += 2) {
      var times = new Array(16);
      for (var j = 0; j < 16; j++)
        times[j] = 0;
      for (var p = 0; p < num.value; p++) {
        var rn = Math.floor(Math.random() * 16);
        while (times[rn])
          rn = Math.floor(Math.random() * 16);
        for (var n = 0; n < 4; n++) {
          if (Math.floor(rn / Math.pow(2, (3 - n))) % 2 == 0)
            photos[p][y + Math.floor(n / 2)][x + (n % 2)] = c1[y + Math.floor(n / 2)][x + (n % 2)];
          else
            photos[p][y + Math.floor(n / 2)][x + (n % 2)] = c2[y + Math.floor(n / 2)][x + (n % 2)];
        }
        times[rn]++;
      }
    }
  }
  return photos;
}

function showphotos() {
  $("input:checkbox").prop("disabled", false);
  if (ccol != scol * 2 || crow != srow * 2 || srow == 0 || scol == 0 || crow == 0 || ccol == 0)
    window.alert("錯誤:沒有圖片或圖片大小錯誤");
  else {
    var num = document.getElementById('quantity');
    if (num.value == 0)
      window.alert("請輸入生成張數");
    else {
      var tmp = getphotos();
      for (var p = 1; p <= num.value; p++) {
        var c = document.getElementById('canvas' + p),
          ctx = c.getContext('2d'),
          imgData = ctx.createImageData(crow, ccol);
        c.width = ccol;
        c.height = crow;
        for (var y = 0; y < crow; y++) {
          for (var x = 0; x < ccol; x++) {
            imgData.data[y * ccol * 4 + x * 4 + 0] = tmp[p - 1][y][x].r;
            imgData.data[y * ccol * 4 + x * 4 + 1] = tmp[p - 1][y][x].g;
            imgData.data[y * ccol * 4 + x * 4 + 2] = tmp[p - 1][y][x].b;
            if (y == 0 && x == 0)
              imgData.data[y * ccol * 4 + x * 4 + 3] = A;
            else if (y == 0 && x == 1)
              imgData.data[y * ccol * 4 + x * 4 + 3] = B;
            else
              imgData.data[y * ccol * 4 + x * 4 + 3] = tmp[p - 1][y][x].s;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }
  }
}

var fileUploadE3 = document.getElementById('file-upload3'),
  srcImgE3 = document.getElementById('src-image3')
fileUploadE3.addEventListener("change", function(e) {
  srcImgE3.src = URL.createObjectURL(e.target.files[0]);
}, false);

var fileUploadE4 = document.getElementById('file-upload4'),
  srcImgE4 = document.getElementById('src-image4')
fileUploadE4.addEventListener("change", function(e) {
  srcImgE4.src = URL.createObjectURL(e.target.files[0]);
}, false);

srcImgE3.onload = function() {
  var src = cv.imread(srcImgE3);
  c34row = src.rows;
  c34col = src.cols;
  c3 = getpixels(src);
}

srcImgE4.onload = function() {
  var src = cv.imread(srcImgE4);
  c4 = getpixels(src);
}

function showphoto() {
  if (c3 != null && c4 != null) {
    var AA = c3[0][0].s,
      BB = c3[0][1].s;
    var AA_inv = getA_inv(AA);
    var c = document.getElementById('canvas'),
      ctx = c.getContext('2d'),
      imgData = ctx.createImageData(c34row / 2, c34col / 2),
      tmpc = [];
    c.width = c34col / 2;
    c.height = c34row / 2;
    for (var y = 0; y < c34row; y++) {
      for (var x = 0; x < c34col; x++) {
        tmpc[y * 4 * c34col + x * 4 + 0] = c3[y][x].r ^ c4[y][x].r;
        tmpc[y * 4 * c34col + x * 4 + 1] = c3[y][x].g ^ c4[y][x].g;
        tmpc[y * 4 * c34col + x * 4 + 2] = c3[y][x].b ^ c4[y][x].b;
        tmpc[y * 4 * c34col + x * 4 + 3] = 255;
      }
    }
    for (var y = 0; y < c34row / 2; y++) {
      for (var x = 0; x < c34col / 2; x++) {
        for (var t = 0; t < 4; t++) {
          var z = Math.max(tmpc[2 * y * c34col * 4 + 2 * x * 4 + t], tmpc[2 * y * c34col * 4 + (2 * x + 1) * 4 + t], tmpc[(2 * y + 1) * c34col * 4 + 2 * x * 4 + t], tmpc[(2 * y + 1) * c34col * 4 + (2 * x + 1) * 4 + t]) - BB;
          if (z < 0) z += 256;
          imgData.data[y * c34col / 2 * 4 + x * 4 + t] = z * AA_inv % 256;
        }
      }
    }
    for (var i = 3; i < imgData.data.length; i += 4)
      imgData.data[i] = 255;
    ctx.putImageData(imgData, 0, 0);
  } else {
    var a = -1,
      b = -1;
    var markedCheckbox = document.querySelectorAll('input[type="checkbox"]:checked');
    for (var checkbox of markedCheckbox) {
      if (a == -1) a = checkbox.value;
      else b = checkbox.value;
    }
    var c = document.getElementById('canvas'),
      ctx = c.getContext('2d'),
      imgData = ctx.createImageData(srow, scol);
    if (a != -1 && b != -1) {
      document.getElementById("err").innerHTML = ('');
      var c_a = document.getElementById('canvas' + a),
        ctx_a = c_a.getContext('2d'),
        imgData_a = ctx_a.getImageData(0, 0, ccol, crow),
        c_b = document.getElementById('canvas' + b),
        ctx_b = c_b.getContext('2d'),
        imgData_b = ctx_b.getImageData(0, 0, ccol, crow),
        tmp = [];
      c.width = scol;
      c.height = srow;
      for (var i = 0; i < imgData_a.data.length; i++) {
        if (i % 4 == 3) {
          tmp[i] = 255;
          continue;
        }
        tmp[i] = imgData_a.data[i] ^ imgData_b.data[i];
      }
      var AA = imgData_a.data[3],
        BB = imgData_a.data[7];
      var AA_inv = getA_inv(AA);
      //console.log(A, B, AA, BB, AA_inv);
      for (var y = 0; y < srow; y++) {
        for (var x = 0; x < scol; x++) {
          for (var t = 0; t < 4; t++) {
            var z = Math.max(tmp[2 * y * ccol * 4 + 2 * x * 4 + t], tmp[2 * y * ccol * 4 + (2 * x + 1) * 4 + t], tmp[(2 * y + 1) * ccol * 4 + 2 * x * 4 + t], tmp[(2 * y + 1) * ccol * 4 + (2 * x + 1) * 4 + t]) - BB;
            if (z < 0) z += 256;
            imgData.data[y * scol * 4 + x * 4 + t] = z * AA_inv % 256;
          }
        }
      }
      for (var i = 3; i < imgData.data.length; i += 4)
        imgData.data[i] = 255;
      ctx.putImageData(imgData, 0, 0);
      document.getElementById("err").innerHTML = ('圖' + a + " XOR 圖" + b);
    } else {
      window.alert('請選擇兩張圖片');
      for (var i = 0; i < imgData.data.length; i++)
        imgData.data[i] = 0;
      ctx.putImageData(imgData, 0, 0);
    }
  }
}

function rechoose() {
  document.getElementById("err").innerHTML = ('');
  $('input:checkbox').removeAttr('checked');
  $("input:checkbox").prop("disabled", false);
  var c = document.getElementById('canvas'),
    ctx = c.getContext('2d'),
    imgData = ctx.getImageData(0, 0, scol, srow);
  for (var i = 0; i < imgData.data.length; i++)
    imgData.data[i] = 0;
  ctx.putImageData(imgData, 0, 0);
  document.getElementById("check").innerHTML = ('');
}

function check() {
  var c = document.getElementById('canvas'),
    ctx = c.getContext('2d'),
    imgData = ctx.getImageData(0, 0, scol, srow),
    n = 0;
  for (var y = 0; y < srow; y++) {
    for (var x = 0; x < scol; x++) {
      if (imgData.data[y * scol * 4 + x * 4] == s1[y][x].r && imgData.data[y * scol * 4 + x * 4 + 1] == s1[y][x].g && imgData.data[y * scol * 4 + x * 4 + 2] == s1[y][x].b)
        n += 4;
    }
  }
  console.log(s1[0][0].r,s1[0][0].g,s1[0][0].b,s1[0][0].s);
  console.log(imgData.data[0],imgData.data[1],imgData.data[2],imgData.data[3]);
  console.log(s1[0][1].r,s1[0][1].g,s1[0][1].b,s1[0][1].s);
  console.log(imgData.data[4],imgData.data[5],imgData.data[6],imgData.data[7]);
  document.getElementById("check").innerHTML = ('與原圖' + n + '處相同,' + n / imgData.data.length * 100 + '%相符');
}

function reset() {
  location.reload();
}
