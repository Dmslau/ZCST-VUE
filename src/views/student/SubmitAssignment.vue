<template>
  <div class="submit-assignment-container">
    <el-card 
      class="assignment-card" 
      v-loading="loading"
    >
      <template #header>
        <div class="card-header">
          <span class="title">{{ assignment.title }}</span>
        </div>
      </template>

      <div class="content-container">
        <div class="info-section">
          <h3 class="section-title">作业信息</h3>
          <div class="info-content">
            <p>作业标题: <strong>{{ assignment.title }}</strong></p>
            <p>截止日期: <strong>{{ assignment.deadline }}</strong></p>
          </div>
        </div>

        <div class="settings-section">
          <h4 class="section-title">作业设置</h4>
          <div class="settings-content">
            <div class="setting-item">
              <span class="setting-label">作业类型:</span>
              <span class="setting-value">{{ getAssignmentType(assignment.settings.assignmentType) }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">提交次数:</span>
              <span class="setting-value">{{ assignment.settings.allowMultipleSubmissions ? '允许多次提交' : '只允许一次提交' }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">附件提交:</span>
              <span class="setting-value">{{ assignment.settings.allowedAttachments ? '允许' : '不允许' }}</span>
            </div>
          </div>
        </div>

        <div v-if="assignment.settings.assignmentType === 'group'" class="group-section">
          <h4 class="section-title">小组成员</h4>
          <div class="group-content">
            <div class="current-members">
              <div class="members-header">
                <span>已选成员 ({{ selectedMembers.length }}/{{ assignment.settings.groupMemberLimit }})</span>
              </div>
              <el-tag
                v-for="member in selectedMembers"
                :key="member.userId"
                class="member-tag"
                closable
                @close="removeMember(member)"
              >
                {{ member.username }}
              </el-tag>
            </div>
            
            <el-select
              v-model="selectedMember"
              filterable
              placeholder="搜索并选择组员"
              @filter-change="searchMembers"
              :loading="loading"
              @change="addMember"
              :disabled="selectedMembers.length >= assignment.settings.groupMemberLimit"
            >
              <el-option
                v-for="item in memberOptions"
                :key="item.userId"
                :label="item.username"
                :value="item"
              >
                <span>{{ item.username }}</span>
                <span class="member-info">{{ item.className }}</span>
              </el-option>
            </el-select>
          </div>
        </div>

        <div class="questions-section">
          <h4 class="section-title">题目列表</h4>
          <div v-if="assignment.questions && assignment.questions.length > 0">
            <div v-for="(question, index) in assignment.questions" :key="index" class="question-card">
              <div class="question-header">
                <h5 class="question-title">题目 {{ index + 1 }}</h5>
                <span class="question-type">{{ getQuestionType(question.type) }}</span>
              </div>
              <div class="question-content" v-html="question.content"></div>
              
              <div v-if="question.attachedFiles && question.attachedFiles.length > 0" class="question-files">
                <div class="files-header">
                  <h5>题目附件</h5>
                </div>
                <div class="files-list">
                  <div 
                    v-for="(file, fileIndex) in question.attachedFiles" 
                    :key="fileIndex" 
                    class="file-item"
                    @click="downloadFile(file)"
                  >
                    <el-icon><Document /></el-icon>
                    <span class="file-name">{{ file.name }}</span>
                  </div>
                </div>
              </div>

              <el-form :model="answers[index]" ref="answerForm" label-width="120px" class="answer-form">
                <el-form-item label="你的答案" :prop="`answer`">
                  <template v-if="question.type === 'essay'">
                    <div class="editor-container">
                      <el-input
                        v-model="answers[index].answer"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入答案..."
                        resize="vertical"
                      />
                      
                      <el-upload
                        v-if="assignment.settings.allowedAttachments"
                        class="upload-button"
                        :auto-upload="false"
                        :show-file-list="false"
                        :on-change="(file) => handleFileChange(file, index)"
                      >
                        <el-button size="small" type="primary">上传附件</el-button>
                      </el-upload>
                      
                      <div v-if="answers[index].attachments?.length > 0" class="uploaded-files">
                        <div class="uploaded-files-header">
                          <h4>已上传文件</h4>
                        </div>
                        <el-table :data="answers[index].attachments" size="small">
                          <el-table-column prop="name" label="文件名" />
                          <el-table-column prop="size" label="大小" width="120">
                            <template #default="{ row }">
                              {{ formatFileSize(row.size) }}
                            </template>
                          </el-table-column>
                          <el-table-column label="操作" width="120">
                            <template #default="{ $index }">
                              <el-button 
                                type="danger" 
                                size="small" 
                                link
                                @click="removeFile(index, $index)"
                              >
                                删除
                              </el-button>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="question.type === 'blank'">
                    <div v-for="(blank, blankIndex) in question.blanks" :key="blankIndex" class="blank-answer">
                      <el-form-item :label="`填空 ${blankIndex + 1}`">
                        <el-input v-model="answers[index].blanks[blankIndex]" placeholder="请输入答案" />
                      </el-form-item>
                    </div>
                  </template>
                  <template v-else-if="question.type === 'single'">
                    <el-radio-group v-model="answers[index].answer">
                      <el-radio 
                        v-for="(option, optIndex) in question.options" 
                        :key="optIndex" 
                        :label="option.content"
                      >
                        {{ option.content }}
                      </el-radio>
                    </el-radio-group>
                  </template>
                  <template v-else-if="question.type === 'multiple'">
                    <el-checkbox-group v-model="answers[index].answers">
                      <el-checkbox 
                        v-for="(option, optIndex) in question.options" 
                        :key="optIndex" 
                        :label="option.content"
                      >
                        {{ option.content }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </template>
                  <template v-else-if="question.type === 'programming'">
                    <div class="code-editor">
                      <div class="code-header">
                        <span class="language-tag">{{ question.selectedLanguage }}</span>
                      </div>
                      <quill-editor
                        v-model:content="answers[index].answer"
                        :options="{
                          theme: 'snow',
                          modules: {
                            toolbar: false,
                            syntax: {
                              highlight: code => hljs.highlightAuto(code).value
                            },
                            clipboard: {
                              matchVisual: false
                            }
                          },
                          formats: ['code-block'],
                          placeholder: '请输入代码...'
                        }"
                        @ready="onEditorReady"
                      />
                      <div class="code-actions">
                        <el-button 
                          type="primary" 
                          @click="runCode(index)"
                          :loading="runningCode"
                        >
                          <el-icon><VideoPlay /></el-icon>
                          调试运行
                        </el-button>
                      </div>
                      <!-- 运行结果展示区域 -->
                      <div v-if="runResult" class="run-result">
                        <div class="result-header">运行结果</div>
                        <pre class="result-content" :class="runResult.status">{{ runResult.output }}</pre>
                      </div>
                    </div>
                  </template>
                </el-form-item>
              </el-form>
            </div>
          </div>
          <div v-else class="no-questions">
            <el-empty description="没有可提交的题目" />
          </div>
        </div>

        <div class="submit-section">
          <el-button type="primary" size="large" @click="submitAssignment">提交作业</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, VideoPlay } from '@element-plus/icons-vue'
import axios from 'axios'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import 'highlight.js/styles/atom-one-dark.css'
import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'

hljs.registerLanguage('javascript', javascript)

export default {
  name: 'SubmitAssignment',
  components: {
    Document,
    VideoPlay,
    QuillEditor
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const fromPath = ref('')
    const assignment = ref({
      settings: {
        assignmentType: 'individual',
        allowMultipleSubmissions: false,
        allowedAttachments: false
      }
    })
    const answers = ref([])
    const selectedMembers = ref([])
    const memberOptions = ref([])
    const selectedMember = ref(null)
    const runningCode = ref(false)
    const runResult = ref(null)

    onMounted(() => {
      fromPath.value = document.referrer
    })

    const loadAssignment = async () => {
      try {
        const response = await axios.get(`/api/assignments/${route.params.assignmentId}`)
        assignment.value = response.data
        
        const currentUser = JSON.parse(localStorage.getItem('user'))
        const submissionsResponse = await axios.get(`/api/submissions/student/${currentUser.userId}`)
        const hasSubmitted = submissionsResponse.data.some(submission => 
          submission.assignment.assignmentId === assignment.value.assignmentId
        )
        
        if (hasSubmitted && !assignment.value.settings.allowMultipleSubmissions) {
          ElMessage.warning('该作业只允许提交一次，您已经提交过了')
          const fromCourse = route.path.includes('/student/courses/')
          if (fromCourse) {
            const courseId = route.path.split('/')[3]
            router.push(`/student/courses/${courseId}`)
          } else {
            router.push('/student/assignments')
          }
          return
        }

        if (!assignment.value.settings) {
          assignment.value.settings = {}
        }
        assignment.value.settings = {
          assignmentType: assignment.value.settings.assignmentType || 'individual',
          allowMultipleSubmissions: assignment.value.settings.allowMultipleSubmissions || false,
          allowedAttachments: assignment.value.settings.allowedAttachments || false,
          groupMemberLimit: assignment.value.settings.groupMemberLimit || 4
        }

        const content = JSON.parse(assignment.value.content)
        assignment.value.questions = content.questions || []
        initAnswers()

        if (assignment.value.settings.assignmentType === 'group') {
          await getCourseStudents()
        }
      } catch (error) {
        console.error('获取作业信息失败:', error)
        ElMessage.error('获取作业信息失败')
      }
    }

    watch(
      () => route.params.assignmentId,
      (newId, oldId) => {
        if (newId && newId !== oldId) {
          answers.value = []
          selectedMembers.value = []
          memberOptions.value = []
          selectedMember.value = null
          loadAssignment()
        }
      },
      { immediate: true }
    )

    const getCourseStudents = async () => {
      try {
        loading.value = true
        const response = await axios.get(`/api/courses/${assignment.value.course.courseId}/students`)
        const currentUser = JSON.parse(localStorage.getItem('user'))
        memberOptions.value = response.data.filter(student => 
          student.userId !== currentUser.userId && 
          !selectedMembers.value.some(member => member.userId === student.userId)
        )
      } catch (error) {
        console.error('获取课程学生列表失败:', error)
        ElMessage.error('获取课程学生列表失败')
      } finally {
        loading.value = false
      }
    }

    const searchMembers = (query) => {
      if (!query) {
        return getCourseStudents()
      }
      memberOptions.value = memberOptions.value.filter(student => 
        student.username.toLowerCase().includes(query.toLowerCase()) ||
        student.className.toLowerCase().includes(query.toLowerCase())
      )
    }

    const initAnswers = () => {
      answers.value = assignment.value.questions.map(question => {
        if (question.type === 'programming') {
          return {
            answer: question.presetCode || '// 在此处编写代码'
          }
        } else if (question.type === 'essay') {
          return {
            answer: '',
            attachments: []
          }
        } else if (question.type === 'blank') {
          return { blanks: question.blanks.map(() => '') }
        } else if (question.type === 'multiple') {
          return { answers: [] }
        } else {
          return { answer: '' }
        }
      })
    }

    const handleFileChange = (uploadFile, questionIndex) => {
      const file = uploadFile.raw
      if (file) {
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          ElMessage.error('文件大小不能超过 10MB')
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            base64: e.target.result
          }
          answers.value[questionIndex].attachments.push(fileData)
          ElMessage.success(`文件 ${file.name} 已添加`)
        }
        reader.readAsDataURL(file)
      }
    }

    const submitAssignment = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user'))
        
        if (assignment.value.settings.assignmentType === 'group' && 
            selectedMembers.value.length < 2) {
          ElMessage.warning('请至少选择一名组员')
          return
        }

        const submitData = {
          studentId: currentUser.userId,
          groupMembers: assignment.value.settings.assignmentType === 'group' ? 
            selectedMembers.value.map(member => member.userId) : [],
          answers: answers.value.map(answer => ({
            ...answer,
            attachments: answer.attachments || []
          }))
        }

        loading.value = true
        ElMessage({
          message: '正在提交作业...',
          type: 'info'
        })

        console.log('提交的数据结构:', {
          提交的原始数据: submitData,
          answers数组详情: answers.value,
          assignment详情: assignment.value
        })

        const response = await axios.post(`/api/submissions/${route.params.assignmentId}/submit`, submitData)
        
        if (response.status === 200 || response.status === 201) {
          ElMessage.success('作业提交成功')
          if (fromPath.value.includes('/student/courses/')) {
            const courseId = route.path.split('/')[3]
            router.push(`/student/courses/${courseId}`)
          } else {
            router.push('/student/assignments')
          }
        } else {
          throw new Error('提交失败')
        }
      } catch (error) {
        console.error('提交作业失败:', error)
        if (error.response?.data?.message) {
          ElMessage.error(`提交失败: ${error.response.data.message}`)
        } else {
          ElMessage.error('提交作业失败')
        }
      } finally {
        loading.value = false
      }
    }

    const getQuestionType = (type) => {
      const typeMap = {
        'essay': '问答题',
        'blank': '填空题',
        'single': '单选题',
        'multiple': '多选题',
        'programming': '编程题'
      }
      return typeMap[type] || type
    }

    const onEditorReady = (quill) => {
      quill.container.style.fontFamily = 'monospace'
      
      quill.container.style.backgroundColor = '#282c34'
      quill.root.style.color = '#abb2bf'
      
      const programmingIndex = assignment.value.questions.findIndex(q => q.type === 'programming')
      if (programmingIndex !== -1) {
        const presetCode = assignment.value.questions[programmingIndex].presetCode
        quill.setText(presetCode || '// 在此处编写代码')
      }
      
      const length = quill.getLength()
      quill.formatLine(0, length, 'code-block', true)
      
      quill.on('text-change', () => {
        const length = quill.getLength()
        quill.formatLine(0, length, 'code-block', true)
      })
      
      quill.keyboard.addBinding({
        key: 'Tab',
        shiftKey: false,
        handler: (range) => {
          quill.insertText(range.index, '  ')
          return false
        }
      })
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const removeFile = (questionIndex, fileIndex) => {
      answers.value[questionIndex].attachments.splice(fileIndex, 1)
      ElMessage.success('文件已删除')
    }

    const downloadFile = (file) => {
      try {
        const base64Data = file.content.split(',')[1]
        const binaryData = atob(base64Data)
        const byteArray = new Uint8Array(binaryData.length)
        for (let i = 0; i < binaryData.length; i++) {
          byteArray[i] = binaryData.charCodeAt(i)
        }
        const blob = new Blob([byteArray])

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('文件下载失败:', error)
        ElMessage.error('文件下载失败')
      }
    }

    const getAssignmentType = (type) => {
      const typeMap = {
        'individual': '个人作业',
        'group': '小组作业'
      }
      return typeMap[type || 'individual'] || '个人作业'
    }

    const runCode = async (index) => {
      runningCode.value = true
      try {
        const question = assignment.value.questions[index]
        if (!question.selectedLanguage) {
          ElMessage.warning('未指定编程语言')
          return
        }

        const response = await axios.post(`/api/code/run/${route.params.assignmentId}`, {
          code: answers.value[index].answer,
          language: question.selectedLanguage,
          codeType: question.type,
          testCases: []  // 如果有测试用例可以在这里添加
        })

        runResult.value = {
          status: response.data.success ? 'success' : 'error',
          output: response.data.output || response.data.error
        }
      } catch (error) {
        console.error('运行代码失败:', error)
        runResult.value = {
          status: 'error',
          output: error.response?.data?.message || '运行失败'
        }
      } finally {
        runningCode.value = false
      }
    }

    const addMember = (member) => {
      if (member && !selectedMembers.value.some(m => m.userId === member.userId)) {
        const limit = assignment.value.settings.groupMemberLimit || 4
        if (selectedMembers.value.length < limit) {
          selectedMembers.value.push(member)
          selectedMember.value = null
        } else {
          ElMessage.warning(`小组成员不能超过 ${limit} 人`)
        }
      }
    }
    
    const removeMember = (member) => {
      selectedMembers.value = selectedMembers.value.filter(m => m.userId !== member.userId)
    }

    return {
      assignment,
      answers,
      handleFileChange,
      submitAssignment,
      getQuestionType,
      onEditorReady,
      formatFileSize,
      removeFile,
      downloadFile,
      getAssignmentType,
      hljs,
      runCode,
      runningCode,
      runResult,
      selectedMembers,
      memberOptions,
      selectedMember,
      loading,
      searchMembers,
      addMember,
      removeMember,
      getCourseStudents,
      route
    }
  }
}
</script>

<style scoped>
.submit-assignment-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 48px);
}

.assignment-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-container {
  padding: 24px;
}

.info-section, .settings-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #409EFF;
}

.info-content p {
  margin: 8px 0;
  color: #606266;
  line-height: 1.6;
}

.info-content strong {
  color: #303133;
  font-weight: 600;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.setting-item {
  background-color: #f8f9fb;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
}

.setting-label {
  color: #909399;
  margin-right: 12px;
  font-size: 14px;
}

.setting-value {
  color: #303133;
  font-weight: 500;
}

.question-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.question-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 18px;
  background-color: #409EFF;
  border-radius: 2px;
  margin-right: 8px;
}

.question-type {
  background-color: #ecf5ff;
  color: #409EFF;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.question-content {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 24px;
  font-size: 15px;
  background-color: #f8f9fb;
  padding: 20px 24px;
  margin: 0 20px 24px 20px;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.code-editor {
  width: 100%;
  margin: 0 20px;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.ql-container) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 14px !important;
  background-color: #282c34 !important;
  border: none !important;
  border-radius: 8px;
  width: 100% !important;
}

.upload-button {
  margin-top: 16px;
}

.uploaded-files {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fb;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.uploaded-files-header {
  margin-bottom: 16px;
  color: #606266;
  font-weight: 500;
}

.submit-section {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 24px 0;
}

.submit-section :deep(.el-button) {
  padding: 12px 36px;
  font-size: 16px;
  font-weight: 500;
  height: auto;
  transition: all 0.3s ease;
}

.submit-section :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.blank-answer {
  margin-bottom: 16px;
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.blank-answer :deep(.el-input) {
  width: 100%;
  margin-top: 8px;
}

.blank-answer :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-radio), :deep(.el-checkbox) {
  margin-bottom: 12px;
  width: 100%;
  padding: 16px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  background-color: #ffffff;
}

:deep(.el-radio:hover), :deep(.el-checkbox:hover) {
  background-color: #ecf5ff;
  border-color: #409EFF;
}

.no-questions {
  text-align: center;
  padding: 48px 0;
}

@media screen and (max-width: 768px) {
  .submit-assignment-container {
    padding: 16px;
  }
  
  .content-container {
    padding: 16px;
  }
  
  .settings-content {
    grid-template-columns: 1fr;
  }
  
  .question-card {
    padding: 16px;
  }
}

.question-files {
  margin: 16px 20px;
  background-color: #f8f9fb;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.files-header {
  padding: 12px 16px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e4e7ed;
}

.files-header h5 {
  margin: 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.files-list {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-item:hover {
  background-color: #ecf5ff;
  border-color: #409EFF;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.1);
}

.file-name {
  color: #409EFF;
  font-size: 14px;
}

.file-item .el-icon {
  color: #409EFF;
  font-size: 16px;
}

.file-item::after {
  content: "点击下载";
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.editor-container {
  width: 100%;
  margin: 0 20px;
}

:deep(.el-textarea) {
  width: 100%;
}

:deep(.el-textarea__inner) {
  width: 100%;
  min-height: 150px !important;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 16px;
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-textarea__inner:focus) {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.code-actions {
  padding: 12px;
  background-color: #f8f9fb;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
}

.run-result {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.result-header {
  padding: 12px 16px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  color: #606266;
}

.result-content {
  margin: 0;
  padding: 16px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  background-color: #282c34;
  color: #abb2bf;
}

.result-content.success {
  border-left: 4px solid #67c23a;
}

.result-content.error {
  border-left: 4px solid #f56c6c;
}

.group-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-members {
  background-color: #f8f9fb;
  border-radius: 8px;
  padding: 16px;
}

.members-header {
  margin-bottom: 12px;
  color: #606266;
  font-weight: 500;
}

.member-tag {
  margin: 4px;
}

.member-info {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

:deep(.el-select) {
  width: 100%;
}

.code-header {
  padding: 8px 12px;
  background-color: #f8f9fb;
  border: 1px solid #e4e7ed;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.language-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #409EFF;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
</style> 