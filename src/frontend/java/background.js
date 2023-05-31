
// window.onload = function() {// Set up canvas
//     var canvas = document.getElementById("canvas");
//     var ctx = canvas.getContext("2d");

//     // Set canvas dimensions
//     canvas.width = window.innerWidth;
//     canvas.height = 150; // Set the canvas height to 500 pixels

//     // Create particles
//     var particles = [];
//     for (var i = 0; i < 100; i++) {
//     particles.push({
//         x: Math.random() * canvas.width,
//         y: Math.random() * canvas.height,
//         vx: (Math.random() - 0.5) * 2,
//         vy: (Math.random() - 0.5) * 2,
//         size: Math.random() * 5 + 1,
//         color: "rgba(255, 255, 255, 0.5)"
//     });
//     }

//     // Draw particles
//     function draw() {
//     // Clear canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
    
//     // Loop through particles
//     for (var i = 0; i < particles.length; i++) {
//         // Update position
//         particles[i].x += particles[i].vx;
//         particles[i].y += particles[i].vy;
        
//         // Wrap around edges
//         if (particles[i].x < 0) particles[i].x = canvas.width;
//         if (particles[i].x > canvas.width) particles[i].x = 0;
//         if (particles[i].y < 0) particles[i].y = canvas.height;
//         if (particles[i].y > canvas.height) particles[i].y = 0;
        
//         // Draw particle
//         ctx.fillStyle = particles[i].color;
//         ctx.beginPath();
//         ctx.arc(particles[i].x, particles[i].y, particles[i].size, 0, Math.PI * 2);
//         ctx.closePath();
//         ctx.fill();
//     }
    
//     // Request next frame
//     requestAnimationFrame(draw);
//     }

//     // Start animation
//     draw();
// };

window.onload = function() {
    var canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = 150; // Set the canvas height to 500 pixels
    var ctx = canvas.getContext("2d");
    var amplitude = 50; // Set the amplitude of the wave
    var wavelength = 100; // Set the wavelength of the wave
    var frequency = 0.02; // Set the frequency of the wave

    function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var x = 0; x < canvas.width; x++) {
        var y = canvas.height / 2 + amplitude * Math.sin(frequency * x * 2 * Math.PI / wavelength);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }
    }

    draw();
};
