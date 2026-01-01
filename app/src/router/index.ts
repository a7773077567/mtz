import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SubmitView from '../views/SubmitView.vue'
import HistoryView from '../views/HistoryView.vue'
import AttendanceView from '../views/AttendanceView.vue'
import MyAttendanceView from '../views/MyAttendanceView.vue'
import AttendanceAdminView from '../views/AttendanceAdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/submit',
      name: 'submit',
      component: SubmitView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: AttendanceView,
    },
    {
      path: '/my-attendance',
      name: 'my-attendance',
      component: MyAttendanceView,
    },
    {
      path: '/attendance-admin',
      name: 'attendance-admin',
      component: AttendanceAdminView,
    },
  ],
})

export default router
