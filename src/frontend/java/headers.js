const headerItems = document.querySelectorAll('.header-item');

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
});

headerItems.forEach(item => {
  observer.observe(item);
});
