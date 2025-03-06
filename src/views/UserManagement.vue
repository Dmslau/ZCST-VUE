<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">用户管理</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户..."
              class="search-input"
              clearable
              @input="handleSearch"
            />
          </div>
          <el-button type="primary" @click="handleAdd">添加用户</el-button>
        </div>
      </template>
      
      <el-table :data="users" style="width: 100%" v-loading="loading" height="500">
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="college" label="学院" />
        <el-table-column prop="major" label="专业" />
        <el-table-column prop="className" label="班级" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : row.role === 'TEACHER' ? 'warning' : 'success'">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isDeleted ? 'info' : 'success'">
              {{ row.isDeleted ? '已禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group v-if="!row.isDeleted">
              <el-button size="small" type="primary" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDelete(row)"
                :disabled="row.userId === currentUser.userId"
              >
                禁用
              </el-button>
            </el-button-group>
            <el-button 
              v-else 
              size="small" 
              type="success" 
              @click="handleRestore(row)"
            >
              启用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="userForm" :rules="rules" ref="userFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="学院" prop="college">
          <el-input v-model="userForm.college" />
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="userForm.major" />
        </el-form-item>
        <el-form-item label="班级" prop="className">
          <el-input v-model="userForm.className" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="教师" value="TEACHER" />
            <el-option label="学生" value="STUDENT" />
          </el-select>
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
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'UserManagement',
  setup() {
    const users = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const submitting = ref(false)
    const userFormRef = ref(null)
    const searchQuery = ref('')

    const userForm = ref({
      username: '',
      password: '',
      email: '',
      college: '',
      major: '',
      className: '',
      phone: '',
      role: ''
    })

    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ]
    }

    // 在 setup 函数开始处添加基础 URL
    const baseURL = 'http://localhost:8080'

    // 获取当前登录用户信息
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    // 获取用户列表
    const fetchUsers = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/users')
        users.value = response.data
      } catch (error) {
        console.error('获取用户列表失败:', error)
        ElMessage.error('获取用户列表失败')
        users.value = []
      } finally {
        loading.value = false
      }
    }

    // 添加用户
    const handleAdd = () => {
      dialogType.value = 'add'
      userForm.value = {
        username: '',
        password: '',
        email: '',
        college: '',
        major: '',
        className: '',
        phone: '',
        role: ''
      }
      dialogVisible.value = true
    }

    // 编辑用户
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      userForm.value = { ...row }
      dialogVisible.value = true
    }

    // 删除用户
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要禁用用户 "${row.username}" 吗？`,
        '警告',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await axios.delete(`/api/users/${row.userId}`)
          ElMessage.success('用户已禁用')
          fetchUsers() // 刷新用户列表
        } catch (error) {
          console.error('禁用用户失败:', error)
          ElMessage.error('禁用用户失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    }

    // 添加恢复用户方法
    const handleRestore = (row) => {
      ElMessageBox.confirm(
        `确定要启用用户 "${row.username}" 吗？`,
        '提示',
        {
          confirmButtonText: '确定启用',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(async () => {
        try {
          await axios.put(`/api/users/${row.userId}/restore`)
          ElMessage.success('用户已启用')
          fetchUsers() // 刷新用户列表
        } catch (error) {
          console.error('启用用户失败:', error)
          ElMessage.error('启用用户失败')
        }
      }).catch(() => {
        // 用户取消操作
      })
    }

    // 提交表单
    const submitForm = async () => {
      if (!userFormRef.value) return
      
      await userFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            let response
            const baseUrl = `${baseURL}/api/users`
            console.log('Sending request to:', baseUrl)
            
            // 添加请求头
            const config = {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
            
            if (dialogType.value === 'add') {
              response = await axios.post(baseUrl, userForm.value, config)
              console.log('Add response:', response)
              ElMessage.success('添加成功')
            } else {
              const url = `${baseUrl}/${userForm.value.userId}`
              console.log('Sending PUT request to:', url)
              response = await axios.put(url, userForm.value, config)
              console.log('Update response:', response)
              ElMessage.success('更新成功')
            }
            
            dialogVisible.value = false
            await fetchUsers()
          } catch (error) {
            console.error('Request error:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              config: error.config
            })
            
            let errorMessage = dialogType.value === 'add' ? '添加失败' : '更新失败'
            if (error.response?.data?.message) {
              errorMessage += `: ${error.response.data.message}`
            }
            
            ElMessage.error(errorMessage)
          } finally {
            submitting.value = false
          }
        }
      })
    }

    // 搜索功能
    const handleSearch = () => {
      // 这里可以实现搜索逻辑
      // 可以调用后端搜索接口，或者在前端过滤
    }

    // 获取角色标签
    const getRoleLabel = (role) => {
      const roleMap = {
        'ADMIN': '管理员',
        'TEACHER': '教师',
        'STUDENT': '学生'
      }
      return roleMap[role] || role
    }

    onMounted(() => {
      fetchUsers()
    })

    return {
      users,
      loading,
      dialogVisible,
      dialogType,
      userForm,
      userFormRef,
      rules,
      submitting,
      searchQuery,
      handleAdd,
      handleEdit,
      handleDelete,
      handleRestore,
      submitForm,
      handleSearch,
      getRoleLabel,
      currentUser
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.el-button-group {
  display: flex;
  gap: 8px;
}
</style> 