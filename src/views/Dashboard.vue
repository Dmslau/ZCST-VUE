<template>
  <div class="dashboard-container">
    <!-- 管理员视图 -->
    <template v-if="isAdmin">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>总用户数</span>
              </div>
            </template>
            <div class="card-body">
              <h2>{{ statistics.userCount }}</h2>
            </div>
          </el-card>
        </el-col>
        <!-- 其他管理员统计卡片 -->
      </el-row>
    </template>

    <!-- 教师视图 -->
    <template v-else-if="isTeacher">
    <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
          <template #header>
            <div class="card-header">
                <span>我的课程</span>
              </div>
            </template>
            <div class="card-body">
              <h2>{{ statistics.courseCount }}</h2>
            </div>
          </el-card>
        </el-col>
        <!-- 其他教师统计卡片 -->
      </el-row>
    </template>

    <!-- 学生视图 -->
    <template v-else>
      <el-row :gutter="20">
        <!-- 课程统计 -->
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>我的课程</span>
            </div>
          </template>
            <div class="card-body">
              <h2>{{ statistics.courseCount || 0 }}</h2>
              <p>当前学期选课数量</p>
            </div>
        </el-card>
      </el-col>

        <!-- 作业统计 -->
        <el-col :span="6">
          <el-card shadow="hover" class="warning-card">
          <template #header>
            <div class="card-header">
                <span>待交作业</span>
              </div>
            </template>
            <div class="card-body">
              <h2>{{ statistics.pendingAssignments || 0 }}</h2>
              <p>未提交的作业数量</p>
            </div>
          </el-card>
        </el-col>

        <!-- 成绩统计 -->
        <el-col :span="6">
          <el-card shadow="hover" class="success-card">
            <template #header>
              <div class="card-header">
                <span>已修学分</span>
            </div>
          </template>
            <div class="card-body">
              <h2>{{ statistics.totalCredits || 0 }}</h2>
              <p>累计获得学分</p>
            </div>
        </el-card>
      </el-col>

        <!-- 通知统计 -->
        <el-col :span="6">
          <el-card shadow="hover" class="info-card">
          <template #header>
            <div class="card-header">
                <span>未读通知</span>
              </div>
            </template>
            <div class="card-body">
              <h2>{{ statistics.unreadNotices || 0 }}</h2>
              <p>未读的通知数量</p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近作业列表 -->
      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>最近作业</span>
                <el-button type="text" @click="$router.push('/student/assignments')">
                  查看全部
                </el-button>
              </div>
            </template>
            <el-table :data="recentAssignments" style="width: 100%">
              <el-table-column prop="title" label="作业标题" />
              <el-table-column prop="courseName" label="课程" width="120" />
              <el-table-column prop="deadline" label="截止日期" width="120" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === '已提交' ? 'success' : 'warning'">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 最近通知列表 -->
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>最新通知</span>
                <el-button type="text" @click="$router.push('/notices')">
                  查看全部
                </el-button>
            </div>
          </template>
            <el-table :data="recentNotices" style="width: 100%">
              <el-table-column prop="title" label="通知标题" />
              <el-table-column prop="date" label="发布日期" width="120" />
              <el-table-column prop="publisher" label="发布人" width="100" />
            </el-table>
        </el-card>
      </el-col>
    </el-row>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Cookies from 'js-cookie'

export default {
  name: 'DashboardView',
  setup() {
    const userInfo = ref({})
    const statistics = ref({})
    const recentAssignments = ref([])
    const recentNotices = ref([])

    const isAdmin = computed(() => userInfo.value.role === 'ADMIN')
    const isTeacher = computed(() => userInfo.value.role === 'TEACHER')

    onMounted(() => {
      // 获取用户信息
      const userStr = Cookies.get('user') || localStorage.getItem('user')
      if (userStr) {
        userInfo.value = JSON.parse(userStr)
      }

      // TODO: 从后端获取统计数据
      statistics.value = {
        courseCount: 5,
        pendingAssignments: 3,
        totalCredits: 45,
        unreadNotices: 2
      }

      // TODO: 从后端获取最近作业
      recentAssignments.value = [
        {
          title: '数据结构作业1',
          courseName: '数据结构',
          deadline: '2024-03-20',
          status: '未提交'
        }
        // 更多作业数据...
      ]

      // TODO: 从后端获取最新通知
      recentNotices.value = [
        {
          title: '关于期中考试安排的通知',
          date: '2024-03-15',
          publisher: '教务处'
        }
        // 更多通知数据...
      ]
    })

    return {
      isAdmin,
      isTeacher,
      statistics,
      recentAssignments,
      recentNotices
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  text-align: center;
}

.card-body h2 {
  font-size: 24px;
  margin: 10px 0;
}

.card-body p {
  color: #666;
  margin: 0;
}

.warning-card .el-card__header {
  background-color: #fdf6ec;
}

.success-card .el-card__header {
  background-color: #f0f9eb;
}

.info-card .el-card__header {
  background-color: #ecf5ff;
}
</style> 