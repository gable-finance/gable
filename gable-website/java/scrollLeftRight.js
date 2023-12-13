const rightButtons = Array.from(document.getElementsByClassName('slideRight'));
const leftButtons = Array.from(document.getElementsByClassName('slideLeft'));
const containers = Array.from(document.getElementsByClassName('news-wrapper'));

let index = 0;
for (const rightButton of rightButtons) {
    const container = containers[index];
    rightButton.addEventListener("click", function () {
        container.scrollLeft += 500;
    });
    index++;
}

index = 0;
for (const leftButton of leftButtons) {
    const container = containers[index];
    leftButton.addEventListener("click", function () {
        container.scrollLeft -= 500;
    });
    index++;
}