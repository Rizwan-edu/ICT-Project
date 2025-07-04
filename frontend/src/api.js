const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Auth API
export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

export const signup = async (name, email, password) => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return res.json();
};

// Jobs API
export const getJobs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_URL}/jobs?${params}`);
  return res.json();
};

export const createJob = async (jobData) => {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(jobData)
  });
  return res.json();
};

export const updateJob = async (id, jobData) => {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(jobData)
  });
  return res.json();
};

export const deleteJob = async (id) => {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return res.json();
};

export const applyForJob = async (jobId) => {
  const res = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return res.json();
};

// Applications API
export const getMyApplications = async () => {
  const res = await fetch(`${API_URL}/applications/my`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const getAllApplications = async () => {
  const res = await fetch(`${API_URL}/applications`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const importJobs = async (jobsData) => {
  const res = await fetch(`${API_URL}/jobs/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ jobsData })
  });
  return res.json();
};

export const updateApplicationStatus = async (id, status) => {
  const res = await fetch(`${API_URL}/applications/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  return res.json();
};

// Profile API
export const getProfile = async () => {
  const res = await fetch(`${API_URL}/profile`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const updateProfile = async (profileData) => {
  const res = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
  return res.json();
};

export const searchJobs = async (searchTerm, filters = {}) => {
  const params = new URLSearchParams({ search: searchTerm, ...filters });
  const res = await fetch(`${API_URL}/jobs?${params}`);
  return res.json();
};