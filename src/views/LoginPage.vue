<template>
  <div class="login-container">
    <div class="login-box">
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="loginForm.username"
            required
            placeholder="请输入用户名"
          >
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="loginForm.password"
            required
            placeholder="请输入密码"
          >
        </div>
        <div v-if="showCaptcha" class="form-group captcha-group">
          <label for="captcha">验证码</label>
          <div class="captcha-input-wrapper">
            <input
              type="text"
              id="captcha"
              v-model="loginForm.captcha"
              required
              placeholder="请输入验证码"
              maxlength="4"
            >
            <div class="captcha-image" @click="refreshCaptcha">
              {{ captchaText }}
            </div>
          </div>
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const loginForm = ref({
      username: '',
      password: '',
      captcha: ''
    })
    const captchaText = ref('')
    const showCaptcha = ref(false)
    const loginFailCount = ref(0)

    // 生成随机验证码
    const generateCaptcha = () => {
      const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let result = ''
      for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      captchaText.value = result
    }

    // 刷新验证码
    const refreshCaptcha = () => {
      generateCaptcha()
      loginForm.value.captcha = ''
    }

    const handleLogin = async () => {
      if (showCaptcha.value) {
        if (!loginForm.value.captcha) {
          ElMessage.error('请输入验证码')
          return
        }
        if (loginForm.value.captcha.toUpperCase() !== captchaText.value) {
          ElMessage.error('验证码错误')
          refreshCaptcha()
          return
        }
      }

      try {
        loading.value = true
        const response = await axios.get('http://localhost:8080/api/users')
        
        const user = response.data.find(
          user => user.username === loginForm.value.username && 
                  user.password === loginForm.value.password
        )
        
        if (user) {
          loginFailCount.value = 0
          showCaptcha.value = false
          
          const token = 'dummy-token'
          Cookies.set('token', token, { expires: 7 })
          Cookies.set('user', JSON.stringify(user), { expires: 7 })
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          router.push('/')
        } else {
          loginFailCount.value++
          
          if (loginFailCount.value >= 3) {
            showCaptcha.value = true
            generateCaptcha()
          }
          
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error('登录失败，请稍后重试')
        
        loginFailCount.value++
        if (loginFailCount.value >= 3) {
          showCaptcha.value = true
          generateCaptcha()
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      generateCaptcha()
    })

    return {
      loginForm,
      loading,
      handleLogin,
      captchaText,
      showCaptcha,
      refreshCaptcha
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

button {
  width: 100%;
  padding: 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #40a9ff;
}

button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.captcha-group {
  margin-bottom: 16px;
}

.captcha-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-input-wrapper input {
  flex: 1;
}

.captcha-image {
  width: 100px;
  height: 40px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #333;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.captcha-image:hover {
  background-color: #e6e8eb;
}

.captcha-image:active {
  background-color: #dcdfe6;
}
</style> 