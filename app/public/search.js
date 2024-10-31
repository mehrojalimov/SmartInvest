document.getElementById("submit").addEventListener("click", async () => {
    const genre = document.getElementById("genre").value;
  
    const response = await fetch(`/search-books?genre=${genre}`);
    const books = await response.json();
  
    const booksTable = document.getElementById("books");
    booksTable.innerHTML = "";  // Clear previous results
  
    books.forEach((book) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${book.title}</td><td>${book.genre}</td><td>${book.quality}</td>`;
      booksTable.appendChild(row);
    });
  });
  