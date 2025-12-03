// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }
    
    return headers;
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: { message: response.statusText } 
      }));
      throw new Error(error.error?.message || error.message || 'An error occurred');
    }
    return response.json();
  }

  // ==================== Authentication ====================
  
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await this.handleResponse(response);
    this.setToken(data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await fetch(`${this.baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      this.setToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ refreshToken }),
    });
    const data = await this.handleResponse(response);
    this.setToken(data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data;
  }

  // ==================== User Profile ====================
  
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/api/users/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateUserProfile(updates) {
    const response = await fetch(`${this.baseURL}/api/users/me`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  // ==================== Semesters ====================
  
  async getSemesters(year = null, includeClasses = true) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (includeClasses) params.append('includeClasses', 'true');
    
    const response = await fetch(
      `${this.baseURL}/api/semesters?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  async createSemester(semesterData) {
    const response = await fetch(`${this.baseURL}/api/semesters`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(semesterData),
    });
    return this.handleResponse(response);
  }

  async updateSemester(semesterId, semesterData) {
    const response = await fetch(`${this.baseURL}/api/semesters/${semesterId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(semesterData),
    });
    return this.handleResponse(response);
  }

  async deleteSemester(semesterId) {
    const response = await fetch(`${this.baseURL}/api/semesters/${semesterId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ==================== Classes ====================
  
  async createClass(semesterId, classData) {
    const response = await fetch(
      `${this.baseURL}/api/semesters/${semesterId}/classes`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(classData),
      }
    );
    return this.handleResponse(response);
  }

  async updateClass(semesterId, classId, classData) {
    const response = await fetch(
      `${this.baseURL}/api/semesters/${semesterId}/classes/${classId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(classData),
      }
    );
    return this.handleResponse(response);
  }

  async deleteClass(semesterId, classId) {
    const response = await fetch(
      `${this.baseURL}/api/semesters/${semesterId}/classes/${classId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // ==================== Professors ====================
  
  async getProfessors() {
    const response = await fetch(`${this.baseURL}/api/professors`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getProfessorData(schoolName, department, courseNumber, semesterCode, courseName, deptCode = null) {
    const courseData = {
      school_name: schoolName,
      department: department,
      course_number: courseNumber,
      semester_code: semesterCode,
      course_name: courseName,
      dept_code: deptCode,
    };

    return this.generateSchedule([courseData]);
  }

  async generateSchedule(courses) {
    const response = await fetch(`${this.baseURL}/generate-schedule`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(courses),
    });
    return this.handleResponse(response);
  }

  // ==================== Previous Classes ====================
  
  async getPreviousClasses() {
    const response = await fetch(`${this.baseURL}/api/previous-classes`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createPreviousClass(classData) {
    const response = await fetch(`${this.baseURL}/api/previous-classes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(classData),
    });
    return this.handleResponse(response);
  }

  async updatePreviousClass(courseId, classData) {
    const response = await fetch(
      `${this.baseURL}/api/previous-classes/${courseId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(classData),
      }
    );
    return this.handleResponse(response);
  }

  async deletePreviousClass(courseId) {
    const response = await fetch(
      `${this.baseURL}/api/previous-classes/${courseId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // ==================== Friends ====================
  
  async getFriends() {
    const response = await fetch(`${this.baseURL}/api/friends`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async searchFriends(query) {
    const response = await fetch(
      `${this.baseURL}/api/friends/search?query=${encodeURIComponent(query)}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  async removeFriend(friendId) {
    const response = await fetch(`${this.baseURL}/api/friends/${friendId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getFriendRequests() {
    const response = await fetch(`${this.baseURL}/api/friends/requests`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async sendFriendRequest(friendId, message = null) {
    const response = await fetch(`${this.baseURL}/api/friends/requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ friendId, message }),
    });
    return this.handleResponse(response);
  }

  async acceptFriendRequest(requestId) {
    const response = await fetch(
      `${this.baseURL}/api/friends/requests/${requestId}/accept`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async rejectFriendRequest(requestId) {
    const response = await fetch(
      `${this.baseURL}/api/friends/requests/${requestId}/reject`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async cancelFriendRequest(requestId) {
    const response = await fetch(
      `${this.baseURL}/api/friends/requests/${requestId}/cancel`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // ==================== Schedule Sharing ====================
  
  async getScheduleShares() {
    const response = await fetch(`${this.baseURL}/api/schedule/shares`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createScheduleShare(friendId, canView = true, canEdit = false, expiresInDays = null) {
    const response = await fetch(`${this.baseURL}/api/schedule/shares`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ friendId, canView, canEdit, expiresInDays }),
    });
    return this.handleResponse(response);
  }

  async deleteScheduleShare(shareId) {
    const response = await fetch(`${this.baseURL}/api/schedule/shares/${shareId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getSharedSchedules() {
    const response = await fetch(`${this.baseURL}/api/schedule/shared-with-me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ==================== File Uploads ====================
  
  async uploadFile(file, type, notes = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);

    const response = await fetch(`${this.baseURL}/api/uploads/${type}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getUploads(type = null) {
    const params = type ? `?type=${type}` : '';
    const response = await fetch(`${this.baseURL}/api/uploads${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteUpload(uploadId) {
    const response = await fetch(`${this.baseURL}/api/uploads/${uploadId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ==================== Metadata ====================
  
  async getSemesterSequence() {
    const response = await fetch(`${this.baseURL}/api/meta/semester-sequence`, {
      headers: this.getHeaders(false),
    });
    return this.handleResponse(response);
  }

  async getGradeScale() {
    const response = await fetch(`${this.baseURL}/api/meta/grade-scale`, {
      headers: this.getHeaders(false),
    });
    return this.handleResponse(response);
  }

  // ==================== PDF Extraction ====================
  
  async extractCoursesFromPDF(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/extract-courses`, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse(response);
  }

  // ==================== AI Agent Recommendations ====================
  
  async getAgentRecommendations(preferenceTags, courses) {
    const response = await fetch(`${this.baseURL}/api/agent/recommend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        preference_tags: preferenceTags,
        courses: courses,
      }),
    });
    return this.handleResponse(response);
  }
}

export default new ApiService();
