window.addEventListener("scroll", function() {

    var nav = document.querySelector("nav");
    var banner = document.querySelector("#banner");
    var text = document.querySelector("#banner-text");
  
    if (window.scrollY > (banner.offsetHeight/2) - nav.offsetHeight) {
        text.classList.add("hide-text"); /* add the hide-text class when the navigation bar scrolls over the header */
    } else {
        text.classList.remove("hide-text"); /* remove the hide-text class when the navigation bar is above the header */
    }
  
    nav.classList.toggle("scrolled", window.scrollY > 325);

  });