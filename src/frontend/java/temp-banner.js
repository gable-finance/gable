// temp banner

const content = document.querySelector('body');

// set navigation bar margin from top equal to the banner height
function adjustContentMargin2() {
    const bannerHeight = banner.offsetHeight;
    content.style.marginTop = `${bannerHeight}px`;
    };

window.addEventListener('scroll', adjustContentMargin2);
window.addEventListener('load', adjustContentMargin2);
window.addEventListener('resize', adjustContentMargin2);

// remove banner

const dismissBtn = document.getElementById('banner-dismiss');
const banner = document.getElementById('banner-div'); //temp banner

dismissBtn.addEventListener('click', () => {
    banner.style.display = 'none';
    content.style.marginTop = `0`;
    navbar.style.marginTop = `0`; //temp banner
    });