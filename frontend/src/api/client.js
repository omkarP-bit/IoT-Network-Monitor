import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

export const getDevices  = (active = false) => api.get(`/devices?active=${active}`).then(r => r.data);
export const getDevice   = (mac)            => api.get(`/devices/${mac}`).then(r => r.data);
export const getAlerts   = ()               => api.get('/alerts').then(r => r.data);
export const resolveAlert= (id)             => api.patch(`/alerts/${id}/resolve`).then(r => r.data);
export const whitelistDevice = (mac)        => api.patch(`/devices/${mac}/whitelist`).then(r => r.data);