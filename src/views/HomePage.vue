<template>
  <div class="home-container">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header height="60px">
        <div class="header-content">
          <!-- 左侧 Logo 和标题 -->
          <div class="header-left">
            <h2>作业管理系统</h2>
          </div>
          
          <!-- 中间导航菜单 -->
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            router
            class="header-menu"
            background-color="#fff"
            text-color="#333"
            active-text-color="#409EFF">
            <template v-if="isAdmin">
              <!-- 管理员菜单 -->
              <el-menu-item index="/">
                <el-icon><HomeFilled /></el-icon>
                <span>系统状态</span>
              </el-menu-item>
              <el-menu-item index="/users">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
              <el-menu-item index="/notices">
                <el-icon><Bell /></el-icon>
                <span>公告通知</span>
              </el-menu-item>
              <el-menu-item index="/data">
                <el-icon><DataLine /></el-icon>
                <span>数据管理</span>
              </el-menu-item>
            </template>
            <template v-else-if="isTeacher">
              <!-- 教师菜单 -->
              <el-menu-item index="/">
                <el-icon><HomeFilled /></el-icon>
                <span>首页</span>
              </el-menu-item>
              <el-menu-item index="/courses">
                <el-icon><Reading /></el-icon>
                <span>课程管理</span>
              </el-menu-item>
              <el-menu-item index="/notices">
                <el-icon><Bell /></el-icon>
                <span>通知中心</span>
              </el-menu-item>
            </template>
            <template v-else>
              <!-- 学生菜单 -->
              <el-menu-item index="/">
                <el-icon><HomeFilled /></el-icon>
                <span>首页</span>
              </el-menu-item>
              <el-menu-item index="/student/courses">
                <el-icon><Reading /></el-icon>
                <span>我的课程</span>
              </el-menu-item>
              <el-menu-item index="/student/assignments">
                <el-icon><List /></el-icon>
                <span>我的作业</span>
              </el-menu-item>
              <el-menu-item index="/notices">
                <el-icon><Bell /></el-icon>
                <span>通知公告</span>
              </el-menu-item>
            </template>
          </el-menu>

          <!-- 右侧用户信息 -->
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                {{ userInfo.username }}
                <el-tag size="small" :type="userInfo.role === 'ADMIN' ? 'danger' : userInfo.role === 'TEACHER' ? 'warning' : 'success'" class="role-tag">
                  {{ userInfo.role === 'ADMIN' ? '管理员' : userInfo.role === 'TEACHER' ? '教师' : '普通用户' }}
                </el-tag>
                <el-icon><CaretBottom /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主要内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive :exclude="['StudentCourseDetail']">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Cookies from 'js-cookie'
import { 
  HomeFilled, 
  Reading, 
  Bell, 
  CaretBottom,
  User,
  DataLine,
  List
} from '@element-plus/icons-vue'

export default {
  name: 'HomePage',
  components: {
    HomeFilled,
    Reading,
    Bell,
    CaretBottom,
    User,
    DataLine,
    List
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userInfo = ref({})

    // 计算属性：判断是否为管理员
    const isAdmin = computed(() => userInfo.value.role === 'ADMIN')
    // 计算教师角色判断
    const isTeacher = computed(() => userInfo.value.role === 'TEACHER')
    // 计算当前激活的菜单项
    const activeMenu = computed(() => route.path)

    onMounted(() => {
      const userStr = Cookies.get('user') || localStorage.getItem('user')
      if (userStr) {
        userInfo.value = JSON.parse(userStr)
      }
    })

    const handleCommand = (command) => {
      if (command === 'logout') {
        // 清除所有认证信息
        Cookies.remove('token')
        Cookies.remove('user')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else if (command === 'profile') {
        // 跳转到个人信息页面
        router.push('/profile')
      }
      // 其他命令的处理可以在这里添加
    }

    return {
      userInfo,
      isAdmin,
      isTeacher,
      handleCommand,
      activeMenu
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.el-container {
  min-height: 100vh;
}

.el-header {
  background-color: #fff;
  padding: 0;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  position: fixed;
  width: 100%;
  z-index: 1000;
}

.header-content {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  min-width: 200px;
}

.header-left h2 {
  margin: 0;
  color: #001529;
}

.header-menu {
  flex: 1;
  justify-content: center;
  border-bottom: none;
}

.header-right {
  min-width: 200px;
  display: flex;
  justify-content: flex-end;
}

.role-tag {
  margin: 0 8px;
}

.user-dropdown {
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.main-content {
  padding-top: 80px; /* 给固定头部留出空间 */
  padding-bottom: 20px;
  height: auto;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

/* 菜单项样式 */
.el-menu-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.el-menu-item .el-icon {
  margin-right: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-left h2 {
    font-size: 16px;
  }

  .header-menu {
    padding: 0 10px;
  }

  .el-menu-item {
    padding: 0 10px;
  }
}
</style> 