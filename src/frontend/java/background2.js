
window.onload = function() {
		// Set up the canvas element
		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var width = window.innerWidth;
		var height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		
		// Define the gradient colors
		var gradient = ctx.createLinearGradient(0, 0, width, height);
		gradient.addColorStop(0, "#141414");
		gradient.addColorStop(0.5, "#2d2d2d");
		gradient.addColorStop(1, "#141414");
		
		// Define the animation parameters
		var speed = 0.05;
		var x = 0;
		var y = height / 2;
		
		// Update the animation frame
		function update() {
			// Clear the canvas
			ctx.clearRect(0, 0, width, height);
			
			// Draw the gradient background
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);
			
			// Draw the moving wave
			ctx.beginPath();
			ctx.moveTo(0, y);
			for (var i = 0; i < width; i++) {
				ctx.lineTo(i, y + Math.sin(x + i * speed) * 100);
			}
			ctx.strokeStyle = "#1e1e1e";
			ctx.lineWidth = 150;
			ctx.stroke();
			
			// Update the wave position
			x += 0.1;
			
			// Request the next animation frame
			requestAnimationFrame(update);
		}
		
		// Start the animation
		update();
		
		// Resize the canvas on window resize
		window.addEventListener('resize', function() {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width;
			canvas.height = height;
			gradient = ctx.createLinearGradient(0, 0, width, height);
			gradient.addColorStop(0, "#141414");
			gradient.addColorStop(0.5, "#2d2d2d");
			gradient.addColorStop(1, "#141414");
		});
}