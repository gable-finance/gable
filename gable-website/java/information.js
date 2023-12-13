// // JavaScript event listener example
// const infoIcon = document.querySelector('.info-icon');
// const tooltipElement = document.querySelector('.info-icon::after');

// infoIcon.addEventListener('mouseover', () => {
//   const tooltipContent = 'Dynamic tooltip content';
//   tooltipElement.textContent = tooltipContent;
// });

// // JavaScript event listener for multiple info icons
// const infoIcons = document.querySelectorAll('.info-icon');
// const tooltipElement = document.querySelector('.tooltip');

// infoIcons.forEach((infoIcon) => {
//   infoIcon.addEventListener('mouseover', () => {
//     // const tooltipContent = `Dynamic tooltip content ${index + 1}`;
//     // tooltipElement.textContent = tooltipContent;
//     tooltipElement.style.display = 'block'; // Show the tooltip
//   });

//   infoIcon.addEventListener('mouseout', () => {
//     tooltipElement.style.display = 'none'; // Hide the tooltip on mouseout
//   });
// });

document.addEventListener('DOMContentLoaded', function () {
  // JavaScript event listener for multiple info icons
  const infoIcons = document.querySelectorAll('.info-icon');

  infoIcons.forEach((infoIcon) => {
    const tooltipId = infoIcon.nextElementSibling.id;
    const tooltipElement = document.getElementById(tooltipId);

    infoIcon.addEventListener('mouseover', () => {
      tooltipElement.style.display = 'block'; // Show the tooltip
    });

    infoIcon.addEventListener('mouseout', () => {
      tooltipElement.style.display = 'none'; // Hide the tooltip on mouseout
    });
  });
});
