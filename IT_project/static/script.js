const preview = document.getElementById("preview");
const fileInput = document.getElementById("post-image");

if (fileInput && preview) {
    fileInput.addEventListener("change", function () {
        const file = this.files[0];

        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        } else {
            preview.style.display = "none";
            preview.src = "";
        }
    });
}

const categoryButtons = document.querySelectorAll(".tag-category-btn");
const tags = document.querySelectorAll(".tag");
const hiddenInput = document.getElementById("selected-tags");

let selected = [];

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        const tagGroup = button.nextElementSibling;
        tagGroup.classList.toggle("open");
    });
});

tags.forEach(tag => {
    tag.addEventListener("click", () => {
        tag.classList.toggle("active");

        const value = tag.innerText.trim();

        if (selected.includes(value)) {
            selected = selected.filter(t => t !== value);
        } else {
            selected.push(value);
        }

        if (hiddenInput) {
            hiddenInput.value = selected.join(",");
        }
    });
});

const resultsContainer = document.getElementById("results-container");
const largeViewBtn = document.getElementById("largeViewBtn");
const smallViewBtn = document.getElementById("smallViewBtn");

if (resultsContainer && largeViewBtn && smallViewBtn) {
    largeViewBtn.addEventListener("click", () => {
        resultsContainer.classList.remove("compact-view");
        resultsContainer.classList.add("large-view");
        largeViewBtn.classList.add("active");
        smallViewBtn.classList.remove("active");
    });

    smallViewBtn.addEventListener("click", () => {
        resultsContainer.classList.remove("large-view");
        resultsContainer.classList.add("compact-view");
        smallViewBtn.classList.add("active");
        largeViewBtn.classList.remove("active");
    });
}

const modal = document.getElementById("detailModal");
const closeModal = document.getElementById("closeModal");

const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalKeywords = document.getElementById("modalKeywords");
const modalContact = document.getElementById("modalContact");
const modalScore = document.getElementById("modalScore");

const resultCards = document.querySelectorAll(".result-card");

if (
    modal &&
    closeModal &&
    modalImage &&
    modalTitle &&
    modalDescription &&
    modalKeywords &&
    modalContact &&
    modalScore &&
    resultCards.length > 0
) {
    resultCards.forEach(card => {
        card.addEventListener("click", () => {
            if (card.style.display === "none") return;

            modalImage.src = card.dataset.image;
            modalTitle.textContent = card.dataset.title;
            modalDescription.textContent = card.dataset.description || "No description";
            modalContact.textContent = card.dataset.contact || "No contact information";

            const finalScore = parseFloat(card.dataset.score || "0");
            modalScore.textContent = `${(finalScore * 100).toFixed(1)}%`;

            const keywordsLine = card.querySelector(".keywords-line");
            if (keywordsLine) {
                modalKeywords.innerHTML = keywordsLine.innerHTML.replace("<strong>Keywords:</strong>", "").trim();
            } else {
                modalKeywords.textContent = card.dataset.keywords || "";
            }

            modal.style.display = "flex";
        });
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// Home image slide
document.addEventListener("DOMContentLoaded", function () {
    const heroImage = document.getElementById("hero-slideshow");

    if (heroImage && typeof slideshowImages !== "undefined" && slideshowImages.length > 1) {
        let currentIndex = 0;

        setInterval(() => {
            heroImage.style.opacity = "0";

            setTimeout(() => {
                currentIndex = (currentIndex + 1) % slideshowImages.length;
                heroImage.src = slideshowImages[currentIndex];
                heroImage.style.opacity = "1";
            }, 300);
        }, 3000);
    }
});

// Home menu toggle
document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const popupMenu = document.getElementById("popupMenu");

    if (menuToggle && popupMenu) {
        menuToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            popupMenu.classList.toggle("show");
        });

        document.addEventListener("click", function (e) {
            if (!popupMenu.contains(e.target) && e.target !== menuToggle) {
                popupMenu.classList.remove("show");
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("post-image");

    if (fileInput) {
        const uploadBox = fileInput.closest(".upload-box");
        const uploadText = uploadBox ? uploadBox.querySelector(".upload-text") : null;

        fileInput.addEventListener("change", function () {
            if (!uploadBox || !uploadText) return;

            const file = this.files[0];

            if (file) {
                uploadBox.classList.add("uploaded");
                uploadText.textContent = "You have successfully submitted an image!";
            } else {
                uploadBox.classList.remove("uploaded");
                uploadText.textContent = "Click to upload image";
            }
        });
    }
});