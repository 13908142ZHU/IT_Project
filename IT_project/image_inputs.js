Math.seedrandom(0); //same seed for replication

const canvas = document.getElementById('imageOperation');
const board = canvas.getContext('2d', { willReadFrequently: true });
const stdlength = 224;

async function transformation() {
    const oriImageList = await getOriImage(); 
    const imageSet = new Array();

    for (let i = 0; i < oriImageList.length; i++) {
        imageSet[i] = new Array();
        const oriImage = new Image();
        oriImage.crossOrigin = 'Anonymous';
        oriImage.src = oriImageList[i];
        await oriImage.decode();

        for (let j = 0; j < 16; j++) { //generate augmented version
            board.clearRect(0, 0, stdlength, stdlength);
            board.save();
            rescale(oriImage);
            changeBrightnessSaturation();
            board.restore(); //reset setting after each painting
            imageSet[i].push(toTensor());
        }
    }

    return matchPair(imageSet);
}
async function getOriImage() { //get 20 item image
    const response = await fetch('https://raw.githubusercontent.com/JasonChen523/IT1030-Project/main/ItemLinkList');
    const imageSource = await response.text();
    const imageList = imageSource.split('\n');
    imageList.length = 20
    return imageList
}
function toTensor() {
    return tf.browser.fromPixels(canvas).toFloat();
}
function rotate() {
    const angle = (1 / 3 * Math.random() - 1 / 6) * Math.PI; //rotate with random angle
    board.translate(stdlength / 2, stdlength / 2);
    board.rotate(angle);
    board.translate(-stdlength / 2, -stdlength / 2);

}
function changeBrightnessSaturation() {
    const imageData = board.getImageData(0, 0, stdlength, stdlength);
    const pixelSet = imageData.data;

    const shift = Math.random() * 100 - 50;
    const satFac = Math.random() * 1.5 + 0.5;
    const transparency = Math.random() * 100 - 50;

    for (let i = 0; i < pixelSet.length; i += 4) {
        const red = pixelSet[i];
        const green = pixelSet[i + 1];
        const blue = pixelSet[i + 2];
        const gray = red * 0.299 + green * 0.587 + blue * 0.114; //used for saturation

        pixelSet[i] = Math.min(Math.max((gray + (red - gray) * satFac + shift), 0), 255);
        pixelSet[i + 1] = Math.min(Math.max((gray + (green - gray) * satFac + shift), 0), 255);
        pixelSet[i + 2] = Math.min(Math.max((gray + (blue - gray) * satFac + shift), 0), 255);
        pixelSet[i + 3] = Math.min(Math.max(pixelSet[i + 3] + transparency, 0), 255);
    }

    board.putImageData(imageData, 0, 0);
}
function rescale(image) {
    const newScale1 = (0.2 * Math.random() + 0.9) * stdlength; //random scaling
    const newScale2 = (0.2 * Math.random() + 0.9) * stdlength;
    board.drawImage(image, 0, 0, newScale1, newScale2);
}
async function matchPair(imgArray) {
    const sampleArray = new Array(); //an array with num 1-20, for random following pairing use
    for (let i = 0; i < imgArray.length; i++) {
        sampleArray.push(i);
    }

    reorder = new Array();

    const colNum = imgArray[0].length;
    for (let i = 0; i < colNum / 2; i++) { //negative pairs for different items
        indexArray = [...sampleArray];
        for (let j = 0; j < sampleArray.length; j++) {
            index = Math.floor(Math.random() * (indexArray.length - 1)) //randomly select from different rows
            row = indexArray.splice(index, 1)[0];//draw without putting back
            col = Math.floor(Math.random() * (colNum - i));
            reorder.push(imgArray[row].splice(col, 1)[0]);
        }
    }

    for (let i = 0; i < imgArray.length; i++) { //positive pairs for transformations of the same item
        for (let j = 0; j < colNum / 2; j++) {
            col = Math.floor(Math.random() * (imgArray[i].length));
            reorder.push(imgArray[i].splice(col, 1)[0]);
        }
    }

    const trainSetA = new Array(); // train-test seperation
    const trainSetB = new Array()
    const trainLabelSet = new Array();
    const testSetA = new Array();
    const testSetB = new Array();
    const testLabelSet = new Array();


    for (i = 0; i < reorder.length; i += 2) {
        if (i % 10 == 0) { //every 5 items allocate 1 to test set
            testSetA.push(reorder[i]);
            testSetB.push(reorder[i + 1]);
            if (i < reorder.length / 2)
                testLabelSet.push(0);
            else
                testLabelSet.push(1);
        }
        else {
            trainSetA.push(reorder[i]);
            trainSetB.push(reorder[i + 1]);
            if (i < reorder.length / 2) //first half negative and last half posiitve
                trainLabelSet.push(0);
            else
                trainLabelSet.push(1);
        }
    }

    const trainInputA = tf.stack(trainSetA); //stack as 4d-tensor for training
    const trainInputB = tf.stack(trainSetB);
    const trainLabel = tf.tensor(trainLabelSet);
    const testInputA = tf.stack(testSetA);
    const testInputB = tf.stack(testSetB);
    const testLabel = tf.tensor(testLabelSet);

    return [[trainInputA, trainInputB], trainLabel, [testInputA, testInputB], testLabel];
}