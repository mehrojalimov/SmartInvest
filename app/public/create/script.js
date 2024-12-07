console.clear();

const loginBtn = document.getElementById('login');
const signupBtn = document.getElementById('signup');
const submitSignupBtn = document.getElementById('signupBtn');
const submitLoginBtn = document.getElementById('loginBtn');
const signupErrorMessage = document.getElementById('signupErrorMessage');
const loginErrorMessage = document.getElementById('loginErrorMessage');

loginBtn.addEventListener('click', (e) => {
	let parent = e.target.parentNode.parentNode;
  
  signupErrorMessage.style.display = "none";
  signupErrorMessage.textContent = "";

	Array.from(e.target.parentNode.parentNode.classList).find((element) => {
		if(element !== "slide-up") {
			parent.classList.add('slide-up')
		}else{
			signupBtn.parentNode.classList.add('slide-up')
			parent.classList.remove('slide-up')
		}
	});
});

signupBtn.addEventListener('click', (e) => {
	let parent = e.target.parentNode;

  loginErrorMessage.style.display = "none";
  loginErrorMessage.textContent = "";



	Array.from(e.target.parentNode.classList).find((element) => {
		if(element !== "slide-up") {
			parent.classList.add('slide-up')
		}else{
			loginBtn.parentNode.parentNode.classList.add('slide-up')
			parent.classList.remove('slide-up')
		}
	});
});

submitSignupBtn.addEventListener('click', async (e) => {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  
      // Clear previous error message
  signupErrorMessage.style.display = "none";
  signupErrorMessage.textContent = "";
  
      // Basic client-side validation
  if (username.length < 5 || username.length > 20) {
    signupErrorMessage.textContent = "Username must be between 5 and 20 characters.";
    signupErrorMessage.style.display = "block";
    return;
  }
  
  if (password.length < 8) {
    signupErrorMessage.textContent = "Password must be at least 8 characters long.";
    signupErrorMessage.style.display = "block";
    return;
  }
  
  try {
        // Send data to the server
    const response = await fetch("/create", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });
  
    if (response.ok) {
      window.location.href = "/dashboard";
    } else {
          // Display an error message if login failed
      const errorData = await response.json();
      signupErrorMessage.textContent = `Error: ${errorData.error || "Invalid credentials"}`;
      loginErrorMessage.style.display = "block";
    }
  } catch (error) {
        // Catch network errors or other unexpected errors
    console.error("Error during create:", error);
    signupErrorMessage.textContent = "An error occurred. Please try again later.";
  }
});

submitLoginBtn.addEventListener('click', async (e) => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginErrorMessage.style.display = "none";
  loginErrorMessage.textContent = "";

      // Basic client-side validation
  if (!username || !password) {
    loginErrorMessage.textContent = "Please enter both username and password.";
    loginErrorMessage.style.display = "block";
    return;
  }

  try {
          // Send login data to the server
    const response = await fetch("/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });

          // Check if login was successful
    if (response.ok) {
      window.location.href = "/dashboard";
    } else {
      // Display an error message if login failed
      const errorData = await response.json();
      loginErrorMessage.textContent = `Error: ${errorData.error || "Invalid credentials"}`;
      loginErrorMessage.style.display = "block";
    }
  } catch (error) {
    console.error("Error during login:", error);
    loginErrorMessage.textContent = "An error occurred. Please try again later.";
  }
}); 
