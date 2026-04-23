const API_URL = 'http://localhost:5000/api';

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTabs = document.querySelectorAll('.auth-tab');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');
const userGreeting = document.getElementById('user-greeting');

const datasetsGrid = document.getElementById('datasets-grid');
const addDatasetBtn = document.getElementById('add-dataset-btn');
const datasetModal = document.getElementById('dataset-modal');
const closeModalBtn = document.getElementById('close-modal');
const datasetForm = document.getElementById('dataset-form');
const modalTitle = document.getElementById('modal-title');

const adminPanel = document.getElementById('admin-panel');
const usersTableBody = document.getElementById('users-table-body');

// State
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Initialize
function init() {
  if (token && currentUser) {
    showDashboard();
    fetchDatasets();
    if (currentUser.role === 'admin') {
      adminPanel.classList.remove('hidden');
      fetchUsers();
    }
  } else {
    showAuth();
  }
}

// UI Toggles
function showAuth() {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  userGreeting.classList.add('hidden');
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  userGreeting.classList.remove('hidden');
  userGreeting.innerHTML = `Welcome, <span style="color:var(--primary);font-weight:bold;">${currentUser.username}</span> ${currentUser.role === 'admin' ? '🛡️' : ''}`;
}

function showMessage(msg, isError = false) {
  authMessage.textContent = msg;
  authMessage.className = `message ${isError ? 'error' : 'success'}`;
  authMessage.classList.remove('hidden');
  setTimeout(() => authMessage.classList.add('hidden'), 3000);
}

// Auth Logic
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (tab.dataset.tab === 'login') {
      loginForm.classList.add('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.remove('active');
      registerForm.classList.add('hidden');
    } else {
      registerForm.classList.add('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.remove('active');
      loginForm.classList.add('hidden');
    }
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message);
    
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    loginForm.reset();
    init();
  } catch (err) {
    showMessage(err.message, true);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message);
    
    showMessage('Registration successful! Please login.');
    registerForm.reset();
    document.querySelector('[data-tab="login"]').click();
  } catch (err) {
    showMessage(err.message, true);
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  adminPanel.classList.add('hidden');
  init();
});

// Datasets Logic
async function fetchDatasets() {
  try {
    const res = await fetch(`${API_URL}/datasets`);
    const datasets = await res.json();
    renderDatasets(datasets);
  } catch (err) {
    console.error('Failed to fetch datasets', err);
  }
}

function renderDatasets(datasets) {
  datasetsGrid.innerHTML = '';
  datasets.forEach(dataset => {
    const card = document.createElement('div');
    card.className = 'glass-panel dataset-card';
    
    const tagsHtml = dataset.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    const isOwner = currentUser && (dataset.creator._id === currentUser.id || currentUser.role === 'admin');
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // Normalize file path for Windows/Unix
    const downloadUrl = dataset.filePath ? `http://localhost:5000/${dataset.filePath.replace(/\\/g, '/')}` : '#';

    card.innerHTML = `
      <span class="size-badge">${dataset.size}</span>
      <h3>${dataset.title}</h3>
      <p>${dataset.description}</p>
      <div class="tags">${tagsHtml}</div>
      <span class="creator-info">Created by: ${dataset.creator.username}</span>
      <div class="dataset-actions">
        ${dataset.filePath ? `<a href="${downloadUrl}" class="btn btn-primary" target="_blank" download="${dataset.fileName}">Download</a>` : ''}
        ${isOwner ? `<button class="btn btn-outline edit-btn" data-id="${dataset._id}">Edit</button>` : ''}
        ${isAdmin ? `<button class="btn btn-danger delete-btn" data-id="${dataset._id}">Delete</button>` : ''}
      </div>
    `;
    datasetsGrid.appendChild(card);
  });

  // Attach event listeners for edit/delete
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openModal(datasets.find(d => d._id === e.target.dataset.id)));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteDataset(e.target.dataset.id));
  });
}

// Modal Logic
addDatasetBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);

function openModal(dataset = null) {
  datasetModal.classList.remove('hidden');
  if (dataset) {
    modalTitle.textContent = 'Edit Dataset';
    document.getElementById('dataset-id').value = dataset._id;
    document.getElementById('dataset-title').value = dataset.title;
    document.getElementById('dataset-description').value = dataset.description;
    document.getElementById('dataset-tags').value = dataset.tags.join(', ');
  } else {
    modalTitle.textContent = 'Add Dataset';
    datasetForm.reset();
    document.getElementById('dataset-id').value = '';
  }
}

function closeModal() {
  datasetModal.classList.add('hidden');
}

datasetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('dataset-id').value;
  
  const formData = new FormData();
  formData.append('title', document.getElementById('dataset-title').value);
  formData.append('description', document.getElementById('dataset-description').value);
  formData.append('tags', document.getElementById('dataset-tags').value);
  
  const fileInput = document.getElementById('dataset-file');
  if (fileInput.files[0]) {
    formData.append('file', fileInput.files[0]);
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/datasets/${id}` : `${API_URL}/datasets`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to save dataset');
    }
    
    closeModal();
    fetchDatasets();
  } catch (err) {
    alert(err.message);
  }
});

async function deleteDataset(id) {
  if (!confirm('Are you sure you want to delete this dataset?')) return;
  
  try {
    const res = await fetch(`${API_URL}/datasets/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Failed to delete dataset');
    fetchDatasets();
  } catch (err) {
    alert(err.message);
  }
}

// Admin Logic (Users)
async function fetchUsers() {
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    console.error('Failed to fetch users', err);
  }
}

function renderUsers(users) {
  usersTableBody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.username}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger delete-user-btn" data-id="${user._id}">Remove User</button>
      </td>
    `;
    usersTableBody.appendChild(tr);
  });

  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteUser(e.target.dataset.id));
  });
}

async function deleteUser(id) {
  if (!confirm('Are you sure? This will delete the user and ALL their datasets.')) return;
  
  try {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Failed to delete user');
    fetchUsers();
    fetchDatasets(); // Refresh datasets since user's datasets were removed
  } catch (err) {
    alert(err.message);
  }
}

// Kickoff
init();
