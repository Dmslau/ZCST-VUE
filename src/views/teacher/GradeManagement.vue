<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">成绩管理</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索学生..."
              class="search-input"
              clearable
              @input="handleSearch"
            />
          </div>
          <el-button type="primary" @click="handleExport">导出成绩</el-button>
        </div>
      </template>
      
      <el-table :data="grades" v-loading="loading" style="width: 100%">
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="120" />
        <el-table-column prop="courseName" label="课程" width="150" />
        <el-table-column prop="assignments" label="作业完成" width="120" />
        <el-table-column prop="attendance" label="出勤" width="100" />
        <el-table-column prop="finalGrade" label="最终成绩" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleDetail(row)">
                详情
              </el-button>
              <el-button size="small" @click="handleEdit(row)">
                编辑
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'GradeManagement',
  setup() {
    const loading = ref(false)
    const grades = ref([])
    const searchQuery = ref('')

    // 获取成绩列表
    const fetchGrades = () => {
      loading.value = true
      // 模拟API调用
      setTimeout(() => {
        grades.value = [
          {
            studentId: '2024001',
            studentName: '张三',
            courseName: '计算机导论',
            assignments: '8/10',
            attendance: '90%',
            finalGrade: 85
          }
        ]
        loading.value = false
      }, 1000)
    }

    onMounted(() => {
      fetchGrades()
    })

    return {
      loading,
      grades,
      searchQuery,
      handleSearch: () => {
        ElMessage.info('搜索功能开发中...')
      },
      handleExport: () => {
        ElMessage.success('成绩导出功能开发中...')
      },
      handleDetail: (row) => {
        ElMessage.info(`查看学生 ${row.studentName} 的成绩详情`)
      },
      handleEdit: (row) => {
        ElMessage.info(`编辑学生 ${row.studentName} 的成绩`)
      }
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