window.onOpenCvReady = function() {
  document.getElementById('loading-opencv-msg').remove();
}

$(document).ready(function() {
  $('#input_3_2 input[type=checkbox]').click(function() {
    $("#input_3_2 input[type=checkbox]").attr('disabled', true);
    if ($("#input_3_2 input[type=checkbox]:checked").length >= 2) {
      $("#input_3_2 input[type=checkbox]:checked").attr('disabled', false);
    } else {
      $('#input_3_2 input[type=checkbox]').attr('disabled', false);
    }
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

var s1, s1a, s2, c1, c2, srow = 0,scol = 0,crow = 0,ccol = 0,AC;

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

function ab() {
  this.a = Math.floor(Math.random() * 256);
  while (this.a % 2 == 0)
    this.a = Math.floor(Math.random() * 256);
  this.b = Math.floor(1 + Math.random() * 255);
  for (var i = 0; i < 256; i++) {
    var flag = (this.a * i) % 256;
    if (flag == 1)
      this.a_inv = i;
  }
}

function affine() {
  AC = new getarr(srow);
  s1a = new getarr(srow);
  for (var y = 0; y < srow; y++) {
    for (var x = 0; x < scol; x++) {
      AC[y][x] = new ab();
      s1a[y][x] = new srgb((s1[y][x].r * AC[y][x].a + AC[y][x].b) % 256, (s1[y][x].g * AC[y][x].a + AC[y][x].b) % 256, (s1[y][x].b * AC[y][x].a + AC[y][x].b) % 256, 255);
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
  var num = document.getElementById('quantity');
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
        imgData.data[y * ccol * 4 + x * 4 + 3] = tmp[p - 1][y][x].s;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

function showphoto() {
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
    for (var y = 0; y < srow; y++) {
      for (var x = 0; x < scol; x++) {
        for (var t = 0; t < 4; t++) {
          var z = Math.max(tmp[2 * y * ccol * 4 + 2 * x * 4 + t], tmp[2 * y * ccol * 4 + (2 * x + 1) * 4 + t], tmp[(2 * y + 1) * ccol * 4 + 2 * x * 4 + t], tmp[(2 * y + 1) * ccol * 4 + (2 * x + 1) * 4 + t]) - AC[y][x].b;
          if (z < 0) z += 256;
          imgData.data[y * scol * 4 + x * 4 + t] = z * AC[y][x].a_inv % 256;
        }
      }
    }
    for (var i = 3; i < imgData.data.length; i += 4)
      imgData.data[i] = 255;
    ctx.putImageData(imgData, 0, 0);
  } else {
    document.getElementById("err").innerHTML = ('請選擇兩張圖片');
    for (var i = 0; i < imgData.data.length; i++)
      imgData.data[i] = 0;
    ctx.putImageData(imgData, 0, 0);
  }
}

function rechoose() {
  var c = document.getElementById('canvas'),
    ctx = c.getContext('2d'),
    imgData = ctx.getImageData(0, 0, scol, srow);
   for(var i = 0; i < imgData.data.length; i++)
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
  document.getElementById("check").innerHTML = ('與原圖' + n + '處相同,' + n / imgData.data.length * 100 + '%相符');
}

function reset() {
	var links = document.getElementsByTagName("link");
    for (var cl in links)
    {
        var link = links[cl];
        if (link.rel === "stylesheet")
            link.href += "";
    }
  location.reload();
}