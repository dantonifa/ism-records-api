function initializeNextRecords(initialResponse, initialPayload) {
  const container = document.getElementById("records-container");
  const menu = document.getElementById("vertical-menu-list");
  const toggle = document.getElementById("menu-toggle");
  const buttons = menu.querySelectorAll("[data-action]");
  let records = [];
  let canManage = false;
  let canCreate = false;

  function showMessage(message) {
    container.replaceChildren();
    const text = document.createElement("p");
    text.textContent = message;
    container.appendChild(text);
  }

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  }

  function input(form, label, name, value = "", type = "text") {
    const wrapper = element("label", label);
    const field = document.createElement("input");
    field.name = name;
    field.type = type;
    field.value = value;
    field.required = true;
    wrapper.appendChild(field);
    form.appendChild(wrapper);
  }

  async function send(url, method, data) {
    const response = await fetch(url, {
      method,
      ...(data ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) } : {}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to save record.");
    return payload;
  }

  async function refresh(archived = false) {
    const response = await fetch(`/api/records${archived ? "?status=archived" : ""}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to load records.");
    records = payload.data;
  }

  function renderList(action) {
    container.replaceChildren();
    const search = document.createElement("input");
    search.placeholder = "Filter by student ID";
    search.setAttribute("aria-label", "Filter by student ID");
    const list = element("div");
    container.append(search, list);

    function render() {
      list.replaceChildren();
      const matches = records.filter((record) => record.studentId.toLowerCase().includes(search.value.trim().toLowerCase()));
      if (!matches.length) list.appendChild(element("p", "No matching records."));
      matches.forEach((record) => {
        const card = element("article");
        card.className = "record-card";
        card.appendChild(element("h3", `${record.name} (${record.studentId})`));
        card.appendChild(element("p", `${record.course} — ${record.grado}, ${record.seccion}, ${record.year}`));
        card.appendChild(element("p", ["parcial1", "parcial2", "parcial3", "parcial4"].map((key, index) => `Q${index + 1}: ${record.grades?.[key] ?? "Not graded"}`).join(" | ")));
        const url = `/api/records/${encodeURIComponent(record.studentId)}?recordId=${encodeURIComponent(record._id)}`;
        if (action === "update" && canManage) {
          const form = element("form");
          input(form, "Name", "name", record.name);
          input(form, "Grade level", "grado", record.grado);
          const submit = element("button", "Save changes");
          submit.type = "submit";
          form.appendChild(submit);
          const status = element("p");
          form.appendChild(status);
          form.addEventListener("submit", async (event) => {
            event.preventDefault();
            submit.disabled = true;
            try {
              const values = new FormData(form);
              await send(url, "PATCH", { name: values.get("name"), grado: values.get("grado") });
              await refresh();
              render();
            } catch (error) {
              status.textContent = error.message;
            } finally {
              submit.disabled = false;
            }
          });
          card.appendChild(form);
        }
        if (action === "delete" && canManage) {
          const archive = element("button", "Archive record");
          archive.type = "button";
          archive.addEventListener("click", async () => {
            if (!window.confirm(`Archive the ${record.course} record for ${record.studentId}?`)) return;
            archive.disabled = true;
            try {
              await send(url, "DELETE");
              await refresh();
              render();
            } catch (error) {
              const status = element("p", error.message);
              card.appendChild(status);
              archive.disabled = false;
            }
          });
          card.appendChild(archive);
        }
        if (action === "restore" && canManage) {
          const restore = element("button", "Restore record");
          restore.type = "button";
          restore.addEventListener("click", async () => {
            if (!window.confirm(`Restore the ${record.course} record for ${record.studentId}?`)) return;
            restore.disabled = true;
            try {
              await send(url, "PATCH", { status: "active" });
              await refresh(true);
              render();
            } catch (error) {
              card.appendChild(element("p", error.message));
              restore.disabled = false;
            }
          });
          card.appendChild(restore);
        }
        list.appendChild(card);
      });
    }
    search.addEventListener("input", render);
    render();
  }

  function renderCreate() {
    container.replaceChildren();
    const form = element("form");
    form.className = "form-wrapper";
    form.appendChild(element("h3", "Create academic record"));
    input(form, "Student ID", "studentId");
    input(form, "Name", "name");
    input(form, "Course code", "course");
    input(form, "Grade level", "grado");
    input(form, "Section", "seccion");
    input(form, "Year", "year", "", "number");
    form.appendChild(element("p", "Grades are submitted by assigned teachers for review."));
    const submit = element("button", "Create record");
    submit.type = "submit";
    const status = element("p");
    form.append(submit, status);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        const values = new FormData(form);
        await send("/api/records", "POST", {
          studentId: values.get("studentId"), name: values.get("name"), course: values.get("course"),
          grado: values.get("grado"), seccion: values.get("seccion"), year: Number(values.get("year")),
        });
        await refresh();
        form.reset();
        status.textContent = "Academic record created.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
    container.appendChild(form);
  }

  if (!initialResponse?.ok || !initialPayload.success) {
    toggle.hidden = true;
    toggle.style.display = "none";
    showMessage(initialPayload.message || "Sign in with an authorized account to view records.");
    return;
  }
  records = initialPayload.data;
  canManage = initialPayload.canManage;
  canCreate = initialPayload.canCreate;
  if (canManage) {
    const restore = element("button", "Restore archived record");
    restore.type = "button";
    restore.className = "crud-vertical-btn";
    menu.appendChild(restore);
    restore.addEventListener("click", async () => {
      menu.style.display = "none";
      container.style.display = "block";
      showMessage("Loading archived records...");
      try {
        await refresh(true);
        renderList("restore");
      } catch (error) {
        showMessage(error.message);
      }
    });
  }
  buttons.forEach((button) => {
    const action = button.dataset.action;
    if ((action === "create" && !canCreate) || (["update", "delete"].includes(action) && !canManage)) {
      button.hidden = true;
      button.style.display = "none";
    }
    if (action === "delete") button.textContent = "Archive record";
    button.addEventListener("click", async () => {
      menu.style.display = "none";
      container.style.display = "block";
      if (action === "create") renderCreate();
      else {
        showMessage("Loading records...");
        try {
          await refresh();
          renderList(action);
        } catch (error) {
          showMessage(error.message);
        }
      }
    });
  });
  toggle.addEventListener("click", () => {
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  });
  renderList("get");
}
