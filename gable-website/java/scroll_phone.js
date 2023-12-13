const navbar = document.querySelector('nav');
let prevScrollpos2 = window.scrollY;

window.addEventListener('scroll', function() {

    const currentScrollPos = window.scrollY;
    
    if (prevScrollpos2 > currentScrollPos && window.scrollY > 200) {
        navbar.classList.add('show');
    } else {
        navbar.classList.remove('show');
    }
    prevScrollpos2 = currentScrollPos;
    
});