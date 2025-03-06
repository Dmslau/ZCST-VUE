<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">课程管理</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索课程..."
              class="search-input"
              clearable
              @input="handleSearch"
            />
          </div>
          <el-button type="primary" @click="handleAdd">新建课程</el-button>
        </div>
      </template>
      
      <el-table :data="courses" v-loading="loading" style="width: 100%">
        <el-table-column prop="courseId" label="课程ID" width="80" />
        <el-table-column prop="courseName" label="课程名称" />
        <el-table-column prop="courseDescription" label="课程描述" show-overflow-tooltip />
        <el-table-column label="开课时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结课时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getCourseStatus(row) === 'active' ? 'success' : 'info'">
              {{ getCourseStatus(row) === 'active' ? '进行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleManage(row)">
                管理
              </el-button>
              <el-button size="small" type="primary" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑课程的对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '新建课程' : '编辑课程'"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="courseForm" :rules="rules" ref="courseFormRef" label-width="100px">
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="courseForm.courseName" />
        </el-form-item>
        <el-form-item label="课程描述" prop="courseDescription">
          <el-input type="textarea" v-model="courseForm.courseDescription" rows="3" />
        </el-form-item>
        <el-form-item label="开课时间" prop="startTime">
          <el-date-picker
            v-model="courseForm.startTime"
            type="datetime"
            placeholder="选择开课时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结课时间" prop="endTime">
          <el-date-picker
            v-model="courseForm.endTime"
            type="datetime"
            placeholder="选择结课时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
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
import { useRouter } from 'vue-router'

export default {
  name: 'TeacherCourses',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const courses = ref([])
    const searchQuery = ref('')
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const submitting = ref(false)
    const courseFormRef = ref(null)
    const courseForm = ref({
      courseName: '',
      courseDescription: '',
      startTime: null,
      endTime: null
    })

    const rules = {
      courseName: [
        { required: true, message: '请输入课程名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      courseDescription: [
        { required: true, message: '请输入课程描述', trigger: 'blur' }
      ]
    }

    // 修改获取课程列表的方法
    const fetchCourses = async () => {
      loading.value = true
      try {
        const response = await axios.get(`/api/courses/teacher/${userInfo.userId}`)
        courses.value = response.data
      } catch (error) {
        console.error('Error fetching courses:', error)
        ElMessage.error('获取课程列表失败')
        courses.value = []
      } finally {
        loading.value = false
      }
    }

    // 修改课程状态的判断
    const getCourseStatus = (course) => {
      if (!course.endTime) return 'active'
      return new Date(course.endTime).getTime() > Date.now() ? 'active' : 'ended'
    }

    // 搜索功能
    const handleSearch = () => {
      ElMessage.info('搜索功能开发中...')
    }

    // 新建课程
    const handleAdd = () => {
      dialogType.value = 'add'
      courseForm.value = {
        courseName: '',
        courseDescription: '',
        startTime: null,
        endTime: null
      }
      dialogVisible.value = true
    }

    // 编辑课程
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      courseForm.value = {
        ...row,
        startTime: row.startTime,
        endTime: row.endTime
      }
      dialogVisible.value = true
    }

    // 删除课程
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除课程 ${row.courseName} 吗？`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await axios.delete(`/api/courses/${row.courseId}`)
          if (response.status === 200) {
            ElMessage.success('删除成功')
            fetchCourses() // 刷新列表
          }
        } catch (error) {
          ElMessage.error('删除失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    }

    // 修改管理课程方法
    const handleManage = (row) => {
      router.push({
        name: 'CourseDetail',
        params: { courseId: row.courseId }
      })
    }

    // 提交表单
    const submitForm = async () => {
      if (!courseFormRef.value) return
      
      await courseFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            const data = {
              ...courseForm.value,
              teacher: { userId: userInfo.userId }
            }
            
            let response
            if (dialogType.value === 'add') {
              // 创建课程使用 /api/courses
              response = await axios.post('/api/courses', data)
            } else {
              // 更新课程使用 /api/courses/{courseId}
              response = await axios.put(`/api/courses/${courseForm.value.courseId}`, data)
            }
            
            if (response.status === 200) {
              ElMessage.success(dialogType.value === 'add' ? '课程创建成功' : '课程更新成功')
              dialogVisible.value = false
              fetchCourses()
            }
          } catch (error) {
            console.error('Error submitting form:', error)
            ElMessage.error(dialogType.value === 'add' ? '课程创建失败' : '课程更新失败')
          } finally {
            submitting.value = false
          }
        }
      })
    }

    const formatDateTime = (time) => {
      if (!time) return '未设置'
      return new Date(time).toLocaleString()
    }

    onMounted(() => {
      fetchCourses()
    })

    return {
      loading,
      courses,
      searchQuery,
      handleSearch,
      handleAdd,
      handleEdit,
      handleDelete,
      handleManage,
      dialogVisible,
      dialogType,
      courseForm,
      courseFormRef,
      rules,
      submitting,
      submitForm,
      getCourseStatus,
      formatDateTime
    }
  }
}
</script>

<style scoped>
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
</style> 