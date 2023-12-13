if (window.innerWidth >= 768) { // Adjust the width as needed for your desktop breakpoint

    window.addEventListener("scroll", function() {
      var nav = document.querySelector("nav");
      
      // Determine whether to add or remove the "scrolled" class based on scroll position
      var shouldAddScrolledClass = window.scrollY > 20;
  
      // Add or remove the "scrolled" class based on scroll position
      nav.classList.toggle("scrolled", shouldAddScrolledClass);

    });
  }