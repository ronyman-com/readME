// src/utils/helpers.js
import os from 'os';
import { exec } from 'child_process';
import { logError } from './logger.js';

export const getIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

export const openBrowser = (url) => {
  const opener = process.platform === 'win32' ? 'start' : 'open';
  exec(`${opener} ${url}`, (error) => {
    if (error) logError(`Could not open browser: ${error.message}`);
  });
};