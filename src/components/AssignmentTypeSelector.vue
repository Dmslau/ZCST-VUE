<template>
  <div class="assignment-type-selector">
    <el-checkbox-group v-model="selectedTypes" @change="handleChange">
      <el-checkbox label="text">文本</el-checkbox>
      <el-checkbox label="code">代码</el-checkbox>
      <el-checkbox label="image">图片</el-checkbox>
      <el-checkbox label="file">文件</el-checkbox>
      <el-checkbox label="single_choice">单选题</el-checkbox>
      <el-checkbox label="multiple_choice">多选题</el-checkbox>
    </el-checkbox-group>
    
    <!-- 选择题配置区域 -->
    <div v-if="hasChoiceType" class="choice-config">
      <el-divider>选项配置</el-divider>
      <div v-for="(option, index) in options" :key="index" class="option-item">
        <el-input
          v-model="option.content"
          :placeholder="`选项 ${index + 1}`"
        >
          <template #prepend>
            {{ String.fromCharCode(65 + index) }}
          </template>
        </el-input>
        <el-button 
          type="danger" 
          circle 
          size="small"
          @click="removeOption(index)"
          :disabled="options.length <= 2"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      <div class="options-actions">
        <el-button 
          type="primary" 
          size="small"
          @click="addOption"
          :disabled="options.length >= 6"
        >
          添加选项
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export default {
  name: 'AssignmentTypeSelector',
  components: { Delete },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const parseTypes = (typeString) => {
      if (!typeString) return []
      try {
        return typeString.split(',')
      } catch (e) {
        return []
      }
    }

    const selectedTypes = ref(parseTypes(props.modelValue))
    const options = ref([
      { content: '' },
      { content: '' }
    ])

    const hasChoiceType = computed(() => {
      return selectedTypes.value.includes('single_choice') || 
             selectedTypes.value.includes('multiple_choice')
    })

    const handleChange = () => {
      // 确保至少选择一种类型
      if (selectedTypes.value.length === 0) {
        selectedTypes.value = ['text']
      }
      emit('update:modelValue', selectedTypes.value.join(','))
    }

    const addOption = () => {
      if (options.value.length < 6) {
        options.value.push({ content: '' })
      }
    }

    const removeOption = (index) => {
      if (options.value.length > 2) {
        options.value.splice(index, 1)
      }
    }

    // 监听 props 变化
    watch(() => props.modelValue, (newValue) => {
      selectedTypes.value = parseTypes(newValue)
    })

    return {
      selectedTypes,
      options,
      hasChoiceType,
      handleChange,
      addOption,
      removeOption
    }
  }
}
</script>

<style scoped>
.assignment-type-selector {
  margin-bottom: 20px;
}

.choice-config {
  margin-top: 20px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.options-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-checkbox) {
  margin-right: 20px;
  margin-bottom: 10px;
}

:deep(.el-input-group__prepend) {
  width: 40px;
  text-align: center;
  font-weight: bold;
}
</style> 