function changeTab(event, tabId) {
    var tabContents = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabContents.length; i++) {
      tabContents[i].style.display = 'none';
    }

    var selectedTab = document.getElementById(tabId);
    selectedTab.style.display = 'block';

    // Remove active class from all buttons
    var tabButtons = document.getElementsByClassName('tab-button');
    for (var i = 0; i < tabButtons.length; i++) {
      tabButtons[i].classList.remove('active');
    }

    // Add active class to the clicked button
    event.target.classList.add('active');

    event.preventDefault();
  }

  // Set the first tab as active by default
  var defaultTab = document.getElementById('content1');
  defaultTab.style.display = 'block';
  document.getElementById('button1').classList.add('active');