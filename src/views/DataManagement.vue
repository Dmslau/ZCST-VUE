<template>
  <div class="data-container">
    <div class="header-container">
      <h2>数据管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport">导出数据</el-button>
        <el-button type="success" @click="handleImport">导入数据</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="data-tabs">
      <el-tab-pane label="用户数据" name="users">
        <el-table
          :data="userData"
          style="width: 100%"
          height="calc(100vh - 300px)"
          :header-cell-style="{ background: '#f5f7fa' }"
          v-loading="loading.users"
        >
          <el-table-column prop="userId" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="getTagType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLoginTime" label="最后登录时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="课程数据" name="courses">
        <el-table
          :data="courseData"
          style="width: 100%"
          height="calc(100vh - 300px)"
          :header-cell-style="{ background: '#f5f7fa' }"
          v-loading="loading.courses"
        >
          <el-table-column prop="courseId" label="ID" width="80" />
          <el-table-column prop="courseName" label="课程名称" min-width="150" />
          <el-table-column prop="teacherName" label="教师" width="120" />
          <el-table-column prop="studentCount" label="学生数" width="100" />
          <el-table-column prop="startTime" label="开始时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '进行中' : '已结束' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'DataManagement',
  setup() {
    const activeTab = ref('users')
    const loading = ref({
      users: true,
      courses: true
    })
    const userData = ref([])
    const courseData = ref([])

    const getTagType = (role) => {
      const types = {
        'ADMIN': 'danger',
        'TEACHER': 'warning',
        'STUDENT': 'success'
      }
      return types[role] || 'info'
    }

    const getRoleLabel = (role) => {
      const labels = {
        'ADMIN': '管理员',
        'TEACHER': '教师',
        'STUDENT': '学生'
      }
      return labels[role] || role
    }

    const handleExport = () => {
      ElMessage.success('导出功能开发中...')
    }

    const handleImport = () => {
      ElMessage.success('导入功能开发中...')
    }

    onMounted(() => {
      // 延迟加载数据
      setTimeout(() => {
        userData.value = []
        loading.value.users = false
      }, 100)

      setTimeout(() => {
        courseData.value = []
        loading.value.courses = false
      }, 200)
    })

    return {
      activeTab,
      loading,
      userData,
      courseData,
      getTagType,
      getRoleLabel,
      handleExport,
      handleImport
    }
  }
}
</script>

<style scoped>
.data-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-container h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.data-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}

/* 优化表格样式 */
:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

:deep(.el-table__header-wrapper) {
  background: #f5f7fa;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: #ddd;
  border-radius: 3px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f5f5f5;
}

/* 表格加载状态样式 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.7);
}
</style> 