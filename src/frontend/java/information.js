// JavaScript event listener example
const infoIcon = document.querySelector('.info-icon');
const tooltipElement = document.querySelector('.info-icon::after');

infoIcon.addEventListener('mouseover', () => {
  const tooltipContent = 'Dynamic tooltip content';
  tooltipElement.textContent = tooltipContent;
});