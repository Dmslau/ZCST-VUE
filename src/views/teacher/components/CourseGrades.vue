<template>
  <div>
    <div class="header-actions">
      <el-button type="primary" @click="handleExport">导出成绩</el-button>
      <el-button type="success" @click="handleImport">导入成绩</el-button>
    </div>

    <el-table 
      :data="grades" 
      v-loading="loading" 
      style="width: 100%"
      :height="400"
      :header-cell-style="{ background: '#f5f7fa' }"
    >
      <el-table-column prop="studentId" label="学号" width="120" />
      <el-table-column prop="studentName" label="姓名" width="120" />
      <el-table-column prop="assignments" label="作业完成" width="120" />
      <el-table-column prop="attendance" label="出勤" width="100" />
      <el-table-column prop="finalGrade" label="最终成绩" width="100" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑成绩对话框 -->
    <el-dialog
      title="编辑成绩"
      v-model="dialogVisible"
      width="400px"
    >
      <el-form :model="gradeForm" :rules="rules" ref="gradeFormRef" label-width="100px">
        <el-form-item label="学生" prop="studentName">
          <el-input v-model="gradeForm.studentName" disabled />
        </el-form-item>
        <el-form-item label="出勤" prop="attendance">
          <el-input-number v-model="gradeForm.attendance" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="最终成绩" prop="finalGrade">
          <el-input-number v-model="gradeForm.finalGrade" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
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
  name: 'CourseGrades',
  props: {
    courseId: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const loading = ref(false)
    const grades = ref([])
    const dialogVisible = ref(false)
    const submitting = ref(false)
    const gradeFormRef = ref(null)
    const gradeForm = ref({
      studentName: '',
      attendance: 0,
      finalGrade: 0
    })

    const rules = {
      attendance: [
        { required: true, message: '请输入出勤分数', trigger: 'blur' }
      ],
      finalGrade: [
        { required: true, message: '请输入最终成绩', trigger: 'blur' }
      ]
    }

    const fetchGrades = async () => {
      loading.value = true
      try {
        // 使用正确的 API 路径
        const response = await axios.get(`/api/courses/${props.courseId}/grades`)
        grades.value = response.data.map(grade => ({
          studentId: grade.student.userId,
          studentName: grade.student.username,
          assignments: grade.assignments || '0/0',
          attendance: grade.attendance || 0,
          finalGrade: grade.finalGrade || 0,
          gradeId: grade.gradeId
        }))
      } catch (error) {
        console.error('Error fetching grades:', error)
        ElMessage.error('获取成绩列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleEdit = (row) => {
      gradeForm.value = { ...row }
      dialogVisible.value = true
    }

    const handleDetail = (row) => {
      console.log('Viewing grade details:', row)
      ElMessage.info('成绩详情功能开发中...')
    }

    const handleExport = () => {
      ElMessage.info('成绩导出功能开发中...')
    }

    const handleImport = () => {
      ElMessage.info('成绩导入功能开发中...')
    }

    const submitForm = async () => {
      if (!gradeFormRef.value) return
      
      await gradeFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            const response = await axios.put(`/api/grades/${gradeForm.value.gradeId}`, gradeForm.value)
            if (response.status === 200) {
              ElMessage.success('成绩更新成功')
              dialogVisible.value = false
              fetchGrades()
            }
          } catch (error) {
            console.error('Error updating grade:', error)
            ElMessage.error(error.response?.data?.message || '成绩更新失败')
          } finally {
            submitting.value = false
          }
        }
      })
    }

    onMounted(() => {
      fetchGrades()
    })

    return {
      loading,
      grades,
      dialogVisible,
      gradeForm,
      gradeFormRef,
      rules,
      submitting,
      handleEdit,
      handleDetail,
      handleExport,
      handleImport,
      submitForm
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

/* 添加表格优化样式 */
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