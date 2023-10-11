document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('scroll', function () {
        const scrollY = window.scrollY;
        const parallaxBg1 = document.querySelector('.parallax-bg1');
        const parallaxBg2 = document.querySelector('.parallax-bg2');
        const parallaxBg3 = document.querySelector('.parallax-bg3');
        const parallaxBg4 = document.querySelector('.parallax-bg4');

        const parallaxBg5 = document.querySelector('.parallax-bg5');
        const parallaxBg6 = document.querySelector('.parallax-bg6');
        const parallaxBg7 = document.querySelector('.parallax-bg7');
        const parallaxBg8 = document.querySelector('.parallax-bg8');
        const parallaxBg9 = document.querySelector('.parallax-bg9');
        const parallaxBg10 = document.querySelector('.parallax-bg10');
        const parallaxBg11 = document.querySelector('.parallax-bg11');
        const parallaxBg12 = document.querySelector('.parallax-bg12'); 
        const parallaxBg13 = document.querySelector('.parallax-bg13');
        const parallaxBg14 = document.querySelector('.parallax-bg14');

        if (parallaxBg1) {
            parallaxBg1.style.transform = `translateY(-${scrollY * 0.1}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg2) {
            parallaxBg2.style.transform = `translateY(-${scrollY * 0.05}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg3) {
            parallaxBg3.style.transform = `translateY(-${scrollY * 0.05}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg4) {
            parallaxBg4.style.transform = `translateY(-${scrollY * 0.02}px)`; /* Adjust the speed as needed */
        }


        if (parallaxBg5) {
            parallaxBg5.style.transform = `translateY(-${scrollY * 0.02}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg6) {
            parallaxBg6.style.transform = `translateY(-${scrollY * 0.02}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg7) {
            parallaxBg7.style.transform = `translateY(-${scrollY * 0.02}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg8) {
            parallaxBg8.style.transform = `translateY(-${scrollY * 0.02}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg9) {
            parallaxBg9.style.transform = `translateY(-${scrollY * 0.02}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg10) {
            parallaxBg10.style.transform = `translateY(-${scrollY * 0.01}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg11) {
            parallaxBg11.style.transform = `translateY(-${scrollY * 0.01}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg12) {
            parallaxBg12.style.transform = `translateY(-${scrollY * 0.01}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg13) {
            parallaxBg13.style.transform = `translateY(-${scrollY * 0.01}px)`; /* Adjust the speed as needed */
        }
        if (parallaxBg14) {
            parallaxBg14.style.transform = `translateY(-${scrollY * 0.01}px)`; /* Adjust the speed as needed */
        }
    });
});

