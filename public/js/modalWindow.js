// js/modalWindow.js

// Get modal elements
const modal = document.getElementById("sneakerModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalBrand = document.getElementById("modalBrand");
const modalDescription = document.getElementById("modalDescription");
const closeModal = document.querySelector(".close-modal");

// Add click event to each sneaker card
document.querySelectorAll(".sneaker-card").forEach(card => {
    card.addEventListener("click", () => {
        // Get sneaker data
        const imageUrl = card.querySelector(".sneaker-image").src;
        const name = card.querySelector(".sneaker-name").textContent;
        const brand = card.querySelector(".sneaker-brand").textContent;

        // Set modal content
        modalImage.src = imageUrl;
        modalName.textContent = name;
        modalBrand.textContent = brand;

        // Show the modal
        modal.style.display = "block";
    });
});

// Close the modal when the close button is clicked
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// Close the modal when clicking outside the modal content
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
