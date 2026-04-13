const IMAGE_ONLY_THRESHOLD = 0.5;
const IMAGE_TEXT_THRESHOLD = 0.35;

async function loadModel() {
    const webModel = await mobilenet.load();
    const siameseModel = await tf.loadLayersModel("/static/SiameseModel.json");
    return [webModel, siameseModel];
}

async function prediction(webModel, siameseModel, imgA, imgB) {
    const featureA = webModel.infer(imgA, true);
    const featureB = webModel.infer(imgB, true);
    const simTensor = siameseModel.predict([featureA, featureB]);
    const simArray = await simTensor.data();

    const similarity = simArray[0];

    if (!isFinite(similarity)) {
        return 0;
    }

    return Math.max(0, Math.min(1, similarity));
}

function updateNoResultsState(visibleCount) {
    const noResults = document.getElementById("dynamic-no-results");
    const resultsContainer = document.getElementById("results-container");

    if (!noResults || !resultsContainer) return;

    if (visibleCount === 0) {
        resultsContainer.style.display = "none";
        noResults.style.display = "block";
    } else {
        resultsContainer.style.display = "";
        noResults.style.display = "none";
    }
}

async function waitForImage(img) {
    if (img.complete && img.naturalWidth > 0) return;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });
}

async function rerankResultsByImage() {
    const queryImage = document.getElementById("query-image");
    const resultCards = Array.from(document.querySelectorAll(".result-card"));
    const container = document.getElementById("results-container");

    if (!queryImage || resultCards.length === 0 || !container) return;

    const hasTextQuery = container.dataset.hasTextQuery === "true";

    await waitForImage(queryImage);

    const [webModel, siameseModel] = await loadModel();
    const rescored = [];

    for (const card of resultCards) {
        const resultImage = card.querySelector(".result-image");
        if (!resultImage) continue;

        await waitForImage(resultImage);

        const imageScore = await prediction(webModel, siameseModel, queryImage, resultImage);
        const textScore = parseFloat(card.dataset.textScore || "0");

        let finalScore;
        let threshold;

        if (hasTextQuery) {
            finalScore = 0.8 * imageScore + 0.2 * textScore;
            threshold = IMAGE_TEXT_THRESHOLD;
        } else {
            finalScore = imageScore;
            threshold = IMAGE_ONLY_THRESHOLD;
        }

        const isVisible = finalScore >= threshold;

        card.dataset.score = finalScore.toFixed(4);
        card.dataset.visible = isVisible ? "true" : "false";

        const badge = card.querySelector(".score-badge");
        if (badge) {
            badge.textContent = `Match Score: ${(finalScore * 100).toFixed(1)}%`;
        }

        rescored.push({
            card,
            score: finalScore,
            visible: isVisible
        });
    }

    rescored.sort((a, b) => b.score - a.score);

    let visibleCount = 0;

    rescored.forEach(item => {
        container.appendChild(item.card);

        if (item.visible) {
            item.card.style.display = "";
            visibleCount += 1;
        } else {
            item.card.style.display = "none";
        }
    });

    updateNoResultsState(visibleCount);
}

document.addEventListener("DOMContentLoaded", rerankResultsByImage);