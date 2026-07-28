import axios from "axios"

const baseURL = process.env.APP_URL
  ? `${process.env.APP_URL}/api`
  : "http://localhost:3000/api"

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})