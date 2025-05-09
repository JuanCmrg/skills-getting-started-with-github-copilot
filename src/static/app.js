document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Dark mode toggle logic
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const body = document.body;

  function setDarkMode(enabled) {
    if (enabled) {
      body.classList.add("dark-mode");
      darkModeToggle.textContent = "☀️";
    } else {
      body.classList.remove("dark-mode");
      darkModeToggle.textContent = "🌙";
    }
    localStorage.setItem("darkMode", enabled ? "1" : "0");
  }

  // Initialize dark mode from localStorage
  const darkModePref = localStorage.getItem("darkMode") === "1";
  setDarkMode(darkModePref);

  darkModeToggle.addEventListener("click", () => {
    setDarkMode(!body.classList.contains("dark-mode"));
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${
              details.participants.length > 0
                ? `<ul class="participants-list no-bullets">
                    ${details.participants
                      .map(
                        (email) =>
                          `<li class="participant-item">${email} <span class="delete-participant" title="Unregister" data-activity="${name}" data-email="${email}">🗑️</span></li>`
                      )
                      .join("")}
                  </ul>`
                : `<span class="no-participants">No participants yet.</span>`
            }
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete icons
      document.querySelectorAll('.delete-participant').forEach(icon => {
        icon.addEventListener('click', async (e) => {
          const activity = icon.getAttribute('data-activity');
          const email = icon.getAttribute('data-email');
          if (!confirm(`Unregister ${email} from ${activity}?`)) return;
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = 'success';
              fetchActivities(); // Refresh list
            } else {
              messageDiv.textContent = result.detail || 'An error occurred';
              messageDiv.className = 'error';
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => {
              messageDiv.classList.add('hidden');
            }, 5000);
          } catch (error) {
            messageDiv.textContent = 'Failed to unregister. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            console.error('Error unregistering:', error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
