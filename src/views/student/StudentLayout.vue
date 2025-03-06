<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <el-menu
        :router="true"
        class="el-menu-vertical"
      >
        <el-menu-item index="/student/courses">
          <el-icon><Document /></el-icon>
          <span>我的课程</span>
        </el-menu-item>
        <el-menu-item index="/student/assignments">
          <el-icon><List /></el-icon>
          <span>作业管理</span>
        </el-menu-item>
        <el-menu-item index="/student/notices">
          <el-icon><Bell /></el-icon>
          <span>通知中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
import { Document, List, Bell } from '@element-plus/icons-vue'

export default {
  name: 'StudentLayout',
  components: {
    Document,
    List,
    Bell
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-menu-vertical {
  height: 100%;
}
</style> 