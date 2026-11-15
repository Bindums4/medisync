import { io } from 'socket.io-client';
import { API_URL } from './config';
let socket = null;
export const connectSocket = (token) => { socket?.disconnect(); socket = io(API_URL, { auth: { token }, transports: ['websocket'] }); return socket; };
export const getSocket = () => socket;
export const closeSocket = () => { socket?.disconnect(); socket = null; };
