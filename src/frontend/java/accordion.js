const accordion = document.getElementsByClassName('accordion-container');

for (i=0; i<accordion.length; i++) {
  accordion[i].addEventListener('click', function () {
    console.log("HALLO TEST");
    this.classList.toggle('active')
  })
}