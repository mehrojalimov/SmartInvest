document.getElementById("submit").addEventListener("click", async () => {
    const title = document.getElementById("title").value;
    const genre = document.getElementById("genre").value;
    const quality = document.querySelector('input[name="quality"]:checked')?.value;
  
    if (title && genre && quality) {
      const response = await fetch("/add-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, genre, quality }),
      });
  
      const result = await response.json();
      document.getElementById("message").innerText = result.message;
    } else {
      document.getElementById("message").innerText = "Please fill all fields.";
    }
  });
  