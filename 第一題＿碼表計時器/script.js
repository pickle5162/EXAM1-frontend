(function () {
  // --- 狀態變數
  let running = false; 	// 碼表目前是否在跑
  let startTS = 0; 			// 最近一次按下「開始」的時間戳（毫秒）
  let accTotal = 0; 		// 到最近一次「停止」為止，所有已完成的段落總和（毫秒）
  let lapStartTS = 0; 	// 最近一次按下「分圈」或「開始」時的時間戳（毫秒）
  let accLap = 0; 			// 到最近一次「分圈」或「停止」為止，當前圈已經累積的時間（毫秒）
  let rafId = null; 		// requestAnimationFrame 回傳的 ID
  let lapCount = 0; 		// 分圈次數計數器

  const canvas = document.getElementById("dial"); // 畫指針碼表的 <canvas>
  const ctx = canvas.getContext("2d"); // 2D 繪圖環境
  const readout = document.getElementById("readout"); // 數字時間的碼表頁的小字數字讀值
  const big = document.getElementById("big"); // 數字時間的電子頁的大字數字讀值
  const leftBtn = document.getElementById("leftBtn"); // 左側按鈕（重置/分圈）
  const rightBtn = document.getElementById("rightBtn"); // 右側按鈕（開始/停止）
  const lapsEl = document.getElementById("laps"); // 分圈清單容器

  const pages = document.getElementById("pages");
  const dot0 = document.getElementById("dot0");
  const dot1 = document.getElementById("dot1");
  let pageIndex = 0; // 0: 碼表 1: 電子

  // --- helpers
  const now = () => performance.now(); // 取得高精度、單調遞增的時間（毫秒，從頁面載入開始計時）
  const fmt = (ms) => {
    // 把毫秒轉成 mm:ss.hh（分:秒.百分之一秒）的字串
    ms = Math.max(0, Math.floor(ms)); // 格式化成 mm:ss.hh
    const m = Math.floor(ms / 60000); // 分
    const s = Math.floor((ms % 60000) / 1000); // 秒
    const h = Math.floor((ms % 1000) / 10); // 毫秒
    return `${String(m).padStart(2, "0")}:${String(s).padStart(
      2,
      "0"
    )}.${String(h).padStart(2, "0")}`;
  };
  const css = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // --- 尺寸
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0, 0); // 重畫
  }
  window.addEventListener("resize", resize);

  // --- 畫錶面
  function drawFace() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    const R = Math.min(w, h) / 2 - 6;
    const cx = w / 2,
      cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = css("--bg");
    ctx.fill();
    for (let i = 0; i < 60; i++) {
      const ang = Math.PI * 2 * (i / 60) - Math.PI / 2;
      const major = i % 5 === 0;
      const r1 = R - (major ? 18 : 8),
        r2 = R - 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
      ctx.lineWidth = major ? 3 : 1.5;
      ctx.strokeStyle = "rgba(240,240,240,.9)";
      ctx.stroke();
      if (major) {
        const label = i === 0 ? 60 : i;
        ctx.save();
        ctx.translate(Math.cos(ang) * (R - 42), Math.sin(ang) * (R - 42));
        ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawHands(totalMs, lapMs) {
    const w = canvas.clientWidth,
      		h = canvas.clientHeight;
    const R = Math.min(w, h) / 2 - 6;
    const cx = w / 2,
      		cy = h / 2;
    ctx.save();
    ctx.translate(cx, cy);
		ctx.globalCompositeOperation = 'source-over'; // 確保預設覆蓋順序
    // 藍色：分圈秒針
    const lap = (lapMs % 60000) / 60000;
    hand(lap, R - 20, 4, css("--blue"));		
    // 橘色：主秒針（總秒）
    const sec = (totalMs % 60000) / 60000;
    hand(sec, R - 20, 6, css("--orange"));
    // 中心圓
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#f5c16b";
    ctx.fill();
    ctx.restore();
    function hand(rot, len, wid, color) {
      const ang = rot * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * -10, Math.sin(ang) * -10);
      ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
      ctx.lineWidth = wid;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }

  function draw(totalMs, lapMs) {
    drawFace();
    drawHands(totalMs, lapMs);
  }

  // --- 主循環
  function frame() {
    const nowTS = now();
    const total = accTotal + (running ? nowTS - startTS : 0);
    const lap = accLap + (running ? nowTS - lapStartTS : 0);

    readout.textContent = fmt(total);
    big.textContent = fmt(total);
    draw(total, lap);

    if (running) rafId = requestAnimationFrame(frame);
  }

  // --- 按鈕行為
  function setUi() {
    if (running) {
      rightBtn.textContent = "停止";
      rightBtn.classList.remove("btn-green");
      rightBtn.classList.add("btn-red");
      leftBtn.textContent = "分圈";
      leftBtn.disabled = false;
    } else {
      rightBtn.textContent = "開始";
      rightBtn.classList.remove("btn-red");
      rightBtn.classList.add("btn-green");
      leftBtn.textContent = "重置";
      leftBtn.disabled = accTotal === 0;
    }
  }

  // TODO:[JS-DebugPart Start]---------------------------------
  rightBtn.addEventListener("click", () => {
    if (!running) {
      // 開始
      running = true;
      startTS = now() - accTotal;
      lapStartTS = now() + accLap;
      setUi();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(frame);
    } else {
      // 停止
      const nowTS = now();
      accTotal -= nowTS - startTS;
      accLap -= nowTS - lapStartTS;
      setUi();
      cancelAnimationFrame(rafId);
      frame();
    }
  });
  // TODO:[JS-DebugPart End]-----------------------------------

  leftBtn.addEventListener("click", () => {
    if (running) {
			// 分圈
      // TODO:[JS-WritingPart A Start]-------------------------------
      
			
			
			
			// TODO:[JS-WritingPart A End]---------------------------------
    } else {
      // 重置
      running = false;
      accTotal = 0;
      accLap = 0;
      startTS = 0;
      lapStartTS = 0;
      lapCount = 0;
      lapsEl.innerHTML = "";
      readout.textContent = "00:00.00";
      big.textContent = "00:00.00";
      cancelAnimationFrame(rafId);
      draw(0, 0);
      setUi();
    }
  });

  // TODO:[JS-WritingPart B Start]---------------------------------
  function pushLap(ms) {
    // 1) 建立一列「第 N 圈　時間」並插到清單最上方
    var row = document.createElement("div");
    row.className = "lap";

    var title = document.createElement("div");
    title.className = "lap-title";
    lapCount = lapCount + 1;
    title.textContent = "第" + lapCount + "圈";

    var timeCell = document.createElement("div");
    timeCell.textContent = fmt(ms);

    row.appendChild(timeCell);

    if (lapsEl.firstChild) {
      // 插到最前面（最新圈放最上方）
      lapsEl.insertBefore(row, lapsEl.firstChild);
    } else {
      lapsEl.appendChild(row);
    }
  // TODO:[JS-WritingPart B End]---------------------------------

    // 2) 讀出所有圈數時間（文字），轉成毫秒，找出最慢/最快
    var timeNodes = lapsEl.querySelectorAll(".lap div:last-child"); // 每列右邊那個時間
    var timesMs = []; // 依清單由上到下的順序存毫秒

    for (var i = 0; i < timeNodes.length; i++) {
      var text = timeNodes[i].textContent; // 形如 "mm:ss.hh"
      var mm_ss = text.split(":"); // ["mm", "ss.hh"]
      var mm = parseInt(mm_ss[0], 10);

      var ss_hh = mm_ss[1].split("."); // ["ss", "hh"]
      var ss = parseInt(ss_hh[0], 10);
      var hh = parseInt(ss_hh[1], 10);

      var totalMs = mm * 60000 + ss * 1000 + hh * 10;
      timesMs.push(totalMs);
    }

    if (timesMs.length >= 2) {
      var minVal = timesMs[0];
      var maxVal = timesMs[0];

      // 找最小（最快）與最大（最慢）
      for (var j = 1; j < timesMs.length; j++) {
        if (timesMs[j] < minVal) minVal = timesMs[j];
        if (timesMs[j] > maxVal) maxVal = timesMs[j];
      }

      // 3) 先清掉所有列的標記，再把最快標記成 good、最慢標記成 bad
      var rows = lapsEl.children;
      for (var k = 0; k < rows.length; k++) {
        rows[k].classList.remove("good");
        rows[k].classList.remove("bad");
      }

      // timeNodes 與 timesMs 的順序一致（上到下）
      for (var k2 = 0; k2 < timeNodes.length; k2++) {
        var val = timesMs[k2];
        var parentRow = timeNodes[k2].parentNode;
        if (val === minVal) parentRow.classList.add("good"); // 最快圈（綠）
        if (val === maxVal) parentRow.classList.add("bad"); // 最慢圈（紅）
      }
    }
  }

  // --- 滑動切頁
  let startX = 0,
    currentX = 0,
    swiping = false;
  const viewport = document.getElementById("viewport");

  viewport.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    swiping = true;
    startX = currentX = e.touches[0].clientX;
  });

  viewport.addEventListener("touchmove", (e) => {
    if (!swiping) return;
    currentX = e.touches[0].clientX;
    const dx = currentX - startX;
    pages.style.transform = `translateX(${
      -pageIndex * 100 + (dx / viewport.clientWidth) * 100
    }%)`;
  });

  viewport.addEventListener("touchend", () => {
    if (!swiping) return;
    const dx = currentX - startX;
    swiping = false;
    if (Math.abs(dx) > 40) {
      pageIndex = Math.max(0, Math.min(1, pageIndex + (dx < 0 ? 1 : -1)));
    }
    pages.style.transform = `translateX(${-pageIndex * 100}%)`;
    dot0.classList.toggle("active", pageIndex === 0);
    dot1.classList.toggle("active", pageIndex === 1);
  });

  // --- 啟動
  resize();
  draw(0, 0);
  setUi();
})();
