const IMAGE_ONLY_THRESHOLD = 0.5; //set display threshold for image and text similarity
const IMAGE_TEXT_THRESHOLD = 0.35;

async function loadModel() {
    const webModel = await mobilenet.load(); //load base model
    const siameseModel = await tf.loadLayersModel("/static/SiameseModel.json"); //load trained model
    return [webModel, siameseModel];
}

async function prediction(webModel, siameseModel, imgA, imgB) {
    const featureA = webModel.infer(imgA, true); //extract feature pair
    const featureB = webModel.infer(imgB, true);
    const simTensor = siameseModel.predict([featureA, featureB]); //predict similarity with feature pair
    const simArray = await simTensor.data();

    const similarity = simArray[0];

    if (!isFinite(similarity)) {
        return 0;
    }

    return Math.max(0, Math.min(1, similarity)); //regulate output to 0-1
} a

function updateNoResultsState(visibleCount) { //default page if no results matched
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

async function waitForImage(img) { //wait for image to load completely
    if (img.complete && img.naturalWidth > 0) return;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });
}

async function rerankResultsByImage() {
    // Get DOM elements
    const queryImage = document.getElementById("query-image");
    const resultCards = Array.from(document.querySelectorAll(".result-card"));
    const container = document.getElementById("results-container");

    // Early exit if required elements are missing
    if (!queryImage || resultCards.length === 0 || !container) return;

    // Check whether a text query was provided (affects scoring)
    const hasTextQuery = container.dataset.hasTextQuery === "true";

    // Wait for the query image to load before processing
    await waitForImage(queryImage);

    // Load both models (MobileNet for feature extraction, Siamese for similarity)
    const [webModel, siameseModel] = await loadModel();

    // Array to store temporary scoring data for each result card
    const rescored = [];

    // Process each result card individually
    for (const card of resultCards) {
        const resultImage = card.querySelector(".result-image");
        if (!resultImage) continue; // skip cards without an image

        // Ensure the result image is fully loaded before extracting features
        await waitForImage(resultImage);

        // Compute image similarity score (0-1)
        const imageScore = await prediction(webModel, siameseModel, queryImage, resultImage);

        // Retrieve the text similarity score (if any) from the card's dataset
        const textScore = parseFloat(card.dataset.textScore || "0");

        let finalScore;
        let threshold;

        // Combine scores: 80% image + 20% text if text query exists, otherwise only image
        if (hasTextQuery) {
            finalScore = 0.8 * imageScore + 0.2 * textScore;
            threshold = IMAGE_TEXT_THRESHOLD;
        } else {
            finalScore = imageScore;
            threshold = IMAGE_ONLY_THRESHOLD;
        }

        // Determine if this card should be visible based on the threshold
        const isVisible = finalScore >= threshold;

        // Store scoring and visibility metadata on the card
        card.dataset.score = finalScore.toFixed(4);
        card.dataset.visible = isVisible ? "true" : "false";

        // Update the badge that displays the match percentage
        const badge = card.querySelector(".score-badge");
        if (badge) {
            badge.textContent = `Match Score: ${(finalScore * 100).toFixed(1)}%`;
        }

        // Collect data for later sorting
        rescored.push({
            card,
            score: finalScore,
            visible: isVisible
        });
    }

    // Sort results in descending order by final score (higher similarity first)
    rescored.sort((a, b) => b.score - a.score);

    let visibleCount = 0;

    // Reorder DOM elements according to the sorted list and apply visibility
    rescored.forEach(item => {
        // Move the card to the end of the container (effectively reordering)
        container.appendChild(item.card);

        if (item.visible) {
            item.card.style.display = "";     // show the card
            visibleCount += 1;
        } else {
            item.card.style.display = "none"; // hide the card
        }
    });

    // Show/hide the "no results" message based on visible count
    updateNoResultsState(visibleCount);
}

// Run the re-ranking process when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", rerankResultsByImage);
