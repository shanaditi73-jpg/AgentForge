import axios from 'axios';
import { Run } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function getRuns(): Promise<Run[]> {
  const response = await axios.get(`${BASE_URL}/runs`);
  return response.data;
}

export async function getRun(id: number): Promise<Run> {
  const response = await axios.get(`${BASE_URL}/runs/${id}`);
  return response.data;
}

export async function submitTask(task: string) {
  const response = await axios.post(`${BASE_URL}/run`, { task });
  return response.data;
}

export function getWebSocketUrl() {
  return `ws://127.0.0.1:8000/ws/run`;
}
