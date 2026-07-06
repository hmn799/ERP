import client from "./client";

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized");
    }

    if (error.response?.status === 403) {
      console.warn("Forbidden");
    }

    if (error.response?.status >= 500) {
      console.error("Server Error");
    }

    return Promise.reject(error);
  },
);

export default client;