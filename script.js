
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}

function showMessage(text) {
    message.textContent = text;
}

async function loadTasks() {
    try {
        const tasks = await apiRequest("/api/tasks");

        taskList.replaceChildren();

        if (tasks.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "No tasks yet. Add your first task!";
            taskList.appendChild(empty);
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement("article");
            card.className = "task-card";

            const title = document.createElement("h3");
            title.textContent = task.title;

            const description = document.createElement("p");
            description.textContent =
                task.description || "No description";

            const dueDate = document.createElement("p");
            dueDate.textContent = task.due_date
                ? `Due date: ${task.due_date}`
                : "No due date";

            const status = document.createElement("p");
            status.textContent = `Status: ${task.status}`;
            status.className = task.status === "Completed"
                ? "completed"
                : "";

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => editTask(task));

            const statusButton = document.createElement("button");
            statusButton.textContent = task.status === "Completed"
                ? "Mark Pending"
                : "Mark Completed";
            statusButton.addEventListener(
                "click",
                () => changeStatus(task)
            );

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener(
                "click",
                () => deleteTask(task.id)
            );

            card.append(
                title,
                description,
                dueDate,
                status,
                editButton,
                statusButton,
                deleteButton
            );

            taskList.appendChild(card);
        });
    } catch (error) {
        showMessage(error.message);
    }
}

taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description =
        document.getElementById("description").value.trim();
    const due_date = document.getElementById("dueDate").value;

    if (!title) {
        showMessage("Please enter a task title.");
        return;
    }

    try {
        await apiRequest("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
                title,
                description,
                due_date
            })
        });

        taskForm.reset();
        showMessage("Task added successfully!");
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
    }
});

async function editTask(task) {
    const title = prompt("Enter task title:", task.title);
    if (title === null) return;

    if (!title.trim()) {
        showMessage("Task title cannot be empty.");
        return;
    }

    const description = prompt(
        "Enter description:", task.description
    );
    if (description === null) return;

    const due_date = prompt(
        "Enter due date (YYYY-MM-DD), or leave blank:",
        task.due_date
    );
    if (due_date === null) return;

    try {
        await apiRequest(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({
                title: title.trim(),
                description,
                due_date,
                status: task.status
            })
        });

        showMessage("Task updated successfully!");
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
    }
}

async function changeStatus(task) {
    const status = task.status === "Completed"
        ? "Pending"
        : "Completed";

    try {
        await apiRequest(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                due_date: task.due_date,
                status
            })
        });

        showMessage("Task status updated!");
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
    }
}

async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await apiRequest(`/api/tasks/${id}`, {
            method: "DELETE"
        });

        showMessage("Task deleted successfully!");
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
    }
}

loadTasks();
