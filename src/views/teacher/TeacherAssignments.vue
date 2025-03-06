<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">作业管理</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索作业..."
              class="search-input"
              clearable
              @input="handleSearch"
            />
          </div>
          <el-button type="primary" @click="handleAdd">布置作业</el-button>
        </div>
      </template>
      
      <el-table :data="filteredAssignments" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="作业标题" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleView(row)">查看</el-button>
              <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'TeacherAssignments',
  setup() {
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

    const filteredAssignments = computed(() => {
      return assignments.value.filter(assignment => {
        if (!searchQuery.value) return true
        return assignment.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      })
    })

    const loadAssignments = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/assignments')
        assignments.value = response.data
      } catch (error) {
        console.error('获取作业列表失败:', error)
        ElMessage.error('获取作业列表失败')
      } finally {
        loading.value = false
      }
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
      handleSearch: () => {
        ElMessage.info('搜索功能开发中...')
      },
      handleAdd: () => {
        ElMessageBox.prompt('请输入作业标题', '布置作业', {
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }).then(async ({ value }) => {
          try {
            const response = await axios.post('http://localhost:8080/api/assignments', {
              title: value,
              courseId: 1, // 这里应该有课程选择
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认一周后截止
              status: 'active'
            })
            if (response.status === 200) {
              ElMessage.success('作业创建成功')
              loadAssignments() // 刷新列表
            }
          } catch (error) {
            ElMessage.error('作业创建失败')
          }
        }).catch(() => {
          // 用户取消操作
        })
      },
      handleEdit: (row) => {
        ElMessageBox.prompt('请输入新的作业标题', '编辑作业', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: row.title
        }).then(async ({ value }) => {
          try {
            const response = await axios.put(`http://localhost:8080/api/assignments/${row.assignmentId}`, {
              ...row,
              title: value
            })
            if (response.status === 200) {
              ElMessage.success('作业更新成功')
              loadAssignments() // 刷新列表
            }
          } catch (error) {
            ElMessage.error('作业更新失败')
          }
        }).catch(() => {
          // 用户取消操作
        })
      },
      handleDelete: (row) => {
        ElMessageBox.confirm(
          `确定要删除作业 ${row.title} 吗？`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(async () => {
          try {
            const response = await axios.delete(`http://localhost:8080/api/assignments/${row.assignmentId}`)
            if (response.status === 200) {
              ElMessage.success('删除成功')
              loadAssignments() // 刷新列表
            }
          } catch (error) {
            ElMessage.error('删除失败')
          }
        }).catch(() => {
          // 用户取消操作
        })
      },
      handleView: (row) => {
        ElMessage.info(`查看作业: ${row.title}`)
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