import api from './client'
import { studentApi } from './student'

function resolveClient(mode) {
  return mode === 'student' ? studentApi : api
}

export const getChatContext = (mode = 'admin') =>
  resolveClient(mode).get('/api/chat/context').then((r) => r.data)

export const sendChatMessage = ({ mode = 'admin', message, history = [] }) =>
  resolveClient(mode)
    .post('/api/chat/message', { mode, message, history })
    .then((r) => r.data)
