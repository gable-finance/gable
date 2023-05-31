const navbar = document.querySelector('nav');
let prevScrollpos = window.scrollY;

window.addEventListener('scroll', function() {

    const currentScrollPos = window.scrollY;
    
    if (prevScrollpos > currentScrollPos && window.scrollY > 200) {
        navbar.classList.add('show');
    } else {
        navbar.classList.remove('show');
    }
    prevScrollpos = currentScrollPos;
    
});