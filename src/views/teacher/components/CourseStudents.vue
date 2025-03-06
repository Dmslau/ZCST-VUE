<template>
  <div>
    <div class="header-actions">
      <el-button type="primary" @click="handleAdd">添加学生</el-button>
      <el-button type="success" @click="handleImport">批量导入</el-button>
    </div>

    <el-table :data="students" v-loading="loading" style="width: 100%" :height="400" :header-cell-style="{ background: '#f5f7fa' }">
      <el-table-column prop="studentId" label="学号" width="120" />
      <el-table-column prop="username" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="college" label="学院" />
      <el-table-column prop="major" label="专业" />
      <el-table-column prop="className" label="班级" width="120" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleRemove(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加学生对话框 -->
    <el-dialog
      title="添加学生"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="searchForm" inline>
        <el-form-item label="学号">
          <el-input v-model="searchForm.studentId" placeholder="输入学号搜索" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchStudent" :loading="searching">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-if="searchResults.length > 0"
        :data="searchResults"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="username" label="姓名" width="120" />
        <el-table-column prop="className" label="班级" />
      </el-table>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="addStudents"
            :loading="submitting"
            :disabled="selectedStudents.length === 0"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'CourseStudents',
  props: {
    courseId: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const loading = ref(false)
    const students = ref([])
    const dialogVisible = ref(false)
    const searching = ref(false)
    const submitting = ref(false)
    const searchForm = ref({
      studentId: ''
    })
    const searchResults = ref([])
    const selectedStudents = ref([])

    const fetchStudents = async () => {
      loading.value = true
      try {
        // 使用正确的 API 路径
        const response = await axios.get(`/api/courses/${props.courseId}/students`)
        students.value = response.data.map(student => ({
          studentId: student.userId,
          username: student.username,
          email: student.email,
          college: student.college,
          major: student.major,
          className: student.className,
          role: student.role
        }))
      } catch (error) {
        console.error('Error fetching students:', error)
        ElMessage.error('获取学生列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleAdd = () => {
      searchResults.value = []
      selectedStudents.value = []
      dialogVisible.value = true
    }

    const handleImport = () => {
      ElMessage.info('批量导入功能开发中...')
    }

    const handleRemove = (row) => {
      ElMessageBox.confirm(
        `确定要将学生 ${row.username} 从课程中移除吗？`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 使用课程和学生ID来移除学生
          const response = await axios.delete(`/api/courses/${props.courseId}/students/${row.studentId}`)
          if (response.status === 200) {
            ElMessage.success('移除成功')
            fetchStudents()
          }
        } catch (error) {
          console.error('Error removing student:', error)
          ElMessage.error(error.response?.data?.message || '移除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    }

    const searchStudent = async () => {
      if (!searchForm.value.studentId) {
        ElMessage.warning('请输入学号')
        return
      }

      searching.value = true
      try {
        // 直接使用学号(userId)查询用户信息
        const response = await axios.get(`/api/users/${searchForm.value.studentId}`)
        // 因为是直接查询单个用户，所以需要将返回的单个用户对象转换为数组
        const student = response.data
        if (student && student.role === 'STUDENT') {
          searchResults.value = [{
            userId: student.userId,
            studentId: student.userId,
            username: student.username,
            className: student.className
          }]
        } else {
          searchResults.value = []
          ElMessage.warning('未找到该学号的学生')
        }
      } catch (error) {
        console.error('Error searching student:', error)
        if (error.response?.status === 404) {
          ElMessage.warning('未找到该学号的学生')
          searchResults.value = []
        } else {
          ElMessage.error('搜索失败')
        }
      } finally {
        searching.value = false
      }
    }

    const handleSelectionChange = (selection) => {
      selectedStudents.value = selection
    }

    const addStudents = async () => {
      submitting.value = true
      try {
        // 构建选课记录
        const enrollments = selectedStudents.value.map(student => ({
          courseId: props.courseId,
          studentId: student.userId
        }))

        // 批量添加选课记录
        const response = await axios.post('/api/enrollments/batch', enrollments)
        if (response.status === 200) {
          ElMessage.success('添加成功')
          dialogVisible.value = false
          fetchStudents()
        }
      } catch (error) {
        ElMessage.error('添加失败')
      } finally {
        submitting.value = false
      }
    }

    onMounted(() => {
      fetchStudents()
    })

    return {
      loading,
      students,
      dialogVisible,
      searchForm,
      searchResults,
      selectedStudents,
      searching,
      submitting,
      handleAdd,
      handleImport,
      handleRemove,
      searchStudent,
      handleSelectionChange,
      addStudents
    }
  }
}
</script>

<style scoped>
.header-actions {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.el-table {
  margin-top: 16px;
}

.el-table::before {
  height: 0;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: #ddd;
  border-radius: 3px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f5f5f5;
}
</style> 