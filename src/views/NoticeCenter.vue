<template>
  <div class="notices-container">
    <!-- 顶部操作区 -->
    <div class="header-actions">
      <el-button-group>
        <el-button type="primary" @click="handlePublishNotice">
          <el-icon><Bell /></el-icon>
          {{ isAdmin ? '发布全局公告' : '发布课程通知' }}
        </el-button>
        <el-button type="success" @click="handleSendMessage">
          <el-icon><Message /></el-icon>
          发送私信
        </el-button>
      </el-button-group>
      
      <div class="filter-actions">
        <el-radio-group v-model="noticeType" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="global" v-if="isAdmin">全局公告</el-radio-button>
          <el-radio-button label="course">课程通知</el-radio-button>
          <el-radio-button label="private">私信通知</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 通知列表 -->
    <el-table 
      :data="filteredNotices" 
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column type="expand">
        <template #default="props">
          <div class="notice-detail">
            <div class="notice-content" v-html="props.row.content"></div>
            <div class="notice-meta">
              <span>发布时间：{{ formatDateTime(props.row.createTime) }}</span>
              <span v-if="props.row.type === 'course'">
                关联课程：{{ props.row.courseName }}
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getNoticeTypeTag(row.type)">
            {{ getNoticeTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="title" label="标题" min-width="200" />
      
      <el-table-column prop="receiver" label="接收者" width="150">
        <template #default="{ row }">
          <span v-if="row.type === 'private'">{{ row.receiver }}</span>
          <span v-else>全体{{ row.type === 'global' ? '用户' : '学生' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button 
              type="primary" 
              link
              @click="handleEdit(row)"
              :disabled="!canEdit(row)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 发布通知对话框 -->
    <el-dialog
      :title="getDialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form 
        :model="noticeForm" 
        :rules="rules" 
        ref="noticeFormRef"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="noticeForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item 
          v-if="dialogType === 'course'"
          label="关联课程" 
          prop="courseId"
        >
          <el-select 
            v-model="noticeForm.courseId" 
            placeholder="请选择课程"
            style="width: 100%"
          >
            <el-option 
              v-for="course in teacherCourses" 
              :key="course.courseId"
              :label="course.courseName"
              :value="course.courseId"
            />
          </el-select>
        </el-form-item>

        <el-form-item 
          v-if="dialogType === 'private'"
          label="接收者" 
          prop="receiverId"
        >
          <el-select
            v-model="noticeForm.receiverId"
            filterable
            remote
            placeholder="请输入学号搜索"
            :remote-method="handleSearch"
            :loading="searching"
            style="width: 100%"
          >
            <el-option
              v-for="student in studentOptions"
              :key="student.userId"
              :label="student.username"
              :value="student.userId"
            >
              <span>{{ student.username }}</span>
              <span class="student-id">{{ student.userId }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="noticeForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入通知内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitNotice" :loading="submitting">
            发布
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { Bell, Message } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Cookies from 'js-cookie'

export default {
  name: 'NoticeCenter',
  components: {
    Bell,
    Message
  },
  setup() {
    // 状态变量
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('course') // global, course 或 private
    const submitting = ref(false)
    const searching = ref(false)
    const noticeType = ref('all')

    // 获取用户角色
    const userInfo = JSON.parse(Cookies.get('user') || localStorage.getItem('user') || '{}')
    const isAdmin = computed(() => userInfo.role === 'ADMIN')

    // 模拟数据
    const notices = ref([
      {
        id: 1,
        type: 'global',
        title: '系统维护通知',
        content: '系统将于本周六凌晨2点进行例行维护，预计维护时间2小时。',
        createTime: '2024-03-16 10:00:00',
        creatorId: 'admin1'
      },
      {
        id: 2,
        type: 'course',
        title: '关于数据结构课程作业延期的通知',
        content: '由于近期系统维护，数据结构课程的第三次作业提交截止时间延期至下周五。',
        courseName: '数据结构',
        courseId: 1,
        createTime: '2024-03-15 14:30:00',
        creatorId: 'teacher1'
      },
      {
        id: 3,
        type: 'private',
        title: '作业补交提醒',
        content: '你有一份作业未提交，请尽快完成。',
        receiver: '张三',
        receiverId: 'student1',
        createTime: '2024-03-14 16:20:00',
        creatorId: 'teacher1'
      }
    ])

    const teacherCourses = ref([
      { courseId: 1, courseName: '数据结构' },
      { courseId: 2, courseName: '计算机网络' }
    ])

    const studentOptions = ref([])

    // 表单相关
    const noticeFormRef = ref(null)
    const noticeForm = ref({
      title: '',
      content: '',
      courseId: '',
      receiverId: ''
    })

    const rules = {
      title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入内容', trigger: 'blur' }
      ],
      courseId: [
        { required: true, message: '请选择课程', trigger: 'change' }
      ],
      receiverId: [
        { required: true, message: '请选择接收者', trigger: 'change' }
      ]
    }

    // 计算属性
    const filteredNotices = computed(() => {
      if (noticeType.value === 'all') return notices.value
      return notices.value.filter(notice => notice.type === noticeType.value)
    })

    const getDialogTitle = computed(() => {
      const titles = {
        global: '发布全局公告',
        course: '发布课程通知',
        private: '发送私信'
      }
      return titles[dialogType.value]
    })

    // 方法
    const formatDateTime = (time) => {
      return new Date(time).toLocaleString()
    }

    const getNoticeTypeTag = (type) => {
      const tags = {
        global: 'danger',
        course: 'success',
        private: 'warning'
      }
      return tags[type]
    }

    const getNoticeTypeLabel = (type) => {
      const labels = {
        global: '全局公告',
        course: '课程通知',
        private: '私信通知'
      }
      return labels[type]
    }

    const canEdit = (notice) => {
      return new Date(notice.createTime).getTime() > Date.now() - 24 * 60 * 60 * 1000
    }

    const handlePublishNotice = () => {
      dialogType.value = isAdmin.value ? 'global' : 'course'
      noticeForm.value = {
        title: '',
        content: '',
        courseId: '',
        receiverId: ''
      }
      dialogVisible.value = true
    }

    const handleSendMessage = () => {
      dialogType.value = 'private'
      noticeForm.value = {
        title: '',
        content: '',
        courseId: '',
        receiverId: ''
      }
      dialogVisible.value = true
    }

    const handleSearch = async (query) => {
      if (query) {
        searching.value = true
        // 模拟搜索学生
        setTimeout(() => {
          studentOptions.value = [
            { userId: 'student1', username: '张三' },
            { userId: 'student2', username: '李四' }
          ]
          searching.value = false
        }, 500)
      } else {
        studentOptions.value = []
      }
    }

    const handleEdit = (row) => {
      noticeForm.value = { ...row }
      dialogType.value = row.type
      dialogVisible.value = true
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确定要删除这条通知吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        notices.value = notices.value.filter(notice => notice.id !== row.id)
        ElMessage.success('删除成功')
      })
    }

    const submitNotice = async () => {
      if (!noticeFormRef.value) return
      
      await noticeFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            // 模拟提交
            setTimeout(() => {
              const newNotice = {
                id: notices.value.length + 1,
                type: dialogType.value,
                title: noticeForm.value.title,
                content: noticeForm.value.content,
                createTime: new Date().toISOString(),
                creatorId: userInfo.userId
              }

              if (dialogType.value === 'course') {
                const course = teacherCourses.value.find(c => c.courseId === noticeForm.value.courseId)
                newNotice.courseId = course.courseId
                newNotice.courseName = course.courseName
              } else if (dialogType.value === 'private') {
                const student = studentOptions.value.find(s => s.userId === noticeForm.value.receiverId)
                newNotice.receiverId = student.userId
                newNotice.receiver = student.username
              }

              notices.value.unshift(newNotice)
              dialogVisible.value = false
              ElMessage.success('发布成功')
            }, 500)
          } finally {
            submitting.value = false
          }
        }
      })
    }

    // 移除未使用的 onMounted 引用
    // 或者如果你想在组件挂载时做一些初始化工作，可以这样使用:
    onMounted(() => {
      // 可以在这里加载初始数据
      loading.value = true
      try {
        // 模拟加载数据
        setTimeout(() => {
          // 数据已经在 notices.value 中预设了
          loading.value = false
        }, 500)
      } catch (error) {
        console.error('加载通知列表失败:', error)
        ElMessage.error('加载通知列表失败')
        loading.value = false
      }
    })

    return {
      loading,
      notices,
      noticeType,
      dialogVisible,
      dialogType,
      noticeForm,
      noticeFormRef,
      rules,
      teacherCourses,
      studentOptions,
      submitting,
      searching,
      isAdmin,
      filteredNotices,
      getDialogTitle,
      formatDateTime,
      getNoticeTypeTag,
      getNoticeTypeLabel,
      canEdit,
      handlePublishNotice,
      handleSendMessage,
      handleSearch,
      handleEdit,
      handleDelete,
      submitNotice
    }
  }
}
</script>

<style scoped>
.notices-container {
  padding: 20px;
}

.header-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.notice-detail {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.notice-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 16px;
}

.notice-meta {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 13px;
}

.student-id {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

:deep(.el-table__expand-column .el-table__expand-icon) {
  margin-right: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style> 