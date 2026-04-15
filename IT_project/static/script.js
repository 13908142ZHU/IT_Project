// Show image preview when user selects a file
// Use document.getelementById() to return DOM by id
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

//Tag Selection System
//Use document.querySelectorAll() to return a list of DOM by class
const categoryButtons = document.querySelectorAll(".tag-category-btn");
const tags = document.querySelectorAll(".tag");
const hiddenInput = document.getElementById("selected-tags");

//Add listeners to each after iterateing categoryButtions
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        const tagGroup = button.nextElementSibling;
        tagGroup.classList.toggle("open");
    });
});

let selected = [];

tags.forEach(i => {
    i.addEventListener("click", () => {
        // Highlight the chosen tag
        i.classList.toggle("active"); 

        // Get texts of the tag and clean it
        const value = i.innerText.trim(); 

        if (selected.includes(value)) {
            //Remove the chosen tag from the selected list if the list contains it
            selected = selected.filter(t => t !== value);
        } else {
            // Add the chosen tag to the selected list if the list doesn't contain it
            selected.push(value);
        }

        //Connect selected tags with commas, store into hidden input box and submit the form
        if (hiddenInput) {
            hiddenInput.value = selected.join(",");
        }
    });
});


const resultsContainer = document.getElementById("results-container");
const largeViewBtn = document.getElementById("largeViewBtn");
const smallViewBtn = document.getElementById("smallViewBtn");

//When user click
if (largeViewBtn && smallViewBtn && resultsContainer){
    largeViewBtn.addEventListener("click", () => {
        //Remove the class of compact view
        resultsContainer.classList.remove("compact-view");
        //Add the class of large view
        resultsContainer.classList.add("large-view");
        //Highlight large view button
        largeViewBtn.classList.add("active");
        //Remove Highlight of small view buttion
        smallViewBtn.classList.remove("active");
    });

    smallViewBtn.addEventListener("click", () => {
        resultsContainer.classList.remove("large-view");
        resultsContainer.classList.add("compact-view");
        smallViewBtn.classList.add("active");
        largeViewBtn.classList.remove("active");
    });
}


//Modal Detail View. When clicking the result card, Show detailed information.
const modal = document.getElementById("detailModal");
const closeModal = document.getElementById("closeModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalKeywords = document.getElementById("modalKeywords");
const modalContact = document.getElementById("modalContact");
const modalScore = document.getElementById("modalScore");
const resultCards = document.querySelectorAll(".result-card");

if(modal && closeModal){
    resultCards.forEach(card => {
        card.addEventListener("click", () => {
            
            //Get source of the image, title, description(with default value) and contact way(with default calue)of the card 
            modalImage.src = card.dataset.image;
            modalTitle.textContent = card.dataset.title;
            modalDescription.textContent = card.dataset.description || "No description";
            modalContact.textContent = card.dataset.contact || "No contact information";

            //Process the score
            const finalScore = parseFloat(card.dataset.score || "0");
            modalScore.textContent = `${(finalScore * 100).toFixed(1)}%`;

            //Search element of class = "keywords-line" in current card
            const keywordsLine = card.querySelector(".keywords-line");
            if (keywordsLine) {
                // Copy the keywords data from the card to keywords region after cleaning
                modalKeywords.innerHTML = keywordsLine.innerHTML.replace("<strong>Keywords:</strong>", "").trim();
            } else {
                modalKeywords.textContent = card.dataset.keywords || "";
            }

            modal.style.display = "flex";
        });
    });

    //Two ways to close the modal
    //First, click the close button
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    //Second, click the background of the modal
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// Home image slideshow
document.addEventListener("DOMContentLoaded", function () {
    const heroImage = document.getElementById("hero-slideshow");

    if (heroImage && window.slideshowImages && window.slideshowImages.length > 1) {
        let currentIndex = 0;

        // Fade out
        setInterval(() => {
            heroImage.style.opacity = "0";

            setTimeout(() => {
                currentIndex = (currentIndex + 1) % slideshowImages.length;
                //Switch to next image
                heroImage.src = slideshowImages[currentIndex];// Change the image
                heroImage.style.opacity = "1"; // Fade in next image
            }, 300);
        }, 3000);//Every 3000ms(3s)switch to next image
    }
});

// Hamburger menu
document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const popupMenu = document.getElementById("popupMenu");

    if (menuToggle && popupMenu) {
        // Click the menu to show or hide it
        menuToggle.addEventListener("click", function() {
            popupMenu.classList.toggle("show");
        });

        //Click other place to close the menu
        document.addEventListener("click", function (e) {
            if (!popupMenu.contains(e.target) && e.target !== menuToggle) {
                popupMenu.classList.remove("show");
            }
        });
    }
});

// Function of uploading image
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("post-image");

    if (fileInput) {
        const uploadBox = fileInput.closest(".upload-box");
        const uploadText = uploadBox ? uploadBox.querySelector(".upload-text") : null;

        fileInput.addEventListener("change", function () {
            if (!uploadBox || !uploadText) return;

            const file = this.files[0];// Get first file chosen

            if (file) {
                uploadBox.classList.add("uploaded");// Add successful style
                uploadText.textContent = "You have successfully submitted an image!";
            } else {
                uploadBox.classList.remove("uploaded");
                uploadText.textContent = "Click to upload image";//Defualt
            }
        });
    }
});
