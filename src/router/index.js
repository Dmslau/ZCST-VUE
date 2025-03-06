import { createRouter, createWebHistory } from 'vue-router'
import Cookies from 'js-cookie'
import LoginPage from '../views/LoginPage.vue'
import { ElMessage } from 'element-plus'
import SubmitAssignment from '../views/student/SubmitAssignment.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',  // 默认子路由
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),  // 所有用户都用这个仪表盘
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        meta: { 
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'notices',
        name: 'NoticeCenter',
        component: () => import('../views/NoticeCenter.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'data',
        name: 'DataManagement',
        component: () => import('../views/DataManagement.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/UserProfile.vue'),
        meta: { requiresAuth: true }
      },
      // 教师和学生共用的路由
      {
        path: 'courses',
        name: 'CourseManagement',
        component: () => import('../views/teacher/TeacherCourses.vue'),
        meta: { 
          requiresAuth: true,
        }
      },
      {
        path: 'courses/:courseId',
        component: () => import('../views/teacher/CourseDetail.vue'),
        meta: { requiresAuth: true },
        props: true,
        children: [
          {
            path: '',  // 默认路由
            name: 'CourseDetail',
            component: () => import('../views/teacher/components/CourseOverview.vue'),
          },
          {
            path: 'similarity-check',
            name: 'SimilarityCheck',
            component: () => import('../views/teacher/AssignmentSimilarityCheck.vue'),
            meta: { 
              requiresAuth: true,
              roles: ['teacher']
            },
            props: true
          }
        ]
      },
      // 学生相关路由
      {
        path: 'student',
        children: [
          {
            path: 'courses',
            name: 'StudentCourses',
            component: () => import('../views/student/StudentCourses.vue'),
            meta: { requiresAuth: true, roles: ['student'] }
          },
          {
            path: 'assignments',
            name: 'StudentAssignments',
            component: () => import('../views/student/StudentAssignments.vue'),
            meta: { requiresAuth: true, roles: ['student'] }
          },
          {
            path: 'courses/:courseId',
            name: 'StudentCourseDetail',
            component: () => import('../views/student/StudentCourseDetail.vue'),
            meta: { 
              requiresAuth: true, 
              roles: ['student'],
              noCache: true
            },
            props: true
          },
          {
            path: 'assignments/:assignmentId/submit',
            component: SubmitAssignment,
            meta: { 
              requiresAuth: true, 
              roles: ['student'],
              noCache: true
            }
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guest: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 修改路由守卫
router.beforeEach((to, from, next) => {
  const token = Cookies.get('token') || localStorage.getItem('token')
  const userStr = Cookies.get('user') || localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  
  if (to.meta.requiresAuth && !token) {
    // 需要认证但未登录
    next('/login')
  } else if (to.meta.guest && token) {
    // 已登录用户不能访问游客页面
    next('/')
  } else if (to.meta.requiresAdmin && (!user || user.role !== 'ADMIN')) {
    // 需要管理员权限但用户不是管理员
    ElMessage.error('需要管理员权限')
    next('/')
  } else {
    // 处理课程管理路由
    if (to.path === '/courses') {
      if (user && user.role === 'STUDENT') {
        next('/student/courses')
      } else if (user && user.role === 'TEACHER') {
        next()
      } else {
        ElMessage.error('无访问权限')
        next('/')
      }
    } else {
      next()
    }
  }
})

export default router 