function smoothScroll(target) {
  // Check if the target selector is valid
  if (!document.querySelector(target)) {
    console.error('Invalid target selector:', target);
    return;
  }

  // Get the target element's position
  var targetOffset = document.querySelector(target).offsetTop;

  // Calculate the middle of the target element
  var targetMiddle = targetOffset + (document.querySelector(target).offsetHeight / 2);

  // Get the height of the viewport
  var windowHeight = window.innerHeight;

  // Calculate the position to scroll to
  var scrollPosition = targetMiddle - (windowHeight / 2);

  // Scroll to the target element
  window.scrollTo({
    top: scrollPosition,
    behavior: 'smooth'
  });
}