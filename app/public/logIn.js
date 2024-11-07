document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginButton");
  const errorMessage = document.getElementById("errorMessage");

  loginButton.addEventListener("click", async () => {
      // Retrieve the username and password values
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      // Basic client-side validation
      if (!username || !password) {
          errorMessage.textContent = "Please enter both username and password.";
          return;
      }

      try {
          // Send login data to the server
          const response = await fetch("/login", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ username, password })
          });

          // Check if login was successful
          if (response.ok) {
              alert("Login successful!");
              window.location.href = "/dashboard"; // Redirect to dashboard or main page
          } else {
              // Display an error message if login failed
              const errorData = await response.json();
              errorMessage.textContent = `Error: ${errorData.error || "Invalid credentials"}`;
          }
      } catch (error) {
          console.error("Error during login:", error);
          errorMessage.textContent = "An error occurred. Please try again later.";
      }
  });
});
