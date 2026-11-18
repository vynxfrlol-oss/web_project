// BHBI REGISTRATION DEMO

const apiBaseUrl = window.__API_BASE_URL__ ||
    ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:3000"
        : "");

const registrationForm = document.getElementById("registrationForm");
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const studentsTableBody = document.getElementById("studentsTableBody");

async function loadStudents(search = "") {
    try {
        const response = await fetch(`${apiBaseUrl}/api/students?search=${encodeURIComponent(search)}`);
        const students = await response.json();

        if (!response.ok) {
            const detail = students.error ? `: ${students.error}` : "";
            throw new Error((students.message || "Failed to load students") + detail);
        }

        studentsTableBody.innerHTML = "";

        if (!students.length) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6">No records found.</td>
                </tr>
            `;
            return;
        }

        students.forEach(student => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.registrationNumber || "-"}</td>
                <td>${student.firstName || "-"}</td>
                <td>${student.middleName || "-"}</td>
                <td>${student.lastName || "-"}</td>
                <td>${student.contact || "-"}</td>
                <td>${student.address || "-"}</td>
            `;
            studentsTableBody.appendChild(row);
        });
    } catch (error) {
        searchResults.textContent = error.message;
    }
}

registrationForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const student = {
        firstName: document.getElementById("firstName").value.trim(),
        middleName: document.getElementById("middleName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        dob: document.getElementById("dob").value,
        contact: document.getElementById("contact").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    try {
        const response = await fetch(`${apiBaseUrl}/api/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        const successMessage = "your registration is successful, we will update you the status - thanks.";
        searchResults.textContent = "Registration Successful | Approved";
        alert(successMessage);
        registrationForm.reset();
        loadStudents();
    } catch (error) {
        searchResults.textContent = error.message;
    }
});

searchButton.addEventListener("click", function() {
    const searchValue = searchInput.value.trim();

    if (searchValue === "") {
        searchResults.textContent = "Please enter a name or registration number.";
        loadStudents();
        return;
    }

    searchResults.textContent = `Searching for: ${searchValue}`;
    loadStudents(searchValue);
});

loadStudents();
