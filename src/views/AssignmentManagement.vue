<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">作业管理</span>
          <el-button type="primary">新建作业</el-button>
        </div>
      </template>
      
      <div class="placeholder-content">
        <el-empty description="作业管理功能开发中..." />
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'AssignmentManagement'
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

.placeholder-content {
  padding: 40px 0;
}
</style> 