<template>
  <div class="notices-container">
    <h2>通知中心</h2>
    <el-table :data="noticeList" style="width: 100%">
      <el-table-column prop="title" label="通知标题" />
      <el-table-column prop="date" label="发布日期" />
      <el-table-column prop="publisher" label="发布人" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewNotice(scope.row.id)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'StudentNotices',
  setup() {
    const noticeList = ref([])
    
    const viewNotice = (id) => {
      console.log('查看通知:', id)
    }

    return {
      noticeList,
      viewNotice
    }
  }
}
</script> 