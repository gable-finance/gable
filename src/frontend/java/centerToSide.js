if (window.innerWidth >= 768) { // Adjust the width as needed for your desktop breakpoint
    const containers = document.querySelectorAll(".roadmap-feature");

    containers.forEach((container, index) => {
        window.addEventListener("scroll", () => {
            const viewportHeight = window.innerHeight;
            const containerTop = container.getBoundingClientRect().top;

            if (index % 2 === 0) {
                // Even index containers move to the right
                if (containerTop < viewportHeight - 100) {
                    container.style.transform = "translateX(calc(-50vw + 60%))";
                } 
            } else {
                // Odd index containers move to the left
                if (containerTop < viewportHeight - 100) {
                    container.style.transform = "translateX(calc(50vw - 60%))";
                }
            }
        });
    });
}


