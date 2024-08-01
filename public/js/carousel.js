// js/carousel.js
document.addEventListener('DOMContentLoaded', () => {
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const sneakerList = document.querySelector('.sneaker-list');

    prevButton.addEventListener('click', () => {
        sneakerList.scrollBy({
            left: -1000,
            behavior: 'smooth'
        });
    });

    nextButton.addEventListener('click', () => {
        sneakerList.scrollBy({
            left: 1000,
            behavior: 'smooth'
        });
    });
});
