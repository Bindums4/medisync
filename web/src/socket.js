import { io } from 'socket.io-client';
import { API_URL } from './api';
let socket = null;
export const getSocket = () => {
  if (!socket) socket = io(API_URL, { auth: { token: localStorage.getItem('medisync_token') } });
  return socket;
};
export const resetSocket = () => { socket?.disconnect(); socket = null; };
