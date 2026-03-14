import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const environmentApi = axios.create({ baseURL: BASE })

export const getCurrentEnvironment = () =>
  environmentApi.get('/api/environment/current').then((r) => r.data)

export const getHourlyEnvironment = (hours = 24) =>
  environmentApi.get('/api/environment/hourly', { params: { hours } }).then((r) => r.data)

export const getDailyEnvironment = (days = 5) =>
  environmentApi.get('/api/environment/daily', { params: { days } }).then((r) => r.data)

export const getEnvironmentHistory = (range = '90d') =>
  environmentApi.get('/api/environment/history', { params: { range } }).then((r) => r.data)

export const getEnvironmentInsights = (scope = 'student') =>
  environmentApi.get('/api/environment/insights', { params: { scope } }).then((r) => r.data)

export const getEnvironmentLocation = () =>
  environmentApi.get('/api/environment/location').then((r) => r.data)
