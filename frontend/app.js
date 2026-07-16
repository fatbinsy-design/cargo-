const taskList = document.querySelector('#tasks');
const taskForm = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const statusNode = document.querySelector('#status');

function setStatus(text, state = 'ok') {
  statusNode.textContent = text;
  statusNode.dataset.state = state;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function renderTasks(tasks) {
  taskList.textContent = '';

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Aucune tache pour le moment';
    taskList.append(empty);
    return;
  }

  for (const task of tasks) {
    const row = document.createElement('article');
    row.className = 'task';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.ariaLabel = `Terminer ${task.title}`;
    checkbox.addEventListener('change', async () => {
      await request(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: checkbox.checked }),
      });
      await loadTasks();
    });

    const content = document.createElement('div');
    const title = document.createElement('div');
    title.className = task.completed ? 'task-title done' : 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = formatDate(task.created_at);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'x';
    deleteButton.ariaLabel = `Supprimer ${task.title}`;
    deleteButton.addEventListener('click', async () => {
      await request(`/api/tasks/${task.id}`, { method: 'DELETE' });
      await loadTasks();
    });

    content.append(title, meta);
    row.append(checkbox, content, deleteButton);
    taskList.append(row);
  }
}

async function loadTasks() {
  try {
    const tasks = await request('/api/tasks');
    renderTasks(tasks);
    setStatus('Connecte', 'ok');
  } catch (error) {
    setStatus('Hors ligne', 'error');
    renderTasks([]);
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();

  if (!title) return;

  await request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

  titleInput.value = '';
  await loadTasks();
});

loadTasks();
