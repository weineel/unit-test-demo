import axios from 'axios'

const api = axios.create({
  // 正式开发需要通过环境变量设置
  baseURL: 'http://localhost:3030',
})

export type User = {
  id: number
  name: string
  age: number
  phone: string
  email: string
}

export async function getUsersByIds(ids: number[]): Promise<User[]> {
  if (ids.length) {
    return api.get('/user', {
      data: {
        ids,
      },
    }).then(e => e.data)
  } else {
    return []
  }
}

export async function getUserById(id: number): Promise<User> {
  return api.get(`/user/${id}`).then(e => e.data)
}
