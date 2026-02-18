import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/Intern/backend",
  withCredentials: true, //  REQUIRED FOR SESSIONS
});

export default api;
