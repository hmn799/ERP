import axios from "axios";

const client = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001/api",

  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
  },
});

export default client;