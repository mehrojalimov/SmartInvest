document.addEventListener("DOMContentLoaded", () => {
  const createAccountButton = document.getElementById("createAccountButton");

  createAccountButton.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Basic client-side validation
    if (username.length < 3 || username.length > 20) {
      alert("Username must be between 3 and 20 characters.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long.");
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
        alert("Account created successfully!");
        window.location.href = "/login"; // Redirect to login page after successful account creation
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Unable to create account"}`);
      }
    } catch (error) {
      console.error("Error during account creation:", error);
      alert("An error occurred. Please try again later.");
    }
  });
});
