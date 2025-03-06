<template>
  <div class="similarity-check-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">作业查重</span>
            <el-select 
              v-model="selectedCourse" 
              placeholder="选择课程"
              @change="handleCourseChange"
              style="width: 200px; margin-left: 16px;"
            >
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
            <el-select 
              v-model="selectedAssignment"
              placeholder="选择作业"
              :disabled="!selectedCourse"
              style="width: 200px; margin-left: 8px;"
            >
              <el-option
                v-for="assignment in assignments"
                :key="assignment.id"
                :label="assignment.title"
                :value="assignment.id"
              />
            </el-select>
          </div>
          <el-button type="primary" @click="startCheck" :loading="checking">
            开始查重
          </el-button>
        </div>
      </template>

      <!-- 查重结果展示 -->
      <div class="result-section" v-loading="checking">
        <div class="statistics-cards">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>
                  <div class="stat-header">
                    <span>平均相似度</span>
                    <el-tooltip content="所有提交作业的平均相似度">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <div class="stat-value" :style="{ color: getColorByValue(averageSimilarity) }">
                  {{ averageSimilarity }}%
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>
                  <div class="stat-header">
                    <span>最高相似度</span>
                  </div>
                </template>
                <div class="stat-value" :style="{ color: getColorByValue(highestSimilarity) }">
                  {{ highestSimilarity }}%
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>
                  <div class="stat-header">
                    <span>疑似抄袭数</span>
                    <el-tooltip content="相似度超过70%的提交数量">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <div class="stat-value warning">
                  {{ suspiciousCount }}
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 相似度列表 -->
        <div class="similarity-list">
          <el-table :data="similarityResults" style="width: 100%" v-if="hasResults">
            <el-table-column label="学生A" width="180">
              <template #default="{ row }">
                <div class="student-info">
                  <span>{{ row.studentA.name }}</span>
                  <span class="student-id">({{ row.studentA.id }})</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="学生B" width="180">
              <template #default="{ row }">
                <div class="student-info">
                  <span>{{ row.studentB.name }}</span>
                  <span class="student-id">({{ row.studentB.id }})</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="相似度" width="200">
              <template #default="{ row }">
                <div class="similarity-value">
                  <el-progress 
                    :percentage="row.similarity"
                    :color="getProgressColor(row.similarity)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-else description="请选择课程和作业开始查重" />
        </div>
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      title="相似度详情"
      v-model="dialogVisible"
      width="80%"
    >
      <div class="similarity-detail" v-if="currentDetail">
        <div class="detail-header">
          <div class="student-column">
            <h4>{{ currentDetail.studentA.name }}</h4>
            <div class="submission-info">
              提交时间: {{ formatDateTime(currentDetail.studentA.submitTime) }}
            </div>
          </div>
          <div class="similarity-indicator">
            <div class="similarity-value">
              {{ currentDetail.similarity }}%
            </div>
            <div class="similarity-label">相似度</div>
          </div>
          <div class="student-column">
            <h4>{{ currentDetail.studentB.name }}</h4>
            <div class="submission-info">
              提交时间: {{ formatDateTime(currentDetail.studentB.submitTime) }}
            </div>
          </div>
        </div>
        
        <div class="text-comparison">
          <div class="text-panel">
            <div class="text-header">学生A答案</div>
            <div class="text-content" v-html="highlightSimilarText(currentDetail.textA)"></div>
          </div>
          <div class="text-panel">
            <div class="text-header">学生B答案</div>
            <div class="text-content" v-html="highlightSimilarText(currentDetail.textB)"></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

export default {
  name: 'AssignmentSimilarityCheck',
  components: {
    InfoFilled
  },
  setup() {
    const selectedCourse = ref('')
    const selectedAssignment = ref('')
    const checking = ref(false)
    const dialogVisible = ref(false)
    const currentDetail = ref(null)

    // 模拟数据
    const courses = ref([
      { id: 1, name: '计算机网络' },
      { id: 2, name: '操作系统' }
    ])

    const assignments = ref([
      { id: 1, title: '第一次作业 - TCP/IP协议分析' },
      { id: 2, title: '第二次作业 - 网络安全' }
    ])

    const similarityResults = ref([])
    const hasResults = ref(false)

    // 统计数据
    const averageSimilarity = ref(45)
    const highestSimilarity = ref(85)
    const suspiciousCount = ref(3)

    const handleCourseChange = () => {
      selectedAssignment.value = ''
      hasResults.value = false
    }

    const getColorByValue = (value) => {
      if (value >= 70) return '#F56C6C'
      if (value >= 50) return '#E6A23C'
      return '#67C23A'
    }

    const getProgressColor = (percentage) => {
      if (percentage >= 70) return '#F56C6C'
      if (percentage >= 50) return '#E6A23C'
      return '#67C23A'
    }

    const startCheck = () => {
      if (!selectedCourse.value || !selectedAssignment.value) {
        ElMessage.warning('请选择课程和作业')
        return
      }

      checking.value = true
      // 模拟查重过程
      setTimeout(() => {
        similarityResults.value = [
          {
            studentA: { id: '2021001001', name: '陈思远', submitTime: '2024-03-15 14:30:00' },
            studentB: { id: '2021001002', name: '王梓涵', submitTime: '2024-03-15 15:20:00' },
            similarity: 85,
            textA: 'TCP/IP协议是互联网的基础协议，它采用四层结构，包括应用层、传输层、网络层和网络接口层。TCP协议工作在传输层，提供可靠的、面向连接的数据传输服务，通过三次握手建立连接，通过四次挥手断开连接。TCP协议的主要特点是：面向连接、可靠传输、流量控制和拥塞控制。',
            textB: 'TCP/IP是互联网最基本的协议，采用四层结构：应用层、传输层、网络层和网络接口层。其中TCP协议在传输层工作，提供可靠的、面向连接的数据传输，通过三次握手建立连接，四次挥手断开连接。TCP主要特点包括：面向连接、可靠传输、流量控制和拥塞控制。'
          },
          {
            studentA: { id: '2021001003', name: '刘雨晨', submitTime: '2024-03-15 16:00:00' },
            studentB: { id: '2021001004', name: '张浩然', submitTime: '2024-03-15 16:15:00' },
            similarity: 65,
            textA: '网络安全是指保护网络系统的硬件、软件和数据不受偶然或恶意的破坏、更改和泄露的一系列措施。',
            textB: '网络安全包括保护计算机网络系统的硬件设备、软件程序和各类数据免受意外破坏或恶意攻击的技术手段。'
          }
        ]
        hasResults.value = true
        checking.value = false
      }, 1500)
    }

    const viewDetail = (row) => {
      currentDetail.value = row
      dialogVisible.value = true
    }

    const formatDateTime = (datetime) => {
      return new Date(datetime).toLocaleString()
    }

    const highlightSimilarText = (text) => {
      // 这里可以实现文本相似度高亮
      // 简单示例，实际项目中可以根据具体的相似度算法结果来高亮
      return text
    }

    return {
      selectedCourse,
      selectedAssignment,
      courses,
      assignments,
      checking,
      similarityResults,
      hasResults,
      averageSimilarity,
      highestSimilarity,
      suspiciousCount,
      dialogVisible,
      currentDetail,
      handleCourseChange,
      getColorByValue,
      getProgressColor,
      startCheck,
      viewDetail,
      formatDateTime,
      highlightSimilarText
    }
  }
}
</script>

<style scoped>
.similarity-check-container {
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
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.statistics-cards {
  margin-bottom: 24px;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-top: 8px;
}

.stat-value.warning {
  color: #F56C6C;
}

.similarity-list {
  margin-top: 20px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.student-id {
  color: #909399;
  font-size: 12px;
}

.similarity-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #EBEEF5;
}

.student-column {
  flex: 1;
  text-align: center;
}

.student-column h4 {
  margin: 0 0 8px;
  color: #303133;
}

.submission-info {
  font-size: 13px;
  color: #909399;
}

.similarity-indicator {
  padding: 0 32px;
}

.similarity-value {
  font-size: 32px;
  font-weight: bold;
  color: #F56C6C;
  text-align: center;
}

.similarity-label {
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.text-comparison {
  display: flex;
  gap: 20px;
}

.text-panel {
  flex: 1;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.text-header {
  padding: 8px 12px;
  background: #F5F7FA;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 500;
}

.text-content {
  margin: 0;
  padding: 16px;
  background: #FAFAFA;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  min-height: 200px;
}
</style> 