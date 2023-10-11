const ipAddress = '192.168.1.65:8000'; // Replace with your server's IP address
const apiEndpoint = `http://${ipAddress}/`;

// Make a GET request to the API
fetch(apiEndpoint)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text(); // Parse the response as text
  })
  .then(data => {
    // Handle the text data here
    console.log('Response Data:', data);
  })
  .catch(error => {
    // Handle errors here
    console.error('There was a problem with the fetch operation:', error);
  });
