
// BHBI REGISTRATION DEMO

const registrationForm = document.getElementById("registrationForm");
const searchButton = document.getElementById("searchButton");

// SAVE BUTTON

registrationForm.addEventListener("submit", function(event) {
    event.preventDefault();

    alert("Registration form is ready! Database connection coming soon.");

    registrationForm.reset();
});

// SEARCH BUTTON

searchButton.addEventListener("click", function() {
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    const searchValue = searchInput.value.trim();

    if (searchValue === "") {
        searchResults.textContent = "Please enter a name or registration number.";
        return;
    }

    searchResults.textContent = "Search will be available when the database is connected!";
});
