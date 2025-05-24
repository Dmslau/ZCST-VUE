<template>
  <div class="course-statistics-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">课程作业统计</span>
          <el-button type="primary" @click="downloadStatistics" style="margin-left: 16px;">
            下载统计
          </el-button>
        </div>
      </template>

      <!-- 统计结果展示 -->
      <div class="result-section">
        <!-- 汇总统计 -->
        <div class="summary-cards">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="stat-header">
                    <span>平均提交率</span>
                  </div>
                </template>
                <div class="stat-value">
                  {{ averageSubmissionRate }}%
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="stat-header">
                    <span>平均分</span>
                  </div>
                </template>
                <div class="stat-value">
                  {{ overallAverageScore }}分
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 学生列表 -->
        <div class="student-list">
          <el-table :data="studentStatistics" style="width: 100%">
            <el-table-column label="学生姓名" width="180">
              <template #default="{ row }">
                <span>{{ row.student.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="学号" width="180">
              <template #default="{ row }">
                <span>{{ row.student.id }}</span>
              </template>
            </el-table-column>
            <el-table-column label="提交情况" width="150">
              <template #default="{ row }">
                <span>{{ row.submissionCount }}/{{ totalAssignments }}</span>
              </template>
            </el-table-column>
            <el-table-column label="总分" width="120">
              <template #default="{ row }">
                <span>{{ row.totalScore }}分</span>
              </template>
            </el-table-column>
            <el-table-column label="平均分" width="120">
              <template #default="{ row }">
                <span>{{ row.averageScore }}分</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!studentStatistics.length" description="暂无学生数据" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CourseStatistics',
  setup() {
    // 模拟数据：假设有 3 次作业
    const totalAssignments = ref(3)

    // 模拟学生数据
    const students = ref([
      { id: '2021001001', name: '张伟' },
      { id: '2021001002', name: '王芳' },
      { id: '2021001003', name: '李娜' },
      { id: '2021001004', name: '刘洋' },
      { id: '2021001005', name: '陈静' },
      { id: '2021001006', name: '杨磊' },
      { id: '2021001007', name: '黄敏' },
      { id: '2021001008', name: '赵强' },
      { id: '2021001009', name: '周杰' },
      { id: '2021001010', name: '吴丽' },
      { id: '2021001011', name: '徐强' },
      { id: '2021001012', name: '孙芳' },
      { id: '2021001013', name: '胡伟' },
      { id: '2021001014', name: '郭敏' },
      { id: '2021001015', name: '何磊' },
      { id: '2021001016', name: '高丽' },
      { id: '2021001017', name: '林洋' },
      { id: '2021001018', name: '郑静' },
      { id: '2021001019', name: '谢强' },
      { id: '2021001020', name: '宋杰' },
      { id: '2021001021', name: '唐敏' },
      { id: '2021001022', name: '冯丽' },
      { id: '2021001023', name: '邓伟' },
      { id: '2021001024', name: '曹芳' },
      { id: '2021001025', name: '袁磊' },
      { id: '2021001026', name: '潘洋' },
      { id: '2021001027', name: '杜静' },
      { id: '2021001028', name: '程强' },
      { id: '2021001029', name: '彭杰' },
      { id: '2021001030', name: '吕敏' }
    ])

    // 模拟作业提交数据
    const submissions = ref([])

    // 生成模拟提交数据
    const generateSubmissions = () => {
      const submissionsData = []
      students.value.forEach((student, index) => {
        // 大部分学生（25人）提交了全部3次作业
        if (index < 25) {
          for (let i = 1; i <= totalAssignments.value; i++) {
            submissionsData.push({
              studentId: student.id,
              assignmentId: i,
              score: Math.floor(Math.random() * 41) + 60 // 60-100分
            })
          }
        } else {
          // 少部分学生（5人）提交了1-2次作业
          const submissionCount = Math.floor(Math.random() * 2) + 1
          for (let i = 1; i <= submissionCount; i++) {
            submissionsData.push({
              studentId: student.id,
              assignmentId: i,
              score: Math.floor(Math.random() * 41) + 60 // 60-100分
            })
          }
        }
      })
      return submissionsData
    }

    submissions.value = generateSubmissions()

    // 计算每个学生的作业提交情况
    const studentStatistics = computed(() => {
      return students.value.map(student => {
        const studentSubmissions = submissions.value.filter(sub => sub.studentId === student.id)
        const submissionCount = studentSubmissions.length
        const totalScore = studentSubmissions.reduce((sum, sub) => sum + sub.score, 0)
        const averageScore = submissionCount > 0 ? (totalScore / submissionCount).toFixed(2) : 0
        return {
          student,
          submissionCount,
          totalScore,
          averageScore
        }
      })
    })

    // 计算平均提交率
    const averageSubmissionRate = computed(() => {
      const totalSubmissions = studentStatistics.value.reduce((sum, student) => sum + student.submissionCount, 0)
      const totalPossibleSubmissions = students.value.length * totalAssignments.value
      return ((totalSubmissions / totalPossibleSubmissions) * 100).toFixed(2)
    })

    // 计算整体平均分
    const overallAverageScore = computed(() => {
      const totalScores = studentStatistics.value.reduce((sum, student) => sum + parseFloat(student.averageScore), 0)
      return (totalScores / students.value.length).toFixed(2)
    })

    // 下载统计
    const downloadStatistics = () => {
      alert('下载统计功能尚未实现！')
    }

    return {
      totalAssignments,
      students,
      submissions,
      studentStatistics,
      averageSubmissionRate,
      overallAverageScore,
      downloadStatistics
    }
  }
}
</script>

<style scoped>
.course-statistics-container {
  padding: 20px;
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

.summary-cards {
  margin-bottom: 24px;
}

.stat-header {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-top: 8px;
}

.student-list {
  margin-top: 20px;
}
</style>