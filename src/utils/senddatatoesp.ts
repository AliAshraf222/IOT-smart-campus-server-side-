// The URL you want to send the POST request to
const url = "https://4b26-196-132-55-38.ngrok-free.app/receive-pin";

// An async function to send the data
export async function postNumber(numberToSend: number) {
  try {
    const response = await fetch(url, {
      method: "POST", // Specify the method
      headers: {
        // Change the Content-Type to plain text
        "Content-Type": "text/plain"
      },
      // Send the number directly as a string, not in a JSON object
      body: String(numberToSend)
    });

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Log the success message and the response data
    const responseData = await response.text(); // Get response as text
    console.log("Success:", responseData);
  } catch (error) {
    // Log any errors that occurred during the fetch
    console.error("Error:", error);
  }
}

// Call the function to send the number
// postNumber(0);
