document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById("activities-list");
  const activitySelectEl = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messageEl.classList.remove("hidden");
    // auto-hide after 4s
    setTimeout(() => messageEl.classList.add("hidden"), 4000);
  }

  function clearMessage() {
    messageEl.className = "hidden";
    messageEl.textContent = "";
  }

  function renderActivities(activities) {
    activitiesListEl.innerHTML = "";
    activitySelectEl.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.keys(activities).forEach((name) => {
      const a = activities[name];

      // Add option to select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelectEl.appendChild(opt);

      // Build card
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = a.description;
      card.appendChild(desc);

      const schedule = document.createElement("p");
      schedule.innerHTML = `<strong>Schedule:</strong> ${a.schedule}`;
      card.appendChild(schedule);

      const counts = document.createElement("p");
      counts.innerHTML = `<strong>Participants:</strong> ${a.participants.length} / ${a.max_participants}`;
      card.appendChild(counts);

      // Participants section
      const participantsSection = document.createElement("div");
      participantsSection.className = "activity-participants";

      const participantsTitle = document.createElement("h5");
      participantsTitle.textContent = "Signed-up students";
      participantsSection.appendChild(participantsTitle);

      if (Array.isArray(a.participants) && a.participants.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "participants-list";
        a.participants.forEach((email) => {
          const li = document.createElement("li");

          const emailSpan = document.createElement("span");
          emailSpan.className = "participant-email";
          emailSpan.textContent = email;

          const removeBtn = document.createElement("button");
          removeBtn.className = "participant-remove";
          removeBtn.type = "button";
          removeBtn.title = `Unregister ${email}`;
          removeBtn.innerHTML = '✕';

          removeBtn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            if (!confirm(`Unregister ${email} from ${name}?`)) return;
            try {
              const url = `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`;
              const res = await fetch(url, { method: "DELETE" });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) {
                const detail = body.detail || body.message || "Unregister failed";
                showMessage(detail, "error");
                return;
              }
              showMessage(body.message || "Unregistered successfully", "success");
              await loadActivities();
            } catch (err) {
              showMessage(err.message || "Unregister failed", "error");
            }
          });

          li.appendChild(emailSpan);
          li.appendChild(removeBtn);
          ul.appendChild(li);
        });
        participantsSection.appendChild(ul);
      } else {
        const no = document.createElement("div");
        no.className = "no-participants";
        no.textContent = "No participants yet — be the first!";
        participantsSection.appendChild(no);
      }

      card.appendChild(participantsSection);
      activitiesListEl.appendChild(card);
    });
  }

  async function loadActivities() {
    try {
      clearMessage();
      activitiesListEl.innerHTML = "<p>Loading activities...</p>";
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
    } catch (err) {
      activitiesListEl.innerHTML = "<p>Unable to load activities.</p>";
      showMessage(err.message || "Error loading activities", "error");
    }
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    const email = document.getElementById("email").value.trim();
    const activity = activitySelectEl.value;
    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = body.detail || body.message || "Signup failed";
        showMessage(detail, "error");
        return;
      }

      showMessage(body.message || "Signed up successfully!", "success");
      // reload activities to show updated participants
      await loadActivities();
      signupForm.reset();
    } catch (err) {
      showMessage(err.message || "Signup failed", "error");
    }
  });

  // initial load
  loadActivities();
});
