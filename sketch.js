// 背景图
function backgroundImage() {
    // 计算下方清晰图片的高度和 Y 坐标
    downImgHeight = canvasHeight * 0.35;
    downImgY = canvasHeight * 0.65;
    blurY = 0.65;

    // 获取图片的原始宽高
    let blurImgW = backgroundImgBlur.width;
    let blurImgH = backgroundImgBlur.height;
    let clearImgW = backgroundImgClear.width;
    let clearImgH = backgroundImgClear.height;

    // 计算缩放比例，保持宽高比
    let scaleBlur = Math.max(canvasWidth / blurImgW, canvasHeight / blurImgH);
    let scaleClear = Math.max(canvasWidth / clearImgW, downImgHeight / clearImgH);

    // 计算调整后的显示尺寸
    let displayBlurW = blurImgW * scaleBlur;
    let displayBlurH = blurImgH * scaleBlur;
    let displayClearW = clearImgW * scaleClear;
    let displayClearH = clearImgH * scaleClear;

    // 居中显示模糊背景图（覆盖整个画布）
    let blurX = (canvasWidth - displayBlurW) / 2;
    let blurYPos = (canvasHeight - displayBlurH) / 2;
    image(backgroundImgBlur, blurX, blurYPos, displayBlurW, displayBlurH);

    // 居中显示下方清晰图片
    let clearX = (canvasWidth - displayClearW) / 2;
    image(backgroundImgClear, clearX, downImgY, displayClearW, displayClearH);

    // 绘制大的渐变遮罩（覆盖整个画布）
    noStroke();
    fill(255, 255, 255, 220);
    rect(0, 0, canvasWidth, canvasHeight * blurY);

    // 上半部分渐变（从不透明到半透明）
    for (let y = 0; y < canvasHeight * blurY; y++) {
        let alpha = map(y, 0, canvasHeight * blurY, 0, 200);
        stroke(255, 255, 255, alpha);
        line(0, y, canvasWidth, y);
    }

    // 下半部分渐变（从半透明白色到透明）
    for (let y = canvasHeight * blurY; y < canvasHeight; y += 1) {
        let alpha = map(y, canvasHeight * blurY, canvasHeight * 0.8, 200, 50);
        stroke(255, 255, 255, alpha);
        fill(255, 255, 255, alpha);
        rect(0, y, canvasWidth, 1);
    }
}

// 主程序
let framerate = 30
let texts = []
let currentIndex = -1
let canvasWidth, canvasHeight
let backgroundImgBlur, backgroundImgClear
let downImgHeight, downImgY, blurY
let topicAudio
const data = []

// 预加载资源
function preload() {
    backgroundImgBlur = loadImage("./backgroundblur.jpeg")
    backgroundImgClear = loadImage(imageData[0])
    for (let i = 0; i < contentData.length; i++) {
        data[i] = {
            en: contentData[i].en,
            zh: contentData[i].zh,
            audio: loadSound(contentAudioData[i])
        }
    }
    topicAudio = loadSound(topicAudioData)
}

// 计算画布大小
function calcCanvasSize() {
    canvasHeight = windowHeight * 0.9
    canvasWidth = (canvasHeight * 9) / 16
    if (canvasWidth > windowWidth * 0.9) {
        canvasWidth = windowWidth * 0.9
        canvasHeight = (canvasWidth * 16) / 9
    }
}

let yTitle, sTitle
let yTopic, sTopic
let yContent, hContent

function calcPos() {
    let minFontSize = 8
    let maxFontSize = 28
    let baseFontSize = myConstrain(canvasHeight * 0.04, minFontSize, maxFontSize)
    // 文章字体
    sTitle = int(myConstrain(baseFontSize * 1.4, minFontSize, maxFontSize))
    sTopic = int(myConstrain(baseFontSize * 1, minFontSize, maxFontSize * 0.9))
    sContent = int(myConstrain(baseFontSize * 1, minFontSize, maxFontSize * 0.7))
    // 文章位置
    let lineSpacing = canvasHeight * 0.04
    yTitle = canvasHeight * blurY * 0.05
    yTopic = yTitle + sTitle + lineSpacing
    yContent = yTopic + sTopic + lineSpacing
    hContent = canvasHeight * blurY * 0.18
}

function myConstrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


let mediaRecorder
let recordedChunks = []

function record() {
    // 音频
    audioContext = getAudioContext()
    destination = audioContext.createMediaStreamDestination()
    let videoStream = canvas.captureStream(60)
    // 获取合并的音频流
    let audioStream = destination.stream
    let combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ])
    // 配置 MediaRecorder，设置高质量选项并使用 MP4 格式
    const options = {
        mimeType: "video/mp4; codecs=avc1.42E01E,mp4a.40.2", // H.264 和 AAC
        videoBitsPerSecond: 10000000,
        audioBitsPerSecond: 128000
    }
    mediaRecorder = new MediaRecorder(combinedStream, options);

    // 收集录制数据
    mediaRecorder.ondataavailable = (e) => {
        recordedChunks.push(e.data);
    };

    // 停止录制时生成并下载视频
    mediaRecorder.onstop = () => {
        let blob = new Blob(recordedChunks, {type: "video/mp4"});
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "video_with_user_controlled_sounds.mp4";
        a.click();
        recordedChunks = [];
    };
}


function setup() {
    textFont("Comic Sans MS")
    frameRate(framerate)
    calcCanvasSize()
    createCanvas(canvasWidth, canvasHeight)
    pixelDensity(2)
    backgroundImage()

    let canvasX = (windowWidth - canvasWidth) / 2
    let canvasY = (windowHeight - canvasHeight) / 2
    let canvas = document.getElementById('defaultCanvas0')
    canvas.style.position = 'absolute'
    canvas.style.left = canvasX + 'px'
    canvas.style.top = canvasY + 'px'
    calcPos()
    // 标题
    title()
    // 主题
    texts = []
    texts.push(new HighlightText(topicData.en, topicData.zh, canvasWidth / 2, yTopic, topicAudio, sTopic, CENTER))
    // 正文
    for (let i = 0; i < data.length; i++) {
        let y = yContent + hContent * i
        texts.push(new HighlightText(data[i].en, data[i].zh, canvasWidth * 0.1, y, data[i].audio, sContent, LEFT))
    }
    // 视频录制
    record()
}

function keyPressed() {
    if (key === 'r' || key === 'R') {
        mediaRecorder.start(); // 开始录制
        console.log("Recording started");
    }
    if (key === 's' || key === 'S') {
        mediaRecorder.stop(); // 停止录制并下载
        console.log("Recording stopped");
    }
}

function title() {
    fill(255, 165, 0);
    textSize(28);
    textAlign(CENTER, TOP);
    text("每日英语晨读", canvasWidth / 2, yTitle);
}

function draw() {
    for (let i = 0; i < texts.length; i++) {
        texts[i].display();
        if (i === currentIndex) {
            texts[i].update();
        }
    }
}

function mousePressed() {
    handleInteraction()
}

function touchStarted() {
    handleInteraction()
    return false;
}

function handleInteraction() {
    currentIndex = currentIndex < 0 ? 0 : currentIndex
    if (texts[currentIndex].isFinished) {
        currentIndex = (currentIndex + 1) % texts.length;
        texts[currentIndex].reset();
    }
}

function windowResized() {
    setup();
}


// HighlightText 类：实现逐字高亮效果（仅英文高亮，中英文双行排列，同步播放音频）
class HighlightText {
    constructor(enText, zhText, x, y, audio, tSize, pos) {
        this.enText = enText;
        this.zhText = zhText;
        this.x = x;
        this.y = y;
        this.audio = audio;
        this.totalTime = audio.duration();
        this.currentCharIndex = 0;
        this.timer = 0;
        this.highlightDuration = 0;
        this.highlightProgress = 0;
        this.isFinished = false;
        this.hasPlayed = false;
        this.setHighlightDuration();
        this.tSize = tSize
        this.pos = pos
    }

    setHighlightDuration() {
        let totalChars = this.enText.length;
        let totalFrames = this.totalTime * framerate;
        this.highlightDuration = totalFrames / totalChars;
    }

    display() {
        textAlign(LEFT, CENTER)
        textSize(this.tSize)
        let x = this.x
        if (this.pos == CENTER) {
            x -= this.enText.length * textWidth(this.enText[0]) / 2
        }
        for (let j = 0; j < this.enText.length; j++) {
            if (j < this.currentCharIndex) {
                fill(255, 140, 0)
            } else if (j === this.currentCharIndex) {
                let col = lerpColor(color(0, 102, 204), color(255, 140, 0), this.highlightProgress)
                fill(col)
            } else {
                fill(0, 102, 204)
            }
            text(this.enText[j], x, this.y)
            x += textWidth(this.enText[j])
        }
        textSize(this.tSize)
        let yOffset = textSize() * 1.5 // 增大中英文之间的间距
        x = this.x
        if (this.pos == CENTER) {
            x -= this.zhText.length * textWidth(this.zhText[0]) / 2
        }
        fill(0, 102, 204)
        for (let j = 0; j < this.zhText.length; j++) {
            text(this.zhText[j], x, this.y + yOffset);
            x += textWidth(this.zhText[j])
        }
    }

    update() {
        if (this.currentCharIndex === 0 && this.timer === 0 && !this.hasPlayed) {
            this.audio.play()
            this.audio.connect(destination)
            this.hasPlayed = true
        }
        if (this.isFinished == true) {
            return
        }
        this.timer++

        if (this.timer >= floor(this.highlightDuration)) {
            this.timer = 0
            this.currentCharIndex++
            this.highlightProgress = 0
            let totalChars = this.enText.length
            if (this.currentCharIndex >= totalChars) {
                this.currentCharIndex = totalChars - 1
                this.isFinished = true
                this.highlightProgress = 1
            }
        } else {
            this.highlightProgress = this.timer / this.highlightDuration
        }
    }

    reset() {
        this.currentCharIndex = 0
        this.timer = 0
        this.highlightProgress = 0
        this.isFinished = false
        this.hasPlayed = false
        this.audio.stop()
        this.setHighlightDuration()
    }
}