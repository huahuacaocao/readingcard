// 主程序
const FRAMERATE = 30;
let texts = [];
let currentIndex = -1;
let canvasWidth, canvasHeight;
let backgroundImgBlur, backgroundImgClear;
let downImgHeight, downImgY, blurY;
let topicAudio;
let enFont;
const contentDataArray = [];
let textLayer, bgLayer;
let backgroundMusic;
let multiple = 2

// 常量定义
const MIN_FONT_SIZE = 8 * multiple;
const MAX_FONT_SIZE = 28 * multiple;
const BASE_FONT_SCALE = 0.04;
const LINE_SPACING_SCALE = 0.04;
const BLUR_Y_RATIO = 0.65;
const DOWN_IMG_HEIGHT_RATIO = 0.35;
const TITLE_Y_RATIO = 0.05;
const CONTENT_HEIGHT_RATIO = 0.16;

// 绘制背景图
function drawBackgroundImage() {
    downImgHeight = canvasHeight * DOWN_IMG_HEIGHT_RATIO;
    downImgY = canvasHeight * BLUR_Y_RATIO;
    blurY = BLUR_Y_RATIO;

    const blurImgW = backgroundImgBlur.width;
    const blurImgH = backgroundImgBlur.height;
    const clearImgW = backgroundImgClear.width;
    const clearImgH = backgroundImgClear.height;

    const scaleBlur = Math.max(canvasWidth / blurImgW, canvasHeight / blurImgH);
    const scaleClear = Math.max(canvasWidth / clearImgW, downImgHeight / clearImgH);

    const displayBlurW = blurImgW * scaleBlur;
    const displayBlurH = blurImgH * scaleBlur;
    const displayClearW = clearImgW * scaleClear;
    const displayClearH = clearImgH * scaleClear;

    const blurX = (canvasWidth - displayBlurW) / 2;
    const blurYPos = (canvasHeight - displayBlurH) / 2;
    bgLayer.image(backgroundImgBlur, blurX, blurYPos, displayBlurW, displayBlurH);

    const clearX = (canvasWidth - displayClearW) / 2;
    const fadeHeight = displayClearH / 2;
    for (let y = 0; y < displayClearH; y++) {
        const alpha = y < fadeHeight ? map(y, 0, fadeHeight, 0, 255) : 255;
        bgLayer.tint(255, 255, 255, alpha);
        const srcY = map(y, 0, displayClearH, 0, clearImgH);
        const srcHeight = map(1, 0, displayClearH, 0, clearImgH);
        bgLayer.image(
            backgroundImgClear,
            clearX, downImgY + y, displayClearW, 1,
            0, srcY, clearImgW, srcHeight
        );
    }
}

// 预加载资源
function preload() {
    backgroundImgBlur = loadImage("resource/img/bgi8.jpg");
    backgroundImgClear = loadImage(imageData[0]);
    for (let i = 0; i < contentData.length; i++) {
        contentDataArray[i] = {
            en: contentData[i].en,
            zh: contentData[i].zh,
            audio: loadSound(contentAudioData[i])
        };
    }
    topicAudio = loadSound(topicAudioData);
    enFont = loadFont('resource/font/MS Song Regular.ttf');
    backgroundMusic = loadSound('resource/audio/bgm.mp3');
}

// 计算画布大小
function calculateCanvasSize() {
    canvasHeight = windowHeight * 0.9;
    canvasWidth = (canvasHeight * 9) / 16;
    if (canvasWidth > windowWidth * 0.9) {
        canvasWidth = windowWidth * 0.9;
        canvasHeight = (canvasWidth * 16) / 9;
    }
    canvasWidth = canvasWidth * multiple
    canvasHeight = canvasHeight * multiple
}

// 计算文本位置和大小
function calculatePositions() {
    const baseFontSize = constrainValue(canvasHeight * BASE_FONT_SCALE, MIN_FONT_SIZE, MAX_FONT_SIZE);
    sTitle = int(constrainValue(baseFontSize * 1.4, MIN_FONT_SIZE, MAX_FONT_SIZE));
    sTopic = int(constrainValue(baseFontSize * 1, MIN_FONT_SIZE, MAX_FONT_SIZE * 0.9));
    sContent = int(constrainValue(baseFontSize * 1, MIN_FONT_SIZE, MAX_FONT_SIZE * 0.7));

    const lineSpacing = canvasHeight * LINE_SPACING_SCALE;
    yTitle = canvasHeight * BLUR_Y_RATIO * TITLE_Y_RATIO;
    yTopic = yTitle + sTitle + lineSpacing;
    yContent = yTopic + sTopic + lineSpacing * 2;
    hContent = canvasHeight * BLUR_Y_RATIO * CONTENT_HEIGHT_RATIO;
}

// 辅助函数：限制数值范围
function constrainValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 设置录制功能
let mediaRecorder;
let recordedChunks = [];
let audioContext, destination;

function setupRecording() {
    audioContext = getAudioContext();
    destination = audioContext.createMediaStreamDestination();
    const videoStream = canvas.captureStream(60);
    const audioStream = destination.stream;
    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);
    const options = {
        mimeType: "video/mp4; codecs=avc1.42E01E,mp4a.40.2",
        videoBitsPerSecond: 10000000,
        audioBitsPerSecond: 128000
    };
    mediaRecorder = new MediaRecorder(combinedStream, options);

    mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, {type: "video/mp4"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video_with_background_music.mp4";
        a.click();
        recordedChunks = [];
    };
    backgroundMusic.connect(destination);
}

// 初始化设置
let yTitle, sTitle;
let yTopic, sTopic;
let yContent, sContent, hContent;

function setup() {
    frameRate(FRAMERATE);
    calculateCanvasSize();
    createCanvas(canvasWidth, canvasHeight);
    textLayer = createGraphics(canvasWidth, canvasHeight);
    bgLayer = createGraphics(canvasWidth, canvasHeight);
    textLayer.textFont(enFont);
    pixelDensity(2);
    drawBackgroundImage();

    const canvasX = (windowWidth - canvasWidth) / 2;
    const canvasY = (windowHeight - canvasHeight) / 2;
    const canvasElement = document.getElementById('defaultCanvas0');
    canvasElement.style.position = 'absolute';
    canvasElement.style.left = `${canvasX}px`;
    canvasElement.style.top = `${canvasY}px`;

    calculatePositions();
    texts = [];
    texts.push(new HighlightText(topicData.en, topicData.zh, canvasWidth / 2, yTopic, topicAudio, sTopic, CENTER));
    for (let i = 0; i < contentDataArray.length; i++) {
        const y = yContent + hContent * i;
        texts.push(new HighlightText(contentDataArray[i].en, contentDataArray[i].zh, canvasWidth * 0.1, y, contentDataArray[i].audio, sContent, LEFT));
    }
    setupRecording();
    backgroundMusic.loop();
}

// 按键事件
function keyPressed() {
    if (key === 'r' || key === 'R') {
        mediaRecorder.start();
        console.log("Recording started");
    }
    if (key === 's' || key === 'S') {
        mediaRecorder.stop();
        console.log("Recording stopped");
    }
}

// 绘制标题
function drawTitle() {
    textLayer.fill(0, 0, 0);
    textLayer.textSize(30 * multiple);
    textLayer.textAlign(CENTER, TOP);
    textLayer.text("每日英语晨读", canvasWidth / 2, yTitle);
}

// 绘制循环
let petals = [];

function draw() {
    image(bgLayer, 0, 0);
    textLayer.clear();
    drawTitle();

    for (let i = 0; i < texts.length; i++) {
        texts[i].displayOnLayer(textLayer);
        if (i === currentIndex) texts[i].update();
    }

    for (let i = petals.length - 1; i >= 0; i--) {
        petals[i].update(windAngle);
        petals[i].displayOnLayer(textLayer);
        if (petals[i].posY > height + 20) petals.splice(i, 1);
    }

    image(textLayer, 0, 0);
}

// 处理交互
function handleInteraction() {
    currentIndex = currentIndex < 0 ? 0 : currentIndex;
    if (texts[currentIndex].isFinished) {
        currentIndex = (currentIndex + 1) % texts.length;
        texts[currentIndex].reset();
    }
}

function mousePressed() {
    handleInteraction();
}

function touchStarted() {
    handleInteraction();
    return false;
}

function windowResized() {
    setup();
}

// HighlightText 类：实现逐字高亮和音频同步
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
        this.tSize = tSize;
        this.pos = pos;
        this.setHighlightDuration();
    }

    setHighlightDuration() {
        const totalChars = this.enText.length;
        const totalFrames = this.totalTime * FRAMERATE;
        this.highlightDuration = totalFrames / totalChars;
    }

    displayOnLayer(layer) {
        layer.textAlign(LEFT, CENTER);
        layer.textSize(this.tSize);
        let x = this.x;
        let xStart, xEnd;
        if (this.pos === CENTER) {
            x -= this.enText.length * layer.textWidth(this.enText[0]) / 2;
            xStart = x;
        }
        for (let j = 0; j < this.enText.length; j++) {
            if (j < this.currentCharIndex) {
                layer.fill(255, 0, 0);
            } else if (j === this.currentCharIndex) {
                const col = lerpColor(color(0, 0, 0), color(255, 0, 0), this.highlightProgress);
                layer.fill(col);
            } else {
                layer.fill(0, 0, 0);
            }
            layer.text(this.enText[j], x, this.y);
            x += layer.textWidth(this.enText[j]);
        }
        xEnd = x;
        const yOffset = this.tSize * 1.5;
        x = this.x;
        if (this.pos === CENTER) {
            x = (xEnd + xStart) / 2;
            x -= this.zhText.length * layer.textWidth(this.zhText[0]) / 2;
        }
        layer.fill(0, 0, 0);
        for (let j = 0; j < this.zhText.length; j++) {
            layer.text(this.zhText[j], x, this.y + yOffset);
            x += layer.textWidth(this.zhText[j]);
        }
    }

    update() {
        if (this.currentCharIndex === 0 && this.timer === 0 && !this.hasPlayed) {
            this.audio.play();
            this.audio.connect(destination);
            this.hasPlayed = true;
        }
        if (this.isFinished) return;
        this.timer += multiple;
        if (this.timer >= Math.floor(this.highlightDuration)) {
            this.timer = 0;
            this.currentCharIndex++;
            this.highlightProgress = 0;
            const totalChars = this.enText.length;
            if (this.currentCharIndex >= totalChars) {
                this.currentCharIndex = totalChars - 1;
                this.isFinished = true;
                this.highlightProgress = 1;
            }
        } else {
            this.highlightProgress = this.timer / this.highlightDuration;
        }
    }

    reset() {
        this.currentCharIndex = 0;
        this.timer = 0;
        this.highlightProgress = 0;
        this.isFinished = false;
        this.hasPlayed = false;
        this.audio.stop();
        this.setHighlightDuration();
    }
}