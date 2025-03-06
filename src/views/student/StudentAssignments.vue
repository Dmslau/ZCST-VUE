<template>
  <div class="assignments-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">我的作业</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索作业..."
              class="search-input"
              clearable
              @input="handleSearch"
            />
          </div>
        </div>
      </template>

      <el-table :data="filteredAssignments" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="作业标题" />
        <el-table-column prop="courseName" label="所属课程" width="150" />
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.publish_time) }}
          </template>
        </el-table-column>
        <el-table-column label="截止日期" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.deadline) }}
          </template>
        </el-table-column>
        <el-table-column label="提交设置" width="120">
          <template #default="{ row }">
            <el-tooltip 
              :content="row.settings.allowMultipleSubmissions ? '允许多次提交' : '仅允许提交一次'"
              placement="top"
            >
              <el-tag :type="row.settings.allowMultipleSubmissions ? 'success' : 'warning'" size="small">
                {{ row.settings.allowMultipleSubmissions ? '多次提交' : '单次提交' }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">{{ getStatusLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="100">
          <template #default="{ row }">
            <span v-if="row.grade">{{ row.grade }}</span>
            <el-tag v-else-if="row.submitted" type="info">待批改</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                size="small" 
                type="primary" 
                @click="handleView(row)"
                :disabled="!canViewAssignment(row)"
              >
                查看
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                @click="handleSubmit(row)"
                :disabled="(row.submitted && !row.settings.allowMultipleSubmissions) || isOverdue(row)"
                :title="getSubmitButtonTitle(row)"
              >
                {{ 
                  isOverdue(row) ? '已截止' : 
                  row.submitted ? '重新提交' : '提交' 
                }}
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'StudentAssignments',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const assignments = ref([])
    const searchQuery = ref('')

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusType = (assignment) => {
      if (assignment.submitted) {
        return assignment.grade ? 'success' : 'info'
      }
      if (isOverdue(assignment)) {
        return 'danger'
      }
      const deadline = new Date(assignment.deadline)
      const now = new Date()
      if (deadline - now < 24 * 60 * 60 * 1000) return 'warning'
      return 'info'
    }

    const getStatusLabel = (assignment) => {
      if (assignment.submitted) {
        return assignment.grade ? '已批改' : '已提交'
      }
      if (isOverdue(assignment)) {
        return '已截止'
      }
      return '未提交'
    }

    const isOverdue = (assignment) => {
      return new Date(assignment.deadline) < new Date()
    }

    const canViewAssignment = (assignment) => {
      const now = new Date()
      const publishTime = new Date(assignment.publish_time)
      return now >= publishTime
    }

    const loadAssignments = async () => {
      loading.value = true
      try {
        const currentUser = JSON.parse(localStorage.getItem('user'))
        if (!currentUser) {
          ElMessage.error('获取用户信息失败')
          return
        }

        const response = await axios.get(`/api/assignments/student/${currentUser.userId}`)
        
        assignments.value = response.data.filter(assignment => !assignment.isDeleted).map(assignment => ({
          ...assignment,
          questions: assignment.content ? JSON.parse(assignment.content).questions : [],
          courseName: assignment.course.courseName,
          settings: {
            assignmentType: assignment.settings?.assignmentType || 'individual',
            allowMultipleSubmissions: assignment.settings?.allowMultipleSubmissions || false,
            allowedAttachments: assignment.settings?.allowedAttachments || false,
            groupMemberLimit: assignment.settings?.groupMemberLimit || 4
          }
        }))

        console.log('过滤后的作业数据:', assignments.value)
      } catch (error) {
        console.error('获取作业列表失败:', error)
        ElMessage.error('获取作业列表失败')
      } finally {
        loading.value = false
      }
    }

    const filteredAssignments = computed(() => {
      const filtered = assignments.value.filter(assignment => {
        if (!searchQuery.value) return true
        return assignment.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
               assignment.courseName.toLowerCase().includes(searchQuery.value.toLowerCase())
      })
      console.log('当前过滤后的作业:', filtered)
      return filtered
    })

    const handleView = (row) => {
      router.push(`/student/assignments/${row.assignmentId}`)
    }

    const handleSubmit = (row) => {
      router.push(`/student/assignments/${row.assignmentId}/submit`)
    }

    const handleSearch = () => {
      // 直接使用 filteredAssignments 的计算属性，不需要重新加载
    }

    const getSubmitButtonTitle = (assignment) => {
      if (assignment.submitted && !assignment.settings.allowMultipleSubmissions) {
        return '该作业只允许提交一次'
      }
      if (isOverdue(assignment)) {
        return '作业已截止'
      }
      return assignment.submitted ? '重新提交作业' : '提交作业'
    }

    onMounted(() => {
      loadAssignments()
    })

    return {
      loading,
      assignments,
      searchQuery,
      filteredAssignments,
      formatDateTime,
      getStatusType,
      getStatusLabel,
      canViewAssignment,
      isOverdue,
      handleView,
      handleSubmit,
      handleSearch,
      getSubmitButtonTitle
    }
  }
}
</script>

<style scoped>
.assignments-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.search-input {
  width: 200px;
}

.el-button-group {
  display: flex;
  gap: 8px;
}
</style> 