

/* ===== ORIGINAL INLINE TOOLBOX SCRIPT 1 ===== */
(function () {
  const dashboard = document.getElementById("dashboard");
  const textPage = document.getElementById("textToPdfPage");
  const openButton = document.getElementById("textToPdfButton");
  const backButton = document.getElementById("backButton");
  const textInput = document.getElementById("textInput");
  const clearButton = document.getElementById("clearButton");
  const convertButton = document.getElementById("convertButton");
  const status = document.getElementById("status");
  const imageConverterButton = document.getElementById("imageConverterButton");
  const imageConverterPage = document.getElementById("imageConverterPage");
  const imageBackButton = document.getElementById("imageBackButton");
  const chooseImageButton = document.getElementById("chooseImageButton");
  const takePhotoButton = document.getElementById("takePhotoButton");
  const imageFileInput = document.getElementById("imageFileInput");
  const cameraInput = document.getElementById("cameraInput");
  const imagePreview = document.getElementById("imagePreview");
  const imageConvertButton = document.getElementById("imageConvertButton");
  const imageClearButton = document.getElementById("imageClearButton");
  const formatSelect = document.getElementById("formatSelect");
  const imageStatus = document.getElementById("imageStatus");
  const downloadArea = document.getElementById("downloadArea");

  let selectedImages = [];
  const videoToAudioButton = document.getElementById("videoToAudioButton");
  const videoToMp3Page = document.getElementById("videoToMp3Page");
  const videoBackButton = document.getElementById("videoBackButton");
  const quickModeButton = document.getElementById("quickModeButton");
  const largeModeButton = document.getElementById("largeModeButton");
  const quickVideoPanel = document.getElementById("quickVideoPanel");
  const largeVideoPanel = document.getElementById("largeVideoPanel");
  const quickVideoInput = document.getElementById("quickVideoInput");
  const quickVideoInfo = document.getElementById("quickVideoInfo");
  const quickVideoQuality = document.getElementById("quickVideoQuality");
  const quickVideoConvertButton = document.getElementById("quickVideoConvertButton");
  const quickVideoProgress = document.getElementById("quickVideoProgress");
  const quickVideoProgressLabel = document.getElementById("quickVideoProgressLabel");
  const quickVideoPercent = document.getElementById("quickVideoPercent");
  const quickVideoFill = document.getElementById("quickVideoFill");
  const quickVideoStatus = document.getElementById("quickVideoStatus");
  const quickVideoDownload = document.getElementById("quickVideoDownload");
  const quickVideoDownloadLink = document.getElementById("quickVideoDownloadLink");
  const quickVideoClearButton = document.getElementById("quickVideoClearButton");

  let quickVideoFile = null;
  let quickVideoOutputUrl = null;
  let quickVideoWorking = false;


  imageConverterButton.addEventListener("click", function () {
    dashboard.classList.add("hidden");
    textPage.classList.add("hidden");
    imageConverterPage.classList.remove("hidden");
  });

  imageBackButton.addEventListener("click", function () {
    imageConverterPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });

  videoToAudioButton.addEventListener("click", function () {
    dashboard.classList.add("hidden");
    textPage.classList.add("hidden");
    imageConverterPage.classList.add("hidden");
    videoToMp3Page.classList.remove("hidden");
  });

  videoBackButton.addEventListener("click", function () {
    videoToMp3Page.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });

  function showQuickMode() {
    quickModeButton.classList.add("active");
    largeModeButton.classList.remove("active");
    quickVideoPanel.style.display = "block";
    largeVideoPanel.style.display = "none";
  }

  function showLargeMode() {
    largeModeButton.classList.add("active");
    quickModeButton.classList.remove("active");
    quickVideoPanel.style.display = "none";
    largeVideoPanel.style.display = "block";
  }

  quickModeButton.addEventListener("click", showQuickMode);
  largeModeButton.addEventListener("click", showLargeMode);

  // --- Quick Video V3 engine (approved standalone V3, integrated without changing
  // Text to PDF or Image Converter logic) ---
  const QUICK_MAX = 500 * 1024 * 1024;

  function quickFmtBytes(b) {
    if (b < 1024) return b + " B";
    let n = b / 1024;
    const units = ["KB", "MB", "GB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 10 ? 1 : 2) + " " + units[i];
  }

  function quickEsc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function quickProg(p, msg) {
    p = Math.max(0, Math.min(100, p));
    quickVideoFill.style.width = p + "%";
    quickVideoPercent.textContent = Math.round(p) + "%";
    if (msg) quickVideoStatus.textContent = msg;
  }

  function clearQuickOutput() {
    if (quickVideoOutputUrl) {
      URL.revokeObjectURL(quickVideoOutputUrl);
      quickVideoOutputUrl = null;
    }
    quickVideoDownloadLink.removeAttribute("href");
    quickVideoDownload.style.display = "none";
  }

  quickVideoInput.addEventListener("change", function () {
    clearQuickOutput();
    const f = quickVideoInput.files && quickVideoInput.files[0];
    quickVideoFile = null;
    quickVideoConvertButton.disabled = true;
    quickVideoProgress.style.display = "none";

    if (!f) return;

    if (f.size > QUICK_MAX) {
      quickVideoInfo.style.display = "block";
      quickVideoInfo.textContent = "❌ This file is larger than the 500 MB Quick Video limit.";
      return;
    }

    quickVideoFile = f;
    quickVideoInfo.style.display = "block";
    quickVideoInfo.innerHTML =
      "<strong>" + quickEsc(f.name) + "</strong><br>" +
      "Size: " + quickFmtBytes(f.size) + "<br>" +
      "Type: " + quickEsc(f.type || "Unknown");
    quickVideoConvertButton.disabled = false;
  });

  async function convertQuickVideo() {
    if (!quickVideoFile || quickVideoWorking) return;

    if (!window.lamejs) {
      alert("The MP3 encoder could not be loaded. Please check your internet connection.");
      return;
    }

    quickVideoWorking = true;
    quickVideoConvertButton.disabled = true;
    clearQuickOutput();
    quickVideoProgress.style.display = "block";
    quickVideoProgressLabel.textContent = "Converting…";
    quickProg(1, "Reading video…");

    let ctx = null;

    try {
      const ab = await quickVideoFile.arrayBuffer();
      quickProg(8, "Decoding audio…");

      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const audio = await ctx.decodeAudioData(ab);

      quickProg(35, "Audio decoded — encoding MP3…");

      const sr = audio.sampleRate;
      const ch = Math.min(2, audio.numberOfChannels);
      const kbps = Number(quickVideoQuality.value);
      const enc = new lamejs.Mp3Encoder(ch, sr, kbps);

      const block = 1152;
      const left = audio.getChannelData(0);
      const right = ch > 1 ? audio.getChannelData(1) : null;
      const l16 = new Int16Array(block);
      const r16 = ch > 1 ? new Int16Array(block) : null;
      const chunks = [];
      const total = left.length;

      const batchSamples = block * 128;

      for (let pos = 0; pos < total; pos += batchSamples) {
        const end = Math.min(pos + batchSamples, total);

        for (let p = pos; p < end; p += block) {
          const len = Math.min(block, total - p);

          for (let i = 0; i < len; i++) {
            const lv = left[p + i];
            l16[i] = lv <= -1 ? -32768 : lv >= 1 ? 32767 : (lv * 32767.5) | 0;
          }

          if (ch > 1) {
            for (let i = 0; i < len; i++) {
              const rv = right[p + i];
              r16[i] = rv <= -1 ? -32768 : rv >= 1 ? 32767 : (rv * 32767.5) | 0;
            }
          }

          const out = ch > 1
            ? enc.encodeBuffer(l16.subarray(0, len), r16.subarray(0, len))
            : enc.encodeBuffer(l16.subarray(0, len));

          if (out.length) chunks.push(new Int8Array(out));
        }

        quickProg(35 + (end / total) * 63, "Encoding MP3…");
        await new Promise(function (resolve) { setTimeout(resolve, 0); });
      }

      quickProg(99, "Finalizing MP3…");

      const tail = enc.flush();
      if (tail.length) chunks.push(new Int8Array(tail));

      const blob = new Blob(chunks, { type: "audio/mpeg" });
      if (blob.size < 1024) {
        throw new Error("The MP3 output is unexpectedly small.");
      }

      quickVideoOutputUrl = URL.createObjectURL(blob);
      const base = quickVideoFile.name.replace(/\.[^/.]+$/, "") || "audio";
      quickVideoDownloadLink.href = quickVideoOutputUrl;
      quickVideoDownloadLink.download = base + ".mp3";
      quickVideoDownload.style.display = "block";
      quickVideoProgressLabel.textContent = "Conversion complete";
      quickProg(100, "MP3 ready — download it now.");
    } catch (error) {
      quickVideoProgressLabel.textContent = "Conversion stopped";
      quickProg(0, "❌ " + (error && error.message ? error.message : "Conversion failed."));
    } finally {
      if (ctx) {
        try { await ctx.close(); } catch (e) {}
      }
      quickVideoWorking = false;
      quickVideoConvertButton.disabled = !quickVideoFile;
    }
  }

  quickVideoConvertButton.addEventListener("click", convertQuickVideo);

  quickVideoClearButton.addEventListener("click", function () {
    clearQuickOutput();
    quickVideoFile = null;
    quickVideoInput.value = "";
    quickVideoInfo.style.display = "none";
    quickVideoInfo.textContent = "";
    quickVideoProgress.style.display = "none";
    quickVideoConvertButton.disabled = true;
    quickProg(0, "Ready.");
  });


  chooseImageButton.addEventListener("click", function () {
    imageFileInput.click();
  });

  takePhotoButton.addEventListener("click", function () {
    cameraInput.click();
  });

  function handleImages(fileList) {
    selectedImages = Array.from(fileList).filter(function (file) {
      return file.type.startsWith("image/");
    });

    renderPreview();
    downloadArea.innerHTML = "";
    imageStatus.textContent = selectedImages.length
      ? selectedImages.length + " image(s) selected."
      : "No valid image selected.";
  }

  imageFileInput.addEventListener("change", function () {
    handleImages(imageFileInput.files);
  });

  cameraInput.addEventListener("change", function () {
    handleImages(cameraInput.files);
  });

  function renderPreview() {
    if (!selectedImages.length) {
      imagePreview.textContent = "No image selected.";
      return;
    }

    imagePreview.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "preview-grid";

    selectedImages.forEach(function (file) {
      const item = document.createElement("div");
      item.className = "preview-item";

      const img = document.createElement("img");
      img.alt = file.name;
      img.src = URL.createObjectURL(file);

      const name = document.createElement("div");
      name.className = "preview-name";
      name.textContent = file.name;

      item.appendChild(img);
      item.appendChild(name);
      grid.appendChild(item);
    });

    imagePreview.appendChild(grid);
  }

  imageClearButton.addEventListener("click", function () {
    selectedImages = [];
    imageFileInput.value = "";
    cameraInput.value = "";
    imagePreview.textContent = "No image selected.";
    imageStatus.textContent = "";
    downloadArea.innerHTML = "";
  });

  function createDownload(blob, filename) {
    downloadArea.innerHTML = "";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.className = "download-link";
    link.href = url;
    link.download = filename;
    link.textContent = "⬇️ Download " + filename;
    downloadArea.appendChild(link);
  }

  function canvasBlob(image, type, quality) {
    return new Promise(function (resolve) {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(image, 0, 0);
      canvas.toBlob(resolve, type, quality);
    });
  }


  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read image."));
      };

      image.src = url;
    });
  }

  function escapePdfText(text) {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function createImagePDF(files) {
    return new Promise(async function (resolve, reject) {
      try {
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 28;
        const objects = [];
        const pageRefs = [];
        let nextObject = 4;

        for (let i = 0; i < files.length; i++) {
          const image = await loadImageFromFile(files[i]);

          const maxWidth = pageWidth - margin * 2;
          const maxHeight = pageHeight - margin * 2;

          const scale = Math.min(
            maxWidth / image.naturalWidth,
            maxHeight / image.naturalHeight,
            1
          );

          const drawWidth = image.naturalWidth * scale;
          const drawHeight = image.naturalHeight * scale;
          const x = (pageWidth - drawWidth) / 2;
          const y = (pageHeight - drawHeight) / 2;

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(drawWidth));
          canvas.height = Math.max(1, Math.round(drawHeight));

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
          const base64 = jpegDataUrl.split(",")[1];
          const binary = atob(base64);
          const imageBytes = new Uint8Array(binary.length);

          for (let j = 0; j < binary.length; j++) {
            imageBytes[j] = binary.charCodeAt(j);
          }

          const imageObject = nextObject++;
          const contentObject = nextObject++;
          const pageObject = nextObject++;

          const content =
            "q\n" +
            drawWidth.toFixed(2) + " 0 0 " +
            drawHeight.toFixed(2) + " " +
            x.toFixed(2) + " " +
            y.toFixed(2) + " cm\n" +
            "/Im" + i + " Do\nQ";

          objects.push({
            number: imageObject,
            bytes: imageBytes,
            type: "image"
          });

          objects.push({
            number: contentObject,
            text: "<< /Length " + content.length + " >>\nstream\n" +
                  content + "\nendstream"
          });

          objects.push({
            number: pageObject,
            text:
              "<< /Type /Page /Parent 2 0 R " +
              "/MediaBox [0 0 " + pageWidth + " " + pageHeight + "] " +
              "/Resources << /XObject << /Im" + i + " " +
              imageObject + " 0 R >> >> " +
              "/Contents " + contentObject + " 0 R >>"
          });

          pageRefs.push(pageObject + " 0 R");
        }

        const pagesObject =
          "<< /Type /Pages /Kids [" + pageRefs.join(" ") +
          "] /Count " + pageRefs.length + " >>";

        const catalogObject =
          "<< /Type /Catalog /Pages 2 0 R >>";

        const pdfParts = [];
        const offsets = [];
        let length = 0;

        function addPart(text) {
          const bytes = new TextEncoder().encode(text);
          pdfParts.push(bytes);
          length += bytes.length;
        }

        addPart("%PDF-1.4\n");

        const allObjects = [
          { number: 1, text: catalogObject },
          { number: 2, text: pagesObject },
          { number: 3, text: "<< /Producer (Soft Week File Toolbox) /Type /Info >>" },
          ...objects
        ].sort(function (a, b) {
          return a.number - b.number;
        });

        allObjects.forEach(function (obj) {
          offsets[obj.number] = length;

          if (obj.type === "image") {
            const header = obj.number + " 0 obj\n" +
              "<< /Type /XObject /Subtype /Image " +
              "/Width " + Math.round(obj.width || 0) +
              " /Height " + Math.round(obj.height || 0) +
              " /ColorSpace /DeviceRGB /BitsPerComponent 8 " +
              "/Filter /DCTDecode /Length " + obj.bytes.length +
              " >>\nstream\n";

            // Width/height are recovered from the corresponding canvas data
            // by reading JPEG dimensions below if necessary.
            const marker = findJpegSize(obj.bytes);
            const correctedHeader = obj.number + " 0 obj\n" +
              "<< /Type /XObject /Subtype /Image " +
              "/Width " + marker.width +
              " /Height " + marker.height +
              " /ColorSpace /DeviceRGB /BitsPerComponent 8 " +
              "/Filter /DCTDecode /Length " + obj.bytes.length +
              " >>\nstream\n";

            addPart(correctedHeader);
            pdfParts.push(obj.bytes);
            length += obj.bytes.length;
            addPart("\nendstream\nendobj\n");
          } else {
            addPart(obj.number + " 0 obj\n" + obj.text + "\nendobj\n");
          }
        });

        const xrefOffset = length;
        addPart(
          "xref\n0 " + (allObjects.length + 1) + "\n" +
          "0000000000 65535 f \n"
        );

        for (let i = 1; i <= allObjects.length; i++) {
          addPart(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
        }

        addPart(
          "trailer\n<< /Size " + (allObjects.length + 1) +
          " /Root 1 0 R /Info 3 0 R >>\n" +
          "startxref\n" + xrefOffset + "\n%%EOF"
        );

        resolve(new Blob(pdfParts, { type: "application/pdf" }));
      } catch (error) {
        reject(error);
      }
    });
  }

  function findJpegSize(bytes) {
    let offset = 2;

    while (offset < bytes.length) {
      if (bytes[offset] !== 0xFF) {
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];

      if (
        marker >= 0xC0 &&
        marker <= 0xC3
      ) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width: width, height: height };
      }

      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + segmentLength;
    }

    return { width: 1, height: 1 };
  }

  imageConvertButton.addEventListener("click", async function () {
    if (!selectedImages.length) {
      imageStatus.textContent = "Please select an image first.";
      return;
    }

    const target = formatSelect.value;

    if (target === "pdf") {
      imageStatus.textContent = "Creating PDF...";
      try {
        const pdfBlob = await createImagePDF(selectedImages);
        createDownload(pdfBlob, "converted-images.pdf");
        imageStatus.textContent = "PDF conversion completed ✓";
      } catch (error) {
        imageStatus.textContent = "PDF conversion failed.";
      }
      return;
    }

    if (selectedImages.length > 1) {
      imageStatus.textContent = "For JPG, PNG and WebP, please select one image at a time.";
      return;
    }

    const file = selectedImages[0];
    const image = new Image();

    image.onload = async function () {
      let mime = "image/jpeg";
      let extension = "jpg";

      if (target === "png") {
        mime = "image/png";
        extension = "png";
      } else if (target === "webp") {
        mime = "image/webp";
        extension = "webp";
      }

      const blob = await canvasBlob(image, mime, target === "jpg" ? 0.92 : undefined);

      if (!blob) {
        imageStatus.textContent = "Conversion failed.";
        return;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, "") || "converted-image";
      const filename = baseName + "." + extension;

      createDownload(blob, filename);
      imageStatus.textContent = "Conversion completed ✓";
    };

    image.onerror = function () {
      imageStatus.textContent = "The selected image could not be read.";
    };

    image.src = URL.createObjectURL(file);
  });


  openButton.addEventListener("click", function () {
    dashboard.classList.add("hidden");
    textPage.classList.remove("hidden");
    textInput.focus();
  });

  backButton.addEventListener("click", function () {
    textPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });

  clearButton.addEventListener("click", function () {
    textInput.value = "";
    status.textContent = "Text area cleared.";
    textInput.focus();
  });

  convertButton.addEventListener("click", function () {
    const text = textInput.value;

    if (!text.trim()) {
      status.textContent = "Please write some text before converting.";
      textInput.focus();
      return;
    }

    const lines = text.split("\n");
    const escapedLines = lines.map(function (line) {
      return line
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
    });

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const fontSize = 12;
    const lineHeight = 18;
    const maxChars = 82;
    const linesPerPage = 40;

    const wrapped = [];

    escapedLines.forEach(function (line) {
      if (line.length === 0) {
        wrapped.push("");
        return;
      }

      let remaining = line;
      while (remaining.length > maxChars) {
        let cut = remaining.lastIndexOf(" ", maxChars);
        if (cut <= 0) cut = maxChars;
        wrapped.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut).replace(/^ /, "");
      }
      wrapped.push(remaining);
    });

    const pages = [];
    for (let i = 0; i < wrapped.length; i += linesPerPage) {
      pages.push(wrapped.slice(i, i + linesPerPage));
    }

    const objects = [];
    const pageObjectNumbers = [];
    const contentObjectNumbers = [];

    pages.forEach(function (pageLines) {
      const pageNum = 3 + objects.length;
      pageObjectNumbers.push(pageNum);

      const commands = [
        "BT",
        "/F1 " + fontSize + " Tf",
        margin + " " + (pageHeight - margin - fontSize) + " Td"
      ];

      pageLines.forEach(function (line, index) {
        if (index > 0) commands.push("0 -" + lineHeight + " Td");
        commands.push("(" + line + ") Tj");
      });

      commands.push("ET");
      const content = commands.join("\n");
      const contentNum = pageNum + 1;
      contentObjectNumbers.push(contentNum);

      objects.push({ num: pageNum, text: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] /Resources << /Font << /F1 1 0 R >> >> /Contents " + contentNum + " 0 R >>" });
      objects.push({ num: contentNum, text: "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream" });
    });

    const kids = pageObjectNumbers.map(function (n) {
      return n + " 0 R";
    }).join(" ");

    objects.unshift({
      num: 2,
      text: "<< /Type /Pages /Kids [" + kids + "] /Count " + pageObjectNumbers.length + " >>"
    });

    objects.unshift({
      num: 1,
      text: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    });

    objects.unshift({
      num: 3,
      text: "<< /Type /Catalog /Pages 2 0 R >>"
    });

    // Renumber objects sequentially and rebuild references.
    const pageCount = pages.length;
    const pdfObjects = [];

    pdfObjects.push("<< /Type /Catalog /Pages 2 0 R >>");
    pdfObjects.push("<< /Type /Pages /Kids [" +
      Array.from({length: pageCount}, function (_, i) {
        return (4 + i * 2) + " 0 R";
      }).join(" ") +
      "] /Count " + pageCount + " >>");
    pdfObjects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    pages.forEach(function (pageLines, pageIndex) {
      const pageNum = 4 + pageIndex * 2;
      const contentNum = pageNum + 1;

      const commands = [
        "BT",
        "/F1 " + fontSize + " Tf",
        margin + " " + (pageHeight - margin - fontSize) + " Td"
      ];

      pageLines.forEach(function (line, index) {
        if (index > 0) commands.push("0 -" + lineHeight + " Td");
        commands.push("(" + line + ") Tj");
      });

      commands.push("ET");
      const content = commands.join("\n");

      pdfObjects.push(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
        pageWidth + " " + pageHeight +
        "] /Resources << /Font << /F1 3 0 R >> >> /Contents " +
        contentNum + " 0 R >>"
      );

      pdfObjects.push(
        "<< /Length " + content.length + " >>\nstream\n" +
        content + "\nendstream"
      );
    });

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    pdfObjects.forEach(function (obj, index) {
      offsets[index + 1] = pdf.length;
      pdf += (index + 1) + " 0 obj\n" + obj + "\nendobj\n";
    });

    const xref = pdf.length;
    pdf += "xref\n0 " + (pdfObjects.length + 1) + "\n";
    pdf += "0000000000 65535 f \n";

    for (let i = 1; i <= pdfObjects.length; i++) {
      pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }

    pdf += "trailer\n<< /Size " + (pdfObjects.length + 1) + " /Root 1 0 R >>\n";
    pdf += "startxref\n" + xref + "\n%%EOF";

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "text-to-pdf.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

    status.textContent = "PDF created successfully.";
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  });
})();

/* ===== ORIGINAL INLINE TOOLBOX SCRIPT 2 ===== */
const $ = id => document.getElementById(id);
const input = $("largeVideoFileInput"), info = $("largeVideoInfo"), quality = $("largeVideoQuality");
const start = $("largeVideoStart"), clear = $("largeVideoClear"), progress = $("largeVideoProgress");
const label = $("largeVideoProgressLabel"), pct = $("largeVideoPercent"), fill = $("largeVideoFill"), status = $("largeVideoStatus");
const download = $("largeVideoDownload"), downloadLink = $("largeVideoDownloadLink");

const MAX = 50 * 1024 * 1024 * 1024;
const FFMPEG_VERSION = "0.12.15";
const CORE_VERSION = "0.12.10";
let file = null, outputUrl = null, ffmpeg = null, ffmpegLoading = null, busy = false;

function fmt(b){
  if(b<1024)return b+" B";
  let n=b/1024,u=["KB","MB","GB"],i=0;
  while(n>=1024&&i<u.length-1){n/=1024;i++}
  return n.toFixed(n>=10?1:2)+" "+u[i];
}
function setP(p,msg){
  p=Math.max(0,Math.min(100,p));
  fill.style.width=p+"%"; pct.textContent=Math.round(p)+"%";
  if(msg)status.textContent=msg;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

input.addEventListener("change",()=>{
  if(outputUrl){URL.revokeObjectURL(outputUrl);outputUrl=null}
  download.style.display="none"; progress.style.display="none";
  const f=input.files?.[0]; file=null; start.disabled=true;
  if(!f)return;
  if(f.size>MAX){info.style.display="block";info.textContent="❌ File is larger than 50 GB.";return}
  file=f;info.style.display="block";
  info.innerHTML="<strong>"+esc(f.name)+"</strong><br>Size: "+fmt(f.size)+"<br>Type: "+esc(f.type||"Unknown");
  start.disabled=false;
});

async function fetchWorkerBlobURL(){
  const url = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@" + FFMPEG_VERSION + "/dist/esm/worker.js";
  const r = await fetch(url, {cache:"force-cache"});
  if(!r.ok) throw new Error("Unable to load FFmpeg worker: HTTP "+r.status);
  let source = await r.text();

  const inlineConst = `
const MIME_TYPE_JAVASCRIPT = "text/javascript";
const MIME_TYPE_WASM = "application/wasm";
const CORE_VERSION = "0.12.10";
const CORE_URL = \`https://unpkg.com/@ffmpeg/core@\${CORE_VERSION}/dist/umd/ffmpeg-core.js\`;
const FFMessageType = {
  LOAD:"LOAD", EXEC:"EXEC", FFPROBE:"FFPROBE", WRITE_FILE:"WRITE_FILE",
  READ_FILE:"READ_FILE", DELETE_FILE:"DELETE_FILE", RENAME:"RENAME",
  CREATE_DIR:"CREATE_DIR", LIST_DIR:"LIST_DIR", DELETE_DIR:"DELETE_DIR",
  ERROR:"ERROR", DOWNLOAD:"DOWNLOAD", PROGRESS:"PROGRESS", LOG:"LOG",
  MOUNT:"MOUNT", UNMOUNT:"UNMOUNT"
};`;
  const inlineErrors = `
const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
const ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call \`await ffmpeg.load()\` first");
const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
const ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");`;

  source = source
    .replace(/import\s*\{\s*CORE_URL\s*,\s*FFMessageType\s*\}\s*from\s*["']\.\/const\.js["']\s*;?/g, inlineConst)
    .replace(/import\s*\{\s*ERROR_UNKNOWN_MESSAGE_TYPE\s*,\s*ERROR_NOT_LOADED\s*,\s*ERROR_IMPORT_FAILURE\s*,?\s*\}\s*from\s*["']\.\/errors\.js["']\s*;?/g, inlineErrors);

  if (/from ["']\.\/const\.js["']|from ["']\.\/errors\.js["']/.test(source)) {
    throw new Error("FFmpeg worker dependencies could not be embedded.");
  }
  return URL.createObjectURL(new Blob([source], {type:"text/javascript"}));
}

function makeBridge(worker, coreURL, wasmURL){
  let nextId=1, pending=new Map(), logs=[];
  worker.onmessage = e => {
    const msg=e.data||{}, id=msg.id;
    if(msg.type==="LOG"){
      const line=msg.data?.message;
      if(line){ logs.push(String(line)); if(logs.length>40)logs.shift(); }
      return;
    }
    if(msg.type==="PROGRESS"){
      const p=Number(msg.data?.progress);
      if(Number.isFinite(p)) setP(8+p*90,"FFmpeg is converting the audio…");
      return;
    }
    if(!pending.has(id))return;
    const item=pending.get(id); pending.delete(id);
    if(msg.type==="ERROR") item.reject(new Error(String(msg.data||"FFmpeg worker error.")));
    else item.resolve(msg.data);
  };
  worker.onerror = e => {
    const m=e?.message||"FFmpeg worker failed to start.";
    pending.forEach(x=>x.reject(new Error(m))); pending.clear();
  };
  const send=(type,data,transfer)=>{
    const id=nextId++;
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      try{worker.postMessage({id,type,data},transfer||[])}
      catch(err){pending.delete(id);reject(err)}
    });
  };
  return {
    load:()=>send("LOAD",{coreURL,wasmURL}),
    createDir:path=>send("CREATE_DIR",{path}),
    mount:(fsType,options,mountPoint)=>send("MOUNT",{fsType,options,mountPoint}),
    unmount:mountPoint=>send("UNMOUNT",{mountPoint}),
    exec:args=>send("EXEC",{args,timeout:-1}),
    readFile:path=>send("READ_FILE",{path,encoding:"binary"}),
    deleteFile:path=>send("DELETE_FILE",{path}),
    listDir:path=>send("LIST_DIR",{path}),
    logs:()=>logs.slice()
  };
}

async function ensureFFmpeg(){
  if(ffmpeg)return ffmpeg;
  if(ffmpegLoading)return ffmpegLoading;
  ffmpegLoading=(async()=>{
    setP(1,"Loading PC conversion engine…");
    const workerURL=await fetchWorkerBlobURL();
    const base="https://cdn.jsdelivr.net/npm/@ffmpeg/core@"+CORE_VERSION+"/dist/umd";
    const worker=new Worker(workerURL);
    const bridge=makeBridge(worker,base+"/ffmpeg-core.js",base+"/ffmpeg-core.wasm");
    setP(4,"Starting FFmpeg engine…");
    await Promise.race([
      bridge.load(),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error("FFmpeg engine did not start within 90 seconds.")),90000))
    ]);
    ffmpeg=bridge;
    setP(7,"PC conversion engine ready.");
    return bridge;
  })().catch(e=>{ffmpegLoading=null;throw e});
  return ffmpegLoading;
}

async function convertLarge(file){
  const engine=await ensureFFmpeg();
  const outputPath="/output.mp3";
  await engine.createDir("/input").catch(()=>{});
  await engine.mount("WORKERFS",{files:[file]},"/input");
  const nodes=await engine.listDir("/input");
  const node=nodes.find(x=>x && x.name && x.name!=="." && x.name!==".." && !x.isDir);
  if(!node)throw new Error("FFmpeg could not see the selected video inside WORKERFS.");
  const inputPath="/input/"+node.name;
  setP(8,"Converting MP3… 0%");
  const exit=await engine.exec([
    "-nostdin","-y","-i",inputPath,
    "-map","0:a:0","-vn","-sn","-dn","-map_metadata","-1",
    "-c:a","libmp3lame","-b:a",quality.value+"k",
    "-id3v2_version","3",outputPath
  ]);
  if(exit!==0){
    const tail=engine.logs().slice(-8).join(" | ");
    throw new Error("FFmpeg conversion failed."+(tail?" Details: "+tail:""));
  }
  const data=await engine.readFile(outputPath);
  if(!data || !data.length)throw new Error("FFmpeg created an empty MP3.");
  const blob=new Blob([data],{type:"audio/mpeg"});
  if(blob.size<1024)throw new Error("The MP3 output is unexpectedly small.");
  const baseName=file.name.replace(/\.[^/.]+$/,"")||"audio";
  outputUrl=URL.createObjectURL(blob);
  downloadLink.href=outputUrl;
  downloadLink.download=baseName+".mp3";
  download.style.display="block";
  label.textContent="Conversion complete";
  setP(100,"MP3 ready — download it now.");
}

start.addEventListener("click",async()=>{
  if(!file||busy)return;
  busy=true;start.disabled=true;download.style.display="none";progress.style.display="block";
  try{await convertLarge(file)}
  catch(e){label.textContent="Conversion stopped";setP(0,"❌ "+(e?.message||"Large Video conversion failed."))}
  finally{busy=false;start.disabled=!file}
});

clear.addEventListener("click",()=>{
  if(busy)return;
  if(outputUrl){URL.revokeObjectURL(outputUrl);outputUrl=null}
  file=null;input.value="";info.style.display="none";info.textContent="";
  progress.style.display="none";download.style.display="none";start.disabled=true;
  setP(0,"Ready.");
});

