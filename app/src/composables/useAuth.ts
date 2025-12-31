import { ref, readonly } from 'vue'
import type { User } from '../types'

const currentUser = ref<User | null>(null)

export function useAuth() {
  const setUser = (user: User) => {
    currentUser.value = user
  }

  const clearUser = () => {
    currentUser.value = null
  }

  const isLoggedIn = () => {
    return currentUser.value !== null
  }

  const isAdmin = () => {
    return currentUser.value?.role === 'admin'
  }

  return {
    user: readonly(currentUser),
    setUser,
    clearUser,
    isLoggedIn,
    isAdmin,
  }
}
