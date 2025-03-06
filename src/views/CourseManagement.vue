<template>
  <div class="course-container">
    <div class="header-container">
      <h2>课程管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索课程..."
          class="search-input"
          clearable
          @input="handleSearch"
        />
        <el-button type="primary" @click="handleAdd">新建课程</el-button>
      </div>
    </div>

    <el-table
      :data="courses"
      style="width: 100%"
      height="calc(100vh - 240px)"
      :header-cell-style="{ background: '#f5f7fa' }"
      v-loading="loading"
    >
      <el-table-column prop="courseId" label="课程编号" width="100" />
      <el-table-column prop="courseName" label="课程名称" min-width="150" />
      <el-table-column prop="courseDescription" label="课程描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="开课时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column label="结课时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

export default {
  name: 'CourseManagement',
  components: {
    Delete,
    Plus
  },
  setup() {
    const loading = ref(true)
    const courses = ref([])
    const searchQuery = ref('')

    const formatDate = (date) => {
      if (!date) return '未设置'
      return new Date(date).toLocaleDateString()
    }

    const handleSearch = () => {
      ElMessage.info('搜索功能开发中...')
    }

    const handleAdd = () => {
      ElMessage.info('新建课程功能开发中...')
    }

    const handleView = (row) => {
      ElMessage.info(`查看课程: ${row.courseName}`)
    }

    const handleEdit = (row) => {
      ElMessage.info(`编辑课程: ${row.courseName}`)
    }

    const handleDelete = (row) => {
      ElMessage.info(`删除课程: ${row.courseName}`)
    }

    const handleDialogOpen = () => {
      nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    }

    onMounted(() => {
      setTimeout(() => {
        courses.value = []
        loading.value = false
      }, 100)
    })

    return {
      loading,
      courses,
      searchQuery,
      formatDate,
      handleSearch,
      handleAdd,
      handleView,
      handleEdit,
      handleDelete,
      handleDialogOpen
    }
  }
}
</script>

<style scoped>
.course-container {
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

.search-input {
  width: 200px;
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

.el-button-group {
  display: flex;
  gap: 4px;
}
</style> 