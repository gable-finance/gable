const checkbox = document.getElementById('checkbox_check');
const body = document.querySelector('body');

checkbox.addEventListener('change', function() {
  if (checkbox.checked) {
    body.classList.add('no-scroll');
  } else {
    body.classList.remove('no-scroll');
  }
});