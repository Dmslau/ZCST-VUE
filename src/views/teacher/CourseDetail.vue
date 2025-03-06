<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="goBack" text>
              <el-icon><ArrowLeft /></el-icon>
              返回课程列表
            </el-button>
            <span class="title">{{ course.courseName }}</span>
          </div>
        </div>
      </template>

      <!-- 课程信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="课程描述">{{ course.courseDescription }}</el-descriptions-item>
        <el-descriptions-item label="开课时间">{{ formatDateTime(course.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结课时间">{{ formatDateTime(course.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getCourseStatus(course) === 'active' ? 'success' : 'info'">
            {{ getCourseStatus(course) === 'active' ? '进行中' : '已结束' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 功能标签页 -->
      <el-tabs v-model="activeTab" class="course-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="作业管理" name="assignments">
          <course-assignments 
            :course-id="courseId" 
            @refresh="fetchCourseDetail"
          />
        </el-tab-pane>
        <el-tab-pane label="成绩管理" name="grades">
          <course-grades :course-id="courseId" />
        </el-tab-pane>
        <el-tab-pane label="学生管理" name="students">
          <course-students :course-id="courseId" />
        </el-tab-pane>
        <el-tab-pane label="作业查重" name="similarity">
          <template v-if="activeTab === 'similarity'">
            <template v-if="isCheckPage">
              <router-view></router-view>
            </template>
            <div v-else class="check-entry">
              <el-button 
                type="primary" 
                @click="goToSimilarityCheck"
              >
                进入查重系统
              </el-button>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import CourseAssignments from './components/CourseAssignments.vue'
import CourseGrades from './components/CourseGrades.vue'
import CourseStudents from './components/CourseStudents.vue'
import { ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: 'CourseDetail',
  components: {
    CourseAssignments,
    CourseGrades,
    CourseStudents,
    ArrowLeft
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const courseId = route.params.courseId
    const course = ref({})
    const loading = ref(false)
    const activeTab = ref('assignments')
    
    // 判断当前是否在查重页面
    const isCheckPage = computed(() => {
      return route.name === 'SimilarityCheck'
    })

    const fetchCourseDetail = async () => {
      loading.value = true
      try {
        const response = await axios.get(`/api/courses/${courseId}`)
        console.log('获取的课程信息:', response.data)
        course.value = response.data
      } catch (error) {
        console.error('Error fetching course:', error)
        ElMessage.error('获取课程信息失败')
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/courses')
    }

    const formatDateTime = (time) => {
      if (!time) return '未设置'
      return new Date(time).toLocaleString()
    }

    const getCourseStatus = (course) => {
      if (!course.endTime) return 'active'
      return new Date(course.endTime).getTime() > Date.now() ? 'active' : 'ended'
    }

    const handleTabClick = (tab) => {
      if (tab.props.name === 'similarity' && isCheckPage.value) {
        router.push(`/courses/${courseId}`)
      }
    }

    const goToSimilarityCheck = () => {
      router.push(`/courses/${courseId}/similarity-check`)
    }

    onMounted(() => {
      fetchCourseDetail()
    })

    return {
      course,
      loading,
      activeTab,
      courseId,
      isCheckPage,
      fetchCourseDetail,
      goBack,
      formatDateTime,
      getCourseStatus,
      goToSimilarityCheck,
      handleTabClick
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
  font-size: 18px;
  font-weight: bold;
}

.course-tabs {
  margin-top: 20px;
}

.check-entry {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style> 