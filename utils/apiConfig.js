export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER_JOURNALIST: '/auth/register/journalist',
    REGISTER_COMMS: '/auth/register/comms',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/me'
  },
  JOURNALIST: {
    PRESS_RELEASES: '/journalist/press-releases',
    DASHBOARD: '/journalist/dashboard',
    PROFILE: '/journalist/profile'
  },
  COMMS: {
    DASHBOARD: '/comms/dashboard',
    PROFILE: '/comms/profile'
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
    WHISTLEBLOWER_MESSAGES: '/admin/whistleblower-messages',
    JOURNALISTS_PENDING: '/admin/journalists/pending',
    PRESS_RELEASES: '/admin/press-releases'
  },
  BLOG: {
    POSTS: '/blog/posts',
    POST: '/blog/posts', // For single post: /blog/posts/:id
    COMMENTS: '/blog/posts', // For comments: /blog/posts/:id/comments
    LIKE_POST: '/blog/posts', // For liking: /blog/posts/:id/like
    LIKE_COMMENT: '/blog/comments', // For liking comment: /blog/comments/:id/like
    SHARE_POST: '/blog/posts', // For sharing: /blog/posts/:id/share
    REPORT_POST: '/blog/posts' // For reporting: /blog/posts/:id/report
  }
};

// Enhanced API call function with better error handling
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Blog service using your API endpoints
export const blogService = {
  // Get all blog posts
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}?${queryString}`);
  },

  // Get single blog post
  getPost: (id) => {
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}/${id}`);
  },

  // Get comments for a post
  getComments: (postId) => {
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}/${postId}/comments`);
  },

  // Add comment
  addComment: (postId, content, parentComment = null) => {
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}/${postId}/comments`, {
      method: 'POST',
      body: { content, parentComment }
    });
  },

  // Like/unlike post
  likePost: (postId) => {
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}/${postId}/like`, {
      method: 'POST'
    });
  },

  // Like/unlike comment
  likeComment: (commentId) => {
    return apiCall(`${API_ENDPOINTS.BLOG.LIKE_COMMENT}/${commentId}/like`, {
      method: 'POST'
    });
  },

  // Share post
  sharePost: (postId) => {
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}/${postId}/share`, {
      method: 'POST'
    });
  },

  // Report post
  reportPost: (postId, reason, details) => {
    return apiCall(`${API_ENDPOINTS.BLOG.POSTS}/${postId}/report`, {
      method: 'POST',
      body: { reason, details }
    });
  }
};

// Admin service
export const adminService = {
  getAnalytics: () => apiCall(API_ENDPOINTS.ADMIN.ANALYTICS),
  getWhistleblowerMessages: () => apiCall(API_ENDPOINTS.ADMIN.WHISTLEBLOWER_MESSAGES),
  getPendingJournalists: () => apiCall(API_ENDPOINTS.ADMIN.JOURNALISTS_PENDING),
  getPressReleases: () => apiCall(API_ENDPOINTS.ADMIN.PRESS_RELEASES),
  approveJournalist: (id) => apiCall(`${API_ENDPOINTS.ADMIN.JOURNALISTS_PENDING}/${id}/approve`, { method: 'PUT' }),
  rejectJournalist: (id) => apiCall(`${API_ENDPOINTS.ADMIN.JOURNALISTS_PENDING}/${id}/reject`, { method: 'PUT' })
};

// Auth service
export const authService = {
  login: (credentials) => apiCall(API_ENDPOINTS.AUTH.LOGIN, { method: 'POST', body: credentials }),
  registerJournalist: (data) => apiCall(API_ENDPOINTS.AUTH.REGISTER_JOURNALIST, { method: 'POST', body: data }),
  registerComms: (data) => apiCall(API_ENDPOINTS.AUTH.REGISTER_COMMS, { method: 'POST', body: data }),
  getMe: () => apiCall(API_ENDPOINTS.AUTH.ME),
  verifyEmail: (token) => apiCall(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { method: 'POST', body: { token } })
};