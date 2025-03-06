<template>
  <div class="submission-success-container">
    <el-card>
      <h2>作业提交成功</h2>
      <p>感谢您的提交！您可以返回查看您的作业状态。</p>
      <div class="button-group">
        <el-button type="primary" @click="goBack">{{ backButtonText }}</el-button>
        <el-button @click="goToAssignments">查看全部作业</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

export default {
  name: 'SubmissionSuccess',
  setup() {
    const router = useRouter()
    const route = useRoute()

    // 判断来源路径
    const fromCourse = computed(() => {
      // 从路由查询参数获取来源
      return route.query.from === 'course'
    })

    const backButtonText = computed(() => 
      fromCourse.value ? '返回课程作业' : '返回作业列表'
    )

    const goBack = () => {
      if (fromCourse.value) {
        // 如果是从课程页面来的，返回课程页面
        const courseId = route.query.courseId
        if (courseId) {
          router.push(`/student/courses/${courseId}`)
        } else {
          // 如果没有courseId，返回课程列表
          router.push('/student/courses')
        }
      } else {
        // 否则返回作业列表
        router.push('/student/assignments')
      }
    }

    // 修改查看全部作业按钮的行为
    const goToAssignments = () => {
      // 如果当前在课程页面，则返回课程列表
      if (fromCourse.value) {
        router.push('/student/courses')
      } else {
        // 如果当前在作业列表，则返回作业列表
        router.push('/student/assignments')
      }
    }

    return {
      goBack,
      goToAssignments,
      backButtonText
    }
  }
}
</script>

<style scoped>
.submission-success-container {
  padding: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

h2 {
  color: #67c23a;
  margin-bottom: 16px;
}

p {
  color: #606266;
  margin-bottom: 20px;
}
</style> 