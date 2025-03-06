<template>
  <div class="course-detail-container">
    <!-- 头部区域 -->
    <div class="header-section">
      <div class="header-left">
        <el-button @click="goBack" text>
          <el-icon><ArrowLeft /></el-icon>
          返回课程列表
        </el-button>
        <h2>{{ course.courseName }}</h2>
      </div>
    </div>

    <!-- 课程信息区域 -->
    <div class="info-section">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="课程描述">{{ course.courseDescription }}</el-descriptions-item>
        <el-descriptions-item label="授课教师">{{ course.teacher?.username }}</el-descriptions-item>
        <el-descriptions-item label="开课时间">{{ formatDate(course.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结课时间">{{ formatDate(course.endTime) }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 作业列表区域 -->
    <div class="assignments-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span class="title">{{ course.courseName }} 的作业</span>
          </div>
        </template>

        <el-table :data="filteredAssignments" v-loading="loading" style="width: 100%">
          <el-table-column prop="title" label="作业标题" />
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
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button 
                size="small" 
                type="success"
                @click="goToSubmitPage(row)"
                :disabled="(row.submitted && !row.settings.allowMultipleSubmissions) || isOverdue(row)"
                :title="getSubmitButtonTitle(row)"
              >
                {{ 
                  isOverdue(row) ? '已截止' : 
                  row.submitted ? '重新提交' : '去提交' 
                }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 添加作业提交对话框 -->
    <el-dialog
      :title="currentAssignment ? currentAssignment.assignmentName : ''"
      v-model="dialogVisible"
      width="600px"
    >
      <div class="assignment-detail" v-if="currentAssignment">
        <div class="detail-item">
          <label>作业类型：</label>
          <span>{{ currentAssignment.assignmentType }}</span>
        </div>
        <div class="detail-item">
          <label>截止时间：</label>
          <span>{{ formatDate(currentAssignment.submitDeadline) }}</span>
        </div>
        <div class="detail-item">
          <label>作业要求：</label>
          <div class="description" v-html="formatDescription(currentAssignment.assignmentDescription)"></div>
        </div>
        <div class="submit-form" v-if="!isOverdue(currentAssignment)">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持 .zip, .doc, .docx, .pdf 格式文件
              </div>
            </template>
          </el-upload>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitAssignment"
            :disabled="!selectedFile || isOverdue(currentAssignment)"
          >
            提交作业
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import axios from 'axios'
import Cookies from 'js-cookie'

export default {
  name: 'StudentCourseDetail',
  components: {
    ArrowLeft
  },
  props: {
    courseId: {
      type: [String, Number],
      required: true
    },
    courseName: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const course = ref({})
    const assignments = ref([])
    const activeTab = ref('assignments')
    const loading = ref(false)
    const dialogVisible = ref(false)
    const currentAssignment = ref(null)
    const selectedFile = ref(null)
    const submissions = ref({})
    const userId = ref(null)
    const tableHeight = ref(500)

    const formatDate = (date) => {
      if (!date) return '未设置'
      return new Date(date).toLocaleString()
    }

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
      if (deadline - now < 24 * 60 * 60 * 1000) {
        return 'warning'
      }
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

    const loadCourseDetail = async () => {
      try {
        const response = await axios.get(`/api/courses/${props.courseId}`)
        course.value = response.data
      } catch (error) {
        ElMessage.error('获取课程信息失败')
      }
    }

    const loadAssignments = async () => {
      loading.value = true
      try {
        const response = await axios.get(`/api/assignments/course/${props.courseId}`)
        const currentUser = JSON.parse(localStorage.getItem('user'))
        const submissionsResponse = await axios.get(`/api/submissions/student/${currentUser.userId}`)
        const submissions = submissionsResponse.data
        
        assignments.value = response.data.filter(assignment => !assignment.isDeleted).map(assignment => ({
          ...assignment,
          questions: JSON.parse(assignment.content).questions,
          submitted: submissions.some(submission => 
            submission.assignment.assignmentId === assignment.assignmentId
          ),
          grade: submissions.find(submission => 
            submission.assignment.assignmentId === assignment.assignmentId
          )?.grade || null
        }))
        console.log('作业状态:', {
          assignments: assignments.value,
          submissions: submissions
        })
      } catch (error) {
        console.error('获取作业列表失败:', error)
        ElMessage.error('获取作业列表失败')
      } finally {
        loading.value = false
      }
    }

    const loadUserInfo = () => {
      const userStr = localStorage.getItem('user') || Cookies.get('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        userId.value = user.userId
      }
    }

    const loadSubmissions = async () => {
      if (!userId.value) return
      try {
        const response = await axios.get(`/api/submissions/student/${userId.value}`)
        submissions.value = response.data.reduce((acc, submission) => {
          acc[submission.assignment.assignmentId] = submission
          return acc
        }, {})
      } catch (error) {
        if (error.response?.status === 404) {
          submissions.value = {}
        } else {
          console.warn('获取提交记录失败:', error)
        }
      }
    }

    const formatDescription = (description) => {
      return description?.replace(/\n/g, '<br>') || ''
    }

    const isOverdue = (assignment) => {
      return new Date(assignment.deadline) < new Date()
    }

    const goToSubmitPage = (assignment) => {
      router.push(`/student/assignments/${assignment.assignmentId}/submit`)
    }

    const handleFileChange = (file) => {
      selectedFile.value = file
    }

    const submitAssignment = async () => {
      if (!selectedFile.value || !currentAssignment.value || !userId.value) return

      const formData = new FormData()
      formData.append('file', selectedFile.value.raw)
      
      try {
        await axios.post('/api/submissions', {
          assignment: {
            assignmentId: currentAssignment.value.assignmentId
          },
          student: {
            userId: userId.value
          },
          submitContent: selectedFile.value.name
        })

        ElMessage.success('作业提交成功')
        dialogVisible.value = false
        await loadSubmissions()
        await loadAssignments()
      } catch (error) {
        ElMessage.error('作业提交失败')
        console.error('提交失败:', error)
      }
    }

    const goBack = () => {
      router.push('/student/courses')
    }

    // 计算表格高度
    const updateTableHeight = () => {
      const windowHeight = window.innerHeight
      const headerHeight = 60 // 头部高度
      const infoHeight = 200 // 课程信息区域高度
      const tabsHeight = 40 // 标签页高度
      const padding = 80 // 上下内边距
      
      tableHeight.value = windowHeight - (headerHeight + infoHeight + tabsHeight + padding)
    }

    // 重置数据
    const resetData = () => {
      course.value = {}
      assignments.value = []
      submissions.value = {}
      currentAssignment.value = null
      selectedFile.value = null
      dialogVisible.value = false
    }

    // 加载所有数据
    const loadAllData = async () => {
      resetData()
      loading.value = true
      
      try {
        // 首先加载用户信息和课程详情
        loadUserInfo()
        await loadCourseDetail()

        // 然后并行加载作业列表和提交记录
        const loadPromises = [loadAssignments()]
        
        // 只有当用户ID存在时才加载提交记录
        if (userId.value) {
          loadPromises.push(
            axios.get(`/api/submissions/student/${userId.value}`)
              .then(response => {
                submissions.value = response.data.reduce((acc, submission) => {
                  acc[submission.assignment.assignmentId] = submission
                  return acc
                }, {})
              })
              .catch(error => {
                if (error.response?.status === 404) {
                  // 如果是404错误，说明没有提交记录，将submissions设为空对象
                  submissions.value = {}
                } else {
                  // 其他错误则打印日志，但不影响整体流程
                  console.warn('获取提交记录失败:', error)
                }
              })
          )
        }

        await Promise.all(loadPromises)
      } catch (error) {
        console.error('加载数据失败:', error)
        ElMessage.error('加载数据失败，请刷新页面重试')
      } finally {
        loading.value = false
      }
    }

    // 监听路由参数变化
    watch(
      () => route.params.courseId,
      (newId) => {
        if (newId) {
          loadAllData()
        }
      }
    )

    onMounted(() => {
      loadAllData()
      updateTableHeight()
      window.addEventListener('resize', updateTableHeight)
    })

    // 组件卸载时移除事件监听
    onUnmounted(() => {
      window.removeEventListener('resize', updateTableHeight)
    })

    const filteredAssignments = computed(() => {
      return assignments.value // 直接返回过滤后的作业
    })

    const getSubmitButtonTitle = (assignment) => {
      if (assignment.submitted && !assignment.settings.allowMultipleSubmissions) {
        return '该作业只允许提交一次'
      }
      if (isOverdue(assignment)) {
        return '作业已截止'
      }
      return assignment.submitted ? '重新提交作业' : '去提交'
    }

    return {
      course,
      assignments,
      activeTab,
      loading,
      formatDate,
      formatDateTime,
      getStatusType,
      getStatusLabel,
      isOverdue,
      goToSubmitPage,
      goBack,
      dialogVisible,
      currentAssignment,
      selectedFile,
      formatDescription,
      handleFileChange,
      submitAssignment,
      submissions,
      tableHeight,
      filteredAssignments,
      getSubmitButtonTitle
    }
  }
}
</script>

<style scoped>
.course-detail-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

.header-section {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.info-section {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.assignments-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-container {
  flex: 1;
  min-height: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.course-info {
  margin-bottom: 20px;
}

.course-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
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

.assignment-detail {
  padding: 20px;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  font-weight: bold;
  margin-right: 8px;
  color: #606266;
}

.description {
  margin-top: 8px;
  white-space: pre-line;
  color: #303133;
  line-height: 1.5;
}

.submit-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

:deep(.el-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

/* 优化表格在小屏幕上的显示 */
@media screen and (max-height: 768px) {
  .info-section {
    margin-bottom: 10px;
  }
  
  :deep(.el-descriptions) {
    margin-bottom: 10px;
  }
  
  .header-section {
    margin-bottom: 10px;
  }
}
</style> 