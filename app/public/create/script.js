document.addEventListener("DOMContentLoaded", () => {
  const createAccountButton = document.getElementById("createAccountButton");
  const errorMessage = document.getElementById("errorMessage"); // Add this line to select the error message element

  createAccountButton.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Clear previous error message
    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    // Basic client-side validation
    if (username.length < 3 || username.length > 20) {
      errorMessage.textContent = "Username must be between 3 and 20 characters.";
      errorMessage.style.display = "block";
      return;
    }

    if (password.length < 8) {
      errorMessage.textContent = "Password must be at least 8 characters long.";
      errorMessage.style.display = "block";
      return;
    }

    try {
      // Send data to the server
      const response = await fetch("/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        window.location.href = "/dashboard";
    } else {
        // Display an error message if login failed
        const errorData = await response.json();
        errorMessage.textContent = `Error: ${errorData.error || "Invalid credentials"}`;
    }
    } catch (error) {
      // Catch network errors or other unexpected errors
      console.error("Error during create:", error);
          errorMessage.textContent = "An error occurred. Please try again later.";
    }
  });
});
