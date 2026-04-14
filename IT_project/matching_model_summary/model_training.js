async function getFeaturePairs() {
    const webModel = await mobilenet.load(); //load base model MobileNetV2
    const [inputPairs, labels, testPairs, testLabels] = await transformation();

    const trainFeatureA = webModel.infer(inputPairs[0], true); //extract image features
    const trainFeatureB = webModel.infer(inputPairs[1], true);
    const testFeatureA = webModel.infer(testPairs[0], true);
    const testFeatureB = webModel.infer(testPairs[1], true);

    return [[trainFeatureA, trainFeatureB], labels, [testFeatureA, testFeatureB], testLabels];
}
async function defineSiameseModel() { //build model structure
    const inputA = tf.input({ shape: [1024] });
    const inputB = tf.input({ shape: [1024] }); //get two inputs

    const absDifference = tf.layers.concatenate().apply([inputA, inputB]); //merge two features
    const layer1 = tf.layers.dense({ units: 32, activation: 'relu' }).apply(absDifference); //build two hidden layers and one output layer
    const layer2 = tf.layers.dense({ units: 16, activation: 'relu' }).apply(layer1);
    const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(layer2); //sigmoid function to give a 0-1 similarity score

    const model = tf.model({ inputs: [inputA, inputB], outputs: output });
    return model;
}
async function trainModel(featurePairs, labels, testFeaturePairs, testLabels) {
    const model = await defineSiameseModel();
    model.compile({ //assign hyperparameter
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    const batchSize = 32; 
    const epochs = 80; //total training loops
    const testArray = await testLabels.data();
    const testAcc = new Array();
    const testMSE = new Array();

    const history = await model.fit(featurePairs, labels, {
        epochs: epochs,
        batchSize: batchSize,
        shuffle: true,
        callbacks: {
            onEpochEnd: async (epoch, logs) => { //record training and test statistics for each epoch
                const similarity = await model.predict(testFeaturePairs).data();

                const epochAcc = accuracy(similarity, testArray);
                testAcc.push(epochAcc);
                const epochMSE = meanSquaredError(similarity, testArray);
                testMSE.push(epochMSE);
            }
        }
    })

    await model.save('downloads://siamese-model'); //export model
    console.log(history.history); //display training metrics
    return [model, testAcc, testMSE];
}
function accuracy(testSet, label) {
    const prediction = testSet.map(x => Math.round(x)); //0-0.5 → different; 0.5-1 → same
    let rightcases = 0;
    for (let i = 0; i < testSet.length; i++) {
        if (prediction[i] == label[i])
            rightcases++;
    }

    return rightcases / testSet.length;
}
function meanSquaredError(testSet, label) {
    let error = 0;
    for (let i = 0; i < testSet.length; i++) {
        error += (testSet[i] - label[i]) ** 2;
    }

    return error / testSet.length;
}
function confusionMatrix(testSet, label) {
    const prediction = testSet.map(x => Math.round(x));

    let tp, fp, fn, tn;
    tp = 0;
    fp = 0;
    fn = 0;
    tn = 0;

    for (let i = 0; i < testSet.length; i++) {
        if (prediction[i] == 1 && label[i] == 1)
            tp += 1;
        else if (prediction[i] == 1 && label[i] == 0)
            fp += 1;
        else if (label[i] == 1)
            fn += 1;
        else
            tn += 1;
    }

    return [[tp, fp], [fn, tn]];
}
async function cosineSimilarity(featureA, featureB) { //used to measure the difference of untrained features

    const dot = tf.sum(tf.mul(featureA, featureB), 1);
    const normA = tf.norm(featureA, 2, 1);
    const normB = tf.norm(featureB, 2, 1);
    const cosSim = dot.div(normA.mul(normB)); //dot product ÷ norm product
    const simArray = await cosSim.data()

    return simArray;
}
async function evaluation() {
    const [featurePairs, labels, testFeaturePairs, testLabels] = await getFeaturePairs()
    const [model, testAcc, testMSE] = await trainModel(featurePairs, labels, testFeaturePairs, testLabels); //get results after training complete
    const label = await testLabels.data();

    const testSim = await model.predict(testFeaturePairs).data();
    const cosSim = await cosineSimilarity(testFeaturePairs[0], testFeaturePairs[1]);

    const siameseModel = { //our model metrics
        accuracy: testAcc,
        MSE: testMSE,
        CofMtx: confusionMatrix(testSim, label)
    };

    const mobileNet = { //MobileNetV2 metrics
        accuracy: accuracy(cosSim, label),
        MSE: meanSquaredError(cosSim, label),
        CofMtx: confusionMatrix(cosSim, label)
    }
    console.log(siameseModel, mobileNet);
    return [siameseModel, mobileNet];
}

async function visualization() { //metrics visualization using tfvis
    const [siameseModel, mobileNet] = await evaluation();

    const SNNAccArray = siameseModel.accuracy.map((y, x) => ({ x, y: 100 * y })); //visualize accuracy comparison
    const cosAccArray = Array(80).fill(mobileNet.accuracy).map((y, x) => ({ x, y: 100 * y }));

    const SNNMSEArray = siameseModel.MSE.map((y, x) => ({ x, y })); // visualize MSE comparison
    const cosMSEArray = Array(80).fill(mobileNet.MSE).map((y, x) => ({ x, y }));


    const label1 = ['SNN', 'MobileNet'];
    const data1 = { values: [SNNAccArray, cosAccArray], series: label1 }
    const opts1 = {
        zoomToFit: true, 
        xLabel: 'epoch',      
        yLabel: 'accuracy',      
        width: 500,           
        height: 300           
    };

    const surface1 = { name: 'Prediction Accuracy', tab: 'Charts' };
    tfvis.render.linechart(surface1, data1, opts1); //chart1 for accuracy curve

    const label2 = ['SNN', 'MobileNet'];
    const data2 = { values: [SNNMSEArray, cosMSEArray], series: label2 }
    const opts2 = {
        zoomToFit: true,    
        xLabel: 'epoch',    
        yLabel: 'MSE',   
        width: 500,       
        height: 300     
    };

    const surface2 = { name: 'Loss', tab: 'Charts' };
    tfvis.render.linechart(surface2, data2, opts2); //chart2 for MSE curve


    const siameseMatrix = siameseModel.CofMtx;      
    const siameseClasses = siameseMatrix.length;  
    tfvis.render.confusionMatrix( 
        document.getElementById('CofMtx2'), //display Siamese Model confusion matrix
        { values: siameseMatrix },
        {
            xLabel: 'Predicted Match',
            yLabel: 'Actual Match',
            xTickLabels: Array.from({ length: siameseClasses }, (_, i) => i.toString()),
            yTickLabels: Array.from({ length: siameseClasses }, (_, i) => i.toString()),
            height: 400
        }
    );

    const mobileNetMatrix = mobileNet.CofMtx;      
    const mobileNetClasses = mobileNetMatrix.length; 
    tfvis.render.confusionMatrix(
        document.getElementById('CofMtx1'), //display MobileNetV2 confusion matrix
        { values: mobileNetMatrix },
        {
            xLabel: 'Predicted Match',
            yLabel: 'Actual Match',
            xTickLabels: Array.from({ length: mobileNetClasses }, (_, i) => i.toString()),
            yTickLabels: Array.from({ length: mobileNetClasses }, (_, i) => i.toString()),
            height: 400
        }
    )

    const title1 = document.getElementById('title1');
    const title2 = document.getElementById('title2');
    const loadingMsg = document.getElementById('loadingMsg');
    if (title1) title1.style.display = 'block';
    if (title2) title2.style.display = 'block';
    if (loadingMsg) loadingMsg.style.display = 'none'; //display title and hide loading message
}
visualization();
