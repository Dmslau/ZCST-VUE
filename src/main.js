import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 禁用所有 ResizeObserver 相关警告
const originalConsoleError = console.error
console.error = (...args) => {
  if (args.some(arg => 
    typeof arg === 'string' && arg.includes('ResizeObserver') ||
    arg?.message?.includes?.('ResizeObserver')
  )) return
  originalConsoleError.apply(console, args)
}

// 拦截 overlay 错误
window.addEventListener('error', (event) => {
  if (event.message?.includes('ResizeObserver')) {
    event.stopPropagation()
    event.preventDefault()
  }
}, true)

// Element Plus 配置
const elementPlusConfig = {
  size: 'default',
  zIndex: 3000,
  experimentalFeatures: {
    renderResizeObserver: false
  }
}

// 设置 axios 默认配置
axios.defaults.baseURL = 'http://localhost:8080'
axios.defaults.timeout = 15000  // 增加超时时间到 15 秒

// 创建 axios 重试拦截器
axios.interceptors.response.use(null, async (error) => {
  const config = error.config

  // 如果是超时错误，并且没有重试过
  if (error.code === 'ECONNABORTED' && error.message.includes('timeout') && !config._retry) {
    config._retry = true
    try {
      // 重试请求
      return await axios(config)
    } catch (retryError) {
      return Promise.reject(retryError)
    }
  }

  return Promise.reject(error)
})

// 请求拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    // 如果不是超时错误，才处理 401
    if (error.code !== 'ECONNABORTED' && error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

// 创建一个通用的请求函数
const request = async (config) => {
  try {
    const response = await axios(config)
    return response
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error(error.response?.data?.message || '请求失败')
    }
    throw error
  }
}

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  if (!err.message?.includes?.('ResizeObserver')) {
    console.error('Vue Error:', err, info)
  }
}

// 全局警告处理
app.config.warnHandler = (msg, vm, trace) => {
  if (!msg.includes('ResizeObserver')) {
    console.warn(msg, trace)
  }
}

// 将请求函数挂载到全局
app.config.globalProperties.$request = request

app.use(router)
app.use(ElementPlus, elementPlusConfig)
app.mount('#app')
