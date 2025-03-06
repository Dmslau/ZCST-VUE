<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">个人信息</span>
          <div class="header-actions">
            <el-button type="warning" @click="showPasswordDialog">
              修改密码
            </el-button>
            <el-button type="primary" @click="handleEdit" v-if="!isEditing">
              编辑信息
            </el-button>
            <template v-else>
              <el-button @click="cancelEdit">取消</el-button>
              <el-button type="primary" @click="saveProfile" :loading="saving">
                保存
              </el-button>
            </template>
          </div>
        </div>
      </template>
      
      <el-form 
        :model="userForm" 
        :rules="rules" 
        ref="userFormRef"
        label-width="100px"
        :disabled="!isEditing"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" disabled />
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
        
        <el-form-item label="角色">
          <el-tag :type="userForm.role === 'ADMIN' ? 'danger' : 'success'">
            {{ getRoleLabel(userForm.role) }}
          </el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      v-model="passwordDialogVisible"
      width="400px"
    >
      <el-form 
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="changePassword"
            :loading="changingPassword"
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
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'UserProfile',
  setup() {
    const userFormRef = ref(null)
    const passwordFormRef = ref(null)
    const isEditing = ref(false)
    const saving = ref(false)
    const changingPassword = ref(false)
    const passwordDialogVisible = ref(false)

    const userForm = ref({
      username: '',
      email: '',
      college: '',
      major: '',
      className: '',
      phone: '',
      role: ''
    })

    const passwordForm = ref({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const rules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ]
    }

    const passwordRules = {
      oldPassword: [
        { required: true, message: '请输入原密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.value.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    // 获取用户信息
    const fetchUserInfo = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        Object.assign(userForm.value, user)
      }
    }

    // 编辑信息
    const handleEdit = () => {
      isEditing.value = true
    }

    // 取消编辑
    const cancelEdit = () => {
      isEditing.value = false
      fetchUserInfo()  // 重置表单
    }

    // 保存个人信息
    const saveProfile = async () => {
      if (!userFormRef.value) return
      
      await userFormRef.value.validate(async (valid) => {
        if (valid) {
          saving.value = true
          try {
            const response = await axios.put(
              `http://localhost:8080/api/users/${userForm.value.userId}`,
              userForm.value
            )
            if (response.status === 200) {
              localStorage.setItem('user', JSON.stringify(userForm.value))
              ElMessage.success('保存成功')
              isEditing.value = false
            }
          } catch (error) {
            ElMessage.error('保存失败')
          } finally {
            saving.value = false
          }
        }
      })
    }

    // 显示修改密码对话框
    const showPasswordDialog = () => {
      passwordDialogVisible.value = true
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }

    // 修改密码
    const changePassword = async () => {
      if (!passwordFormRef.value) return
      
      await passwordFormRef.value.validate(async (valid) => {
        if (valid) {
          changingPassword.value = true
          try {
            // 使用与编辑信息相同的接口，但包含密码信息
            const response = await axios.put(
              `http://localhost:8080/api/users/${userForm.value.userId}`,
              {
                ...userForm.value,
                password: passwordForm.value.newPassword,
                oldPassword: passwordForm.value.oldPassword  // 添加原密码用于验证
              }
            )
            
            if (response.status === 200) {
              ElMessage.success('密码修改成功')
              passwordDialogVisible.value = false
            }
          } catch (error) {
            let errorMsg = '密码修改失败'
            if (error.response?.data?.message) {
              errorMsg += `: ${error.response.data.message}`
            }
            ElMessage.error(errorMsg)
          } finally {
            changingPassword.value = false
          }
        }
      })
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
      fetchUserInfo()
    })

    return {
      userForm,
      userFormRef,
      passwordForm,
      passwordFormRef,
      rules,
      passwordRules,
      isEditing,
      saving,
      changingPassword,
      passwordDialogVisible,
      handleEdit,
      cancelEdit,
      saveProfile,
      showPasswordDialog,
      changePassword,
      getRoleLabel
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

.title {
  font-size: 16px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-form-item__content) {
  max-width: 400px;
}
</style> 