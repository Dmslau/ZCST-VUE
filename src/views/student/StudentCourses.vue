<template>
  <div class="app-container">
    <div class="filter-container">
            <el-input
              v-model="searchQuery"
        placeholder="搜索课程"
        style="width: 200px;"
        class="filter-item"
      />
      <el-button type="primary" class="filter-item">
        搜索
      </el-button>
        </div>

    <el-table
      :data="courseList"
      style="width: 100%"
      border
      height="calc(100vh - 280px)"
      :header-cell-style="{ background: '#f5f7fa' }"
    >
      <el-table-column prop="courseId" label="课程编号" width="100" />
      <el-table-column prop="courseName" label="课程名称" width="180" />
      <el-table-column prop="courseDescription" label="课程描述" min-width="200" />
      <el-table-column label="授课教师" width="120">
        <template #default="scope">
          {{ scope.row.teacher.username }}
          </template>
        </el-table-column>
      <el-table-column label="教师所属" width="150">
        <template #default="scope">
          {{ scope.row.teacher.college }}
          </template>
        </el-table-column>
      <el-table-column label="起止时间" width="300">
        <template #default="scope">
          {{ formatDate(scope.row.startTime) }} 至 {{ formatDate(scope.row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
              <el-button 
            type="primary"
                size="small" 
            @click="handleViewDetail(scope.row)"
              >
            查看详情
              </el-button>
          </template>
        </el-table-column>
      </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

export default {
  name: 'StudentCourses',
  setup() {
    const router = useRouter()
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const courseList = ref([])

    const loadCourses = async () => {
      try {
        const userStr = Cookies.get('user') || localStorage.getItem('user')
        const user = JSON.parse(userStr)
        const response = await axios.get(`/api/courses/student/${user.userId}`)
        courseList.value = response.data
      } catch (error) {
        console.error('获取课程列表失败：', error)
        ElMessage.error('获取课程列表失败')
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      return dateStr.replace(' 00:00:00', '')
    }

    const handleViewDetail = (row) => {
      router.push(`/student/courses/${row.courseId}`)
    }

    onMounted(() => {
      loadCourses()
    })

    return {
      searchQuery,
      currentPage,
      pageSize,
      total,
      courseList,
      handleViewDetail,
      formatDate
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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
</style> 