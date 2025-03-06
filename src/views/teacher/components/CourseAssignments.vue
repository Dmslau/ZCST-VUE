<template>
  <div class="assignments-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">作业列表</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索作业..."
              class="search-input"
              clearable
              @input="handleSearch"
            />
          </div>
          <el-button type="primary" @click="handleAdd">布置作业</el-button>
        </div>
      </template>

      <el-table :data="filteredAssignments" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="作业标题" />
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.publish_time) }}
          </template>
        </el-table-column>
        <el-table-column label="截止日期" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.deadline) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleView(row)">查看</el-button>
              <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 重新设计的作业表单对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '布置作业' : '编辑作业'"
      v-model="dialogVisible"
      width="90%"
      :before-close="handleClose"
      class="assignment-dialog"
    >
      <el-form 
        :model="assignmentForm" 
        :rules="rules" 
        ref="assignmentFormRef" 
        label-width="120px"
        class="assignment-form"
      >
        <!-- 基本信息部分 -->
        <div class="form-section">
          <div class="section-title">基本信息</div>
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="assignmentForm.title" placeholder="请输入作业标题" />
        </el-form-item>

          <el-form-item label="发布方式" prop="publishType">
            <el-radio-group v-model="assignmentForm.publishType">
              <el-radio label="immediate">立即发布</el-radio>
              <el-radio label="scheduled">定时发布</el-radio>
            </el-radio-group>
        </el-form-item>
          
          <el-form-item 
            v-if="assignmentForm.publishType === 'scheduled'"
            label="发布时间" 
            prop="publishTime"
          >
            <el-date-picker
              v-model="assignmentForm.publishTime"
              type="datetime"
              placeholder="选择发布时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              :disabled-date="disablePastDates"
            />
          </el-form-item>
          
          <el-form-item label="截止日期" prop="deadline">
            <el-date-picker
              v-model="assignmentForm.deadline"
              type="datetime"
              placeholder="选择截止日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              :disabled-date="disableInvalidDates"
            />
          </el-form-item>
        </div>

        <!-- 提交设置部分 -->
        <div class="form-section">
          <div class="section-title">提交设置</div>
          
          <!-- 添加小组作业设置 -->
          <el-form-item label="作业类型">
            <el-radio-group v-model="assignmentForm.isGroupWork">
              <el-radio :label="false">个人作业</el-radio>
              <el-radio :label="true">小组作业</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 当选择小组作业时显示小组人数设置 -->
          <el-form-item 
            v-if="assignmentForm.isGroupWork" 
            label="小组人数"
            prop="groupMemberLimit"
          >
            <el-input-number 
              v-model="assignmentForm.groupMemberLimit"
              :min="2"
              :max="10"
              :step="1"
              size="default"
              controls-position="right"
            />
            <span class="input-help">每组支持 2-10 人</span>
          </el-form-item>

          <!-- 原有的提交次数设置 -->
          <el-form-item label="提交次数">
            <el-radio-group v-model="assignmentForm.allowMultipleSubmissions">
              <el-radio :label="false">仅允许提交一次</el-radio>
              <el-radio :label="true">允许多次提交</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 修改附件提交设置 -->
          <el-form-item label="附件提交">
            <el-switch
              v-model="assignmentForm.allowAttachments"
              active-text="允许"
              inactive-text="不允许"
            />
          </el-form-item>
        </div>

        <!-- 成绩设置部分 -->
        <div class="form-section">
          <div class="section-title">成绩设置</div>
          <el-form-item label="成绩公布" prop="gradeVisibility">
            <el-select v-model="assignmentForm.gradeVisibility" placeholder="选择成绩可见性">
              <el-option label="不可见" value="never"></el-option>
              <el-option label="自己可见" value="private"></el-option>
              <el-option label="公开" value="public"></el-option>
          </el-select>
        </el-form-item>

          <!-- 添加答案公布设置 -->
          <el-form-item label="答案公布" prop="answerVisibility">
            <el-select v-model="assignmentForm.answerVisibility" placeholder="选择答案可见性">
              <el-option label="不公布" value="never"></el-option>
              <el-option label="截止后可见" value="after_deadline"></el-option>
              <el-option label="批改后可见" value="after_grading"></el-option>
            </el-select>
          </el-form-item>
        </div>

        <!-- 作业内容部分 -->
        <div class="form-section">
          <div class="section-title">作业内容</div>
          
          <!-- 题目列表 -->
          <div 
            v-for="(question, index) in assignmentForm.questions" 
            :key="index"
            class="question-item"
          >
            <div class="question-header">
              <div class="question-header-left">
                <span class="question-title">
                  {{ assignmentForm.questions.length === 1 ? '题目' : `第 ${index + 1} 题` }}
                </span>
                <el-select 
                  v-model="question.type" 
                  size="small"
                  class="question-type-select"
                  @change="() => watchQuestionType(question)"
                >
                  <el-option label="问答题" value="essay" />
                  <el-option label="填空题" value="blank" />
                  <el-option label="单选题" value="single" />
                  <el-option label="多选题" value="multiple" />
                  <el-option label="编程题" value="programming" />
                </el-select>
                <el-switch
                  v-if="question.type !== 'essay'"
                  v-model="question.enableAutoGrading"
                  active-text="自动批改"
                  @change="handleAutoGradingChange(question)"
                />
              </div>
              <div class="question-actions">
                <el-button 
                  v-if="index > 0"
                  type="danger" 
                  link
                  @click="removeQuestion(index)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                  </el-button>
              </div>
            </div>

            <el-form-item 
              :prop="`questions.${index}.content`"
              :rules="{ required: true, message: '请输入题目内容', trigger: 'blur' }"
            >
              <div class="question-content">
                <div class="editor-wrapper">
                  <div class="editor-header">
                    <div class="editor-title">题目内容</div>
              <el-upload
                      class="upload-btn"
                :auto-upload="false"
                :show-file-list="false"
                      accept=".txt,.pdf,.doc,.docx"
                      @change="(file) => handleFileUpload(file, index)"
                    >
                      <el-button type="primary" link>
                        <el-icon><Upload /></el-icon>
                        上传文件
                  </el-button>
              </el-upload>
                  </div>
                  <div class="editor-container">
                    <div 
                      v-show="!editorReady || !dialogVisible" 
                      class="editor-placeholder"
                    ></div>
                    <Editor
                      v-show="editorReady && dialogVisible"
                      class="editor-content"
                      v-model="question.content"
                      :defaultConfig="{
                        ...editorConfig,
                        placeholder: getPlaceholder(question, index)
                      }"
                      :mode="mode"
                      @onCreated="handleCreated($event, index)"
                      @onChange="handleChange"
                      @onDestroyed="handleDestroyed"
                    />
                  </div>
                </div>
                <div v-if="question.attachedFiles && question.attachedFiles.length > 0" class="attached-files">
                  <div v-for="(file, fileIndex) in question.attachedFiles" :key="fileIndex" class="file-item">
                    <span class="file-name">{{ file.name }}</span>
                    <el-button type="danger" link @click="removeFile(index, fileIndex)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </el-form-item>

            <!-- 选项设置部分（单选题和多选题） -->
            <div v-if="question.type === 'single' || question.type === 'multiple'" class="options-section">
              <div 
                v-for="(option, optionIndex) in question.options" 
                :key="optionIndex"
                class="option-item"
              >
                <el-input
                  v-model="option.content"
                  :placeholder="`选项 ${String.fromCharCode(65 + optionIndex)}`"
                >
                  <template #prepend>
                    {{ String.fromCharCode(65 + optionIndex) }}
                </template>
                </el-input>
                <el-button 
                  type="danger" 
                  circle 
                  size="small"
                  @click="removeOption(question, optionIndex)"
                  :disabled="question.options.length <= 2"
                >
                  <el-icon><Delete /></el-icon>
                  </el-button>
              </div>
              <div class="options-actions">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="addOption(question)"
                  :disabled="question.options.length >= 6"
                >
                  添加选项
                </el-button>
              </div>
            </div>

            <!-- 在题目内容部分，答案部分之前添加填空题设置 -->
            <template v-if="question.type === 'blank'">
              <div class="blank-settings">
                <el-form-item label="填空数量">
                  <el-input-number 
                    v-model="question.blankCount"
                    :min="1"
                    :max="10"
                    @change="() => handleBlankCountChange(question)"
                  />
                </el-form-item>
              </div>
                </template>

            <!-- 原有的答案部分保持不变 -->
            <div v-if="shouldShowAnswerSection(question)" class="answer-section">
              <!-- 填空题答案 -->
              <template v-if="question.type === 'blank'">
                <div class="blank-answers">
                  <div v-for="(blank, index) in question.blanks" :key="index" class="blank-answer">
                    <el-form-item :label="`填空 ${index + 1} 答案`">
                      <el-input v-model="blank.answer" placeholder="请输入答案" />
                    </el-form-item>
            </div>
                </div>
              </template>

              <!-- 问答题答案 -->
              <template v-else-if="question.type === 'essay'">
                <el-form-item 
                  :label="getAnswerLabel(question)"
                  :prop="`questions.${index}.answer`"
                  :rules="getAnswerRules(question)"
                >
              <el-input
                    v-model="question.answer"
                type="textarea"
                    rows="3"
                    :placeholder="question.enableAutoGrading ? '请输入标准答案' : '请输入参考答案'"
                  />
                </el-form-item>
              </template>

              <!-- 选择题答案 -->
              <template v-else-if="question.type === 'single' || question.type === 'multiple'">
                <div class="choice-answers">
                  <!-- 单选题答案 -->
                  <template v-if="question.type === 'single'">
                    <el-radio-group v-model="question.answer">
                      <div 
                        v-for="(option, optIndex) in question.options" 
                        :key="optIndex"
                        class="answer-option"
                      >
                        <el-radio :label="String.fromCharCode(65 + optIndex)">
                          选项 {{ String.fromCharCode(65 + optIndex) }}：{{ option.content }}
                        </el-radio>
                      </div>
                    </el-radio-group>
                      </template>

                  <!-- 多选题答案 -->
                  <template v-else>
                    <el-checkbox-group v-model="question.answer">
                      <div 
                        v-for="(option, optIndex) in question.options" 
                        :key="optIndex"
                        class="answer-option"
                      >
                        <el-checkbox :label="String.fromCharCode(65 + optIndex)">
                          选项 {{ String.fromCharCode(65 + optIndex) }}：{{ option.content }}
                        </el-checkbox>
                    </div>
                    </el-checkbox-group>
                  </template>
                </div> 
              </template>

              <!-- 编程题答案部分 -->
              <template v-else-if="question.type === 'programming'">
                <div class="programming-answer">
                  <el-tabs v-model="question.activeTab">
                    <!-- 预设代码（必填） -->
                    <el-tab-pane label="预设代码" name="code">
                      <div class="code-editor-container">
                        <div class="code-description">
                          ---------------学生开始答题时可以看到的初始代码，可以预先设置一些必要的代码结构。---------------
                        </div>
                        <div class="code-editor-header">
                          <el-select v-model="question.selectedLanguage" placeholder="选择语言">
                            <el-option label="JavaScript" value="javascript"></el-option>
                            <el-option label="Python" value="python"></el-option>
                            <el-option label="Java" value="java"></el-option>
                            <el-option label="C++" value="cpp"></el-option>
                          </el-select>
                        </div>
                        <div class="code-editor-wrapper">
                          <textarea
                            v-model="question.presetCode"
                            class="code-editor"
                            :placeholder="presetCodePlaceholder"
                            spellcheck="false"
                            @keydown.tab.prevent="handleTab"
                            rows="12"
                          ></textarea>
                        </div>
                      </div>
                    </el-tab-pane>

                    <!-- 参考代码（仅在需要公布答案时显示） -->
                    <el-tab-pane 
                      v-if="assignmentForm.answerVisibility !== 'never'"
                      label="参考代码" 
                      name="answer"
                    >
                      <div class="code-editor-container">
                        <div class="code-description">
                          {{ question.enableAutoGrading ? 
                            '用于自动判定的标准代码，需要能通过所有测试用例。' :
                            '作为参考的示例代码，学生可以在答案公布后查看。'
                          }}
                        </div>
                        <div class="code-editor-header">
                          <el-select v-model="question.selectedLanguage" placeholder="选择语言">
                            <el-option label="JavaScript" value="javascript"></el-option>
                            <el-option label="Python" value="python"></el-option>
                            <el-option label="Java" value="java"></el-option>
                            <el-option label="C++" value="cpp"></el-option>
                          </el-select>
                        </div>
                        <div class="code-editor-wrapper">
                          <textarea
                            v-model="question.answer"
                            class="code-editor"
                            :placeholder="answerCodePlaceholder"
                            spellcheck="false"
                            @keydown.tab.prevent="handleTab"
                            rows="12"
                          ></textarea>
                        </div>
                      </div>
                    </el-tab-pane>
                    
                    <!-- 测试用例（仅在自动批改时显示） -->
                    <el-tab-pane 
                      v-if="question.enableAutoGrading"
                      label="测试用例" 
                      name="testcases"
                    >
                      <div class="testcases">
                        <div class="code-description">
                          添加测试用例来验证学生提交的代码是否正确。每个测试用例包含输入数据和期望的输出结果。
                        </div>
                        <div 
                          v-for="(testcase, testIndex) in question.testcases" 
                          :key="testIndex"
                          class="testcase-item"
                        >
                          <div class="testcase-header">
                            <span class="testcase-title">测试用例 {{ testIndex + 1 }}</span>
                            <el-button 
                              v-if="question.testcases.length > 1"
                              type="danger" 
                              circle 
                              size="small"
                              @click="removeTestcase(question, testIndex)"
                            >
                              <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                          <div class="testcase-content">
                            <el-input
                              v-model="testcase.input"
                              type="textarea"
                              rows="3"
                              placeholder="输入数据"
                              class="testcase-input"
                            />
                            <el-input
                              v-model="testcase.output"
                              type="textarea"
                              rows="3"
                              placeholder="期望输出"
                              class="testcase-output"
                            />
              </div>
            </div>
          </div>
                    </el-tab-pane>
                  </el-tabs>
                </div>
              </template>
            </div>

            <!-- 添加分数设置 -->
            <el-form-item 
              v-if="assignmentForm.enableAutoGrading"
              :label="`题目分值`"
              :prop="`questions.${index}.score`"
            >
              <el-input-number
                v-model="question.score"
                :min="0"
                :max="assignmentForm.totalScore"
                :step="1"
                size="small"
              />
              <span class="input-help">分值范围：0-{{ assignmentForm.totalScore }} 分</span>
        </el-form-item>
          </div>
        </div>

        <!-- 添加题目按钮 -->
        <div class="add-question">
          <el-button type="primary" @click="addQuestion">添加题目</el-button>
        </div>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ dialogType === 'add' ? '发布作业' : '保存修改' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="作业提交情况"
      width="80%"
    >
      <el-table 
        :data="submissions" 
        v-loading="submissionsLoading"
        style="width: 100%"
      >
        <el-table-column prop="student.username" label="学生姓名" width="120" />
        <el-table-column prop="student.className" label="班级" width="120" />
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime) }}
          </template>
        </el-table-column>
        <el-table-column label="提交内容">
          <template #default="{ row }">
            <div v-if="row.submitContent">
              {{ formatSubmitContent(row.submitContent) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small"
              @click="viewSubmissionDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.assignments-container {
  padding: 20px;
}

.form-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dcdfe6;
}

.assignment-form :deep(.el-form-item) {
  margin: 0;
  padding: 0;
  width: 100%;
}

.assignment-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.question-item {
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-title {
  font-weight: bold;
  color: #303133;
}

.question-actions {
  display: flex;
  gap: 12px;
}

.answer-section {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.add-question {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.question-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-type-select {
  width: 120px;
}

.options-section {
  margin: 16px 0;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.option-item:last-child {
  margin-bottom: 0;
}

.options-actions {
  margin-top: 12px;
}

.programming-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.code-block-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background-color: #fff;
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.code-editor {
  font-family: "Courier New", Consolas, monospace;
  font-size: 14px;
}

:deep(.code-editor .el-textarea__inner) {
  font-family: "Courier New", Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  background-color: #f8f9fa;
}

.question-content {
  margin-bottom: 16px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  width: 100%;
  margin-bottom: 16px;
}

.editor-wrapper {
  position: relative;
  width: 100%;
}

.editor-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
}

.editor-content {
  width: 100% !important;
}

:deep(.w-e-editor-container),
:deep(.w-e-text-container),
:deep(.w-e-toolbar),
:deep(.w-e-scroll) {
  width: 100% !important;
  min-width: 100% !important;
}

:deep(.w-e-text-container) {
  background-color: #fff !important;
  z-index: 1;
  min-height: 300px !important;
}

:deep(.w-e-toolbar) {
  border-bottom: 1px solid #dcdfe6;
  background-color: #f5f7fa;
  z-index: 2;
}

:deep(.w-e-text-container[contenteditable=true]) {
  min-height: 300px !important;
}

/* 确保编辑器在对话框中正确显示 */
:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-form-item__content) {
  width: 100%;
}

/* 暗色模式 */
.dark-theme {
  --w-e-toolbar-color: #fff;
  --w-e-toolbar-bg-color: #333;
  --w-e-textarea-color: #fff;
  --w-e-textarea-bg-color: #333;
}

/* 优化对话框布局 */
:deep(.assignment-dialog .el-dialog) {
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 90vh;
  max-width: 1200px;
}

:deep(.assignment-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.input-help {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

/* 优化数字输入框样式 */
:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
}

.setting-help {
  margin-top: 8px;
}

:deep(.el-alert) {
  margin-top: 8px;
  margin-bottom: 16px;
}

:deep(.el-alert__description) {
  margin-top: 4px;
  font-size: 12px;
}

:deep(.el-switch) {
  margin-right: 8px;
}

.blank-answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.blank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.blank-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.blank-label {
  min-width: 80px;
  color: #606266;
}

.blank-input {
  width: 200px;
}

.blank-actions {
  display: flex;
  gap: 8px;
}

.testcases {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.testcase-item {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.testcase-content {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.testcase-input,
.testcase-output {
  flex: 1;
}

.programming-answer {
  margin-top: 16px;
}

.choice-answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-option {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

:deep(.el-checkbox), :deep(.el-radio) {
  width: 100%;
  margin-right: 0;
  margin-bottom: 0;
}

:deep(.el-checkbox__label), :deep(.el-radio__label) {
  white-space: normal;
  word-break: break-all;
}

.programming-tabs {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
}

.code-section {
  margin-bottom: 20px;
}

.code-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.code-editor {
  width: 100%;
  padding: 12px;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f8f9fa;
  resize: none; /* 禁止调整大小 */
  overflow: auto; /* 允许滚动 */
}

/* 代码高亮样式 */
.code-editor::placeholder {
  color: #999;
  font-style: italic;
}

/* 代码高亮效果 */
.code-editor {
  white-space: pre; /* 保持空格和换行 */
  overflow-wrap: break-word; /* 允许换行 */
}

.testcase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.testcase-title {
  font-weight: bold;
  color: #303133;
}

.testcase-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #dcdfe6;
}

:deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 20px;
}

:deep(.el-tabs__item.is-active) {
  font-weight: bold;
}

.code-editor-wrapper {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #1e1e1e;
}

.code-editor {
  font-family: 'Consolas', 'Monaco', monospace;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', monospace;
  padding: 12px;
  line-height: 1.6;
}

:deep(.el-textarea__inner::placeholder) {
  color: #5c6370;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

/* 添加简单的代码语法颜色 */
:deep(.el-textarea__inner) {
  /* 关键字 */
  & .keyword {
    color: #c678dd;
  }
  /* 字符串 */
  & .string {
    color: #98c379;
  }
  /* 注释 */
  & .comment {
    color: #5c6370;
    font-style: italic;
  }
  /* 函数 */
  & .function {
    color: #61afef;
  }
}

.code-editor-container {
  margin: 16px 0;
}

.code-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #1e1e1e;
}

.code-editor-header {
  background-color: #252526;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  color: #d4d4d4;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.code-editor {
  width: 100%;
  padding: 12px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  resize: none;
  outline: none;
  tab-size: 2;
}

.code-editor::placeholder {
  color: #666;
  font-style: italic;
}

/* 滚动条样式 */
.code-editor::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.code-editor::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-editor::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 6px;
  border: 3px solid #1e1e1e;
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}

/* 选中文本的样式 */
.code-editor::selection {
  background-color: #264f78;
  color: #fff;
}

/* 标签页样式优化 */
:deep(.el-tabs__item) {
  font-size: 14px;
  height: 40px;
  line-height: 40px;
}

:deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.blank-settings {
  margin-top: 16px;
}

.blank-answer {
  margin-top: 8px;
}

.editor-wrapper {
  position: relative;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  width: 100%;
}

.editor-title {
  font-weight: bold;
}

.attached-files {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  width: 100%;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.file-name {
  color: #606266;
  font-size: 14px;
}

/* 编辑器相关样式 */
:deep(.editor-content) {
  width: 100% !important;
}

:deep(.w-e-text-container) {
  width: 100% !important;
}

:deep(.w-e-scroll) {
  width: 100% !important;
}

:deep(.editor-content[data-w-e-textarea="true"]) {
  width: 100% !important;
  min-width: 100% !important;
}

/* 确保编辑器内容区域的宽度 */
:deep([data-slate-editor]) {
  width: 100% !important;
  min-width: 100% !important;
}

/* 编辑器容器样式 */
.question-content {
  width: 100%;
  margin: 0;
  padding: 0;
}

.editor-wrapper {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 确保所有嵌套容器都是全宽的 */
:deep(.w-e-text-container *) {
  width: 100% !important;
  box-sizing: border-box;
}

/* 调整表单项布局 */
:deep(.el-form-item) {
  margin: 0;
  padding: 0;
  width: 100%;
}

:deep(.el-form-item__content) {
  margin-left: 0 !important; /* 移除左边距 */
  width: 100%;
}

/* 编辑器容器样式 */
.question-content {
  width: 100%;
  margin: 0;
  padding: 0;
}

.editor-wrapper {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 确保编辑器相关元素都没有多余的边距 */
:deep(.w-e-text-container),
:deep(.w-e-toolbar) {
  margin: 0;
  padding: 0;
  width: 100% !important;
}

:deep(.editor-content) {
  margin: 0;
  padding: 0;
  width: 100% !important;
}
</style>

<script>
import { ref, computed, onMounted, shallowRef, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { Delete, Upload } from '@element-plus/icons-vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor } from '@wangeditor/editor-for-vue'

export default {
  name: 'CourseAssignments',
  props: {
    courseId: {
      type: [String, Number],
      required: true
    }
  },
  components: {
    Editor,
    Delete,
    Upload
  },
  setup(props) {
    const loading = ref(true)
    const assignments = ref([])
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const submitting = ref(false)
    const assignmentFormRef = ref(null)
    const assignmentForm = ref({
      courseId: props.courseId,
      title: '',
      deadline: null,
      publishType: 'immediate',
      publishTime: null,
      isGroupWork: false,
      groupMemberLimit: 2,
      allowMultipleSubmissions: false,
      allowAttachments: false,
      gradeVisibility: 'private',
      answerVisibility: 'never',
      questions: [],
      content: '',
      settings: {
        assignmentType: 'individual',
      }
    })
    const searchQuery = ref('')

    const imageUploading = ref(false)
    const fileUploading = ref(false)
    const attachments = ref([])
    const displayContent = ref('')
    const actualContent = ref('')

    // 添加文件大小限制（5MB）
    const MAX_FILE_SIZE = 5 * 1024 * 1024

    // 定义验证规则
    const rules = {
      title: [
        { required: true, message: '请输入作业标题', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      deadline: [
        { required: true, message: '请选择截止日期', trigger: 'change' }
      ]
    }

    // 禁用过去的日期
    const disablePastDates = (time) => {
      return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
    }

    // 禁用无效的截止日期
    const disableInvalidDates = (time) => {
      return time.getTime() < Date.now() - 8.64e7 // 如果是立即发布，禁用今天之前的日期
    }

    const loadAssignments = async () => {
      loading.value = true
      try {
        const response = await axios.get(`/api/assignments/course/${props.courseId}`)
        console.log('获取的作业信息:', response.data)
        assignments.value = response.data.filter(assignment => !assignment.isDeleted).map(assignment => ({
          ...assignment,
          // 解析 content 字符串为对象
          questions: JSON.parse(assignment.content).questions,
          // 确保课程 ID 存在
          courseId: assignment.course?.courseId || null
        }))
      } catch (error) {
        console.error('获取作业列表失败:', error)
        ElMessage.error('获取作业列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleAdd = () => {
      dialogType.value = 'add'
      assignmentForm.value = {
        courseId: props.courseId,
        title: '',
        deadline: null,
        publishType: 'immediate',
        publishTime: null,
        isGroupWork: false,
        groupMemberLimit: 2,
        allowMultipleSubmissions: false,
        allowAttachments: false,
        gradeVisibility: 'private',
        answerVisibility: 'never',
        questions: [],
        content: '',
        settings: {
          assignmentType: 'individual',
        }
      }
      attachments.value = []
      displayContent.value = ''
      actualContent.value = ''
      dialogVisible.value = true
    }

    const handleEdit = async (row) => {
      dialogType.value = 'edit'
      dialogVisible.value = true
      try {
        const response = await axios.get(`/api/assignments/${row.assignmentId}`)
        const assignmentData = response.data

        // 解析作业内容
        const parsedContent = JSON.parse(assignmentData.content)

        // 判断发布时间是否超过5分钟
        const publishTime = new Date(assignmentData.publish_time)
        const currentTime = new Date()
        const timeDifference = (currentTime - publishTime) / 1000 / 60 // 转换为分钟

        assignmentForm.value = {
          ...assignmentData,
          courseId: props.courseId,
          content: parsedContent,
          deadline: assignmentData.deadline,
          publishType: timeDifference > 5 ? 'scheduled' : 'immediate',
          publishTime: timeDifference > 5 ? assignmentData.publish_time : null,
          isGroupWork: assignmentData.settings.assignmentType === 'group',
          groupMemberLimit: assignmentData.settings.groupMemberLimit || 2,
          allowMultipleSubmissions: assignmentData.settings.allowMultipleSubmissions,
          allowAttachments: assignmentData.settings.allowedAttachments || [],
          gradeVisibility: assignmentData.settings.gradeVisibility,
          answerVisibility: assignmentData.settings.answerVisibility,
          questions: parsedContent.questions || [],
          settings: assignmentData.settings
        }
      } catch (error) {
        console.error('获取作业详情失败:', error)
        ElMessage.error('获取作业详情失败')
      }
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除作业 "${row.title}" 吗？此操作不可恢复！`,
        '警告',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      ).then(async () => {
        try {
          const response = await axios.delete(`http://localhost:8080/api/assignments/${row.assignmentId}`)
          if (response.status === 200 || response.status === 204) {
            ElMessage.success('删除成功')
            loadAssignments() // 刷新列表
          }
        } catch (error) {
          console.error('Error deleting assignment:', error)
          ElMessage.error(error.response?.data?.message || '删除失败')
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    const handleView = (row) => {
      viewDialogVisible.value = true
      currentAssignment.value = row
      loadSubmissions(row.assignmentId)
    }

    // 添加新的响应式变量
    const submissions = ref([])
    const submissionsLoading = ref(false)
    const viewDialogVisible = ref(false)
    const currentAssignment = ref(null)

    // 加载提交记录
    const loadSubmissions = async (assignmentId) => {
      submissionsLoading.value = true
      try {
        const response = await axios.get(`/api/submissions/assignment/${assignmentId}`)
        // 对每个学生只保留最新的提交
        const latestSubmissions = new Map()
        response.data.forEach(submission => {
          const studentId = submission.student.userId
          const existingSubmission = latestSubmissions.get(studentId)
          if (!existingSubmission || new Date(submission.submitTime) > new Date(existingSubmission.submitTime)) {
            latestSubmissions.set(studentId, submission)
          }
        })
        submissions.value = Array.from(latestSubmissions.values())
      } catch (error) {
        console.error('获取提交记录失败:', error)
        ElMessage.error('获取提交记录失败')
      } finally {
        submissionsLoading.value = false
      }
    }

    // 格式化提交内容的方法
    const formatSubmitContent = (content) => {
      try {
        const parsed = JSON.parse(content)
        return parsed.answers.map((answer, index) => {
          if (answer.answer) {
            return `题目${index + 1}: ${answer.answer}`
          } else if (answer.blanks) {
            return `题目${index + 1}: ${answer.blanks.join(', ')}`
          } else if (answer.answers) {
            return `题目${index + 1}: ${answer.answers.join(', ')}`
          }
          return `题目${index + 1}: 未作答`
        }).join('\n')
      } catch (e) {
        return '内容解析失败'
      }
    }

    // 查看提交详情
    const viewSubmissionDetail = (row) => {
      console.log('查看提交详情:', row)
      // TODO: 实现查看详情功能
    }

    // 图片压缩函数
    const compressImage = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            
            // 如果图片大于 1000px，等比例缩小
            const maxSize = 1000
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = Math.round((height * maxSize) / width)
                width = maxSize
              } else {
                width = Math.round((width * maxSize) / height)
                height = maxSize
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            
            // 压缩为 JPEG 格式，质量 0.7
            resolve(canvas.toDataURL('image/jpeg', 0.7))
          }
          img.onerror = reject
          img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    // 修改图片上传处理函数
    const handleImageUpload = async (file) => {
      if (!file) return
      
      if (file.raw.size > MAX_FILE_SIZE) {
        ElMessage.error('图片大小不能超过 5MB')
        return
      }
      
      imageUploading.value = true
      try {
        const base64 = await compressImage(file.raw)
        attachments.value.push({
          type: 'image',
          name: file.name,
          url: base64,
          marker: `[image]${base64}[/image]`
        })
        updateActualContent()
        ElMessage.success('图片插入成功')
      } catch (error) {
        console.error('Error uploading image:', error)
        ElMessage.error('图片插入失败')
      } finally {
        imageUploading.value = false
      }
    }

    // 修改文件上传处理函数
    const handleFileUpload = (file, questionIndex) => {
      if (!assignmentForm.value.questions[questionIndex].attachedFiles) {
        assignmentForm.value.questions[questionIndex].attachedFiles = []
      }

      const fileSize = file.raw.size
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (fileSize > maxSize) {
        ElMessage.error('文件大小不能超过 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        assignmentForm.value.questions[questionIndex].attachedFiles.push({
          name: file.raw.name,
          content: reader.result
        })
        ElMessage.success('文件上传成功')
      }
      reader.onerror = () => {
        ElMessage.error('文件读取失败')
      }
      reader.readAsDataURL(file.raw)
    }

    // 更新实际内容
    const updateActualContent = () => {
      actualContent.value = displayContent.value || ''
      attachments.value.forEach(item => {
        actualContent.value += '\n' + item.marker
      })
      assignmentForm.value.content = actualContent.value
    }

    // 处理内容输入
    const handleContentInput = (value) => {
      displayContent.value = value
      updateActualContent()
    }

    // 移除附件
    const removeAttachment = (index) => {
      attachments.value.splice(index, 1)
      updateActualContent()
    }

    // 渲染内容（将标记转换为 HTML）
    const renderContent = (content) => {
      if (!content) return ''
      let html = content
      
      // 替换图片标记
      html = html.replace(
        /\[image\](.*?)\[\/image\]/g,
        (match, base64) => `<img src="${base64}" style="max-width:100%;margin:8px 0;" />`
      )
      
      // 替换文件标记
      html = html.replace(
        /\[file\](.*?):(.*?)\[\/file\]/g,
        (match, name, base64) => `
          <div class="file-link">
            <i class="el-icon-document"></i>
            <a href="${base64}" download="${name}">${name}</a>
          </div>
        `
      )
      
      return html
    }

    // 对话框关闭前的处理
    const handleClose = (done) => {
      assignmentFormRef.value?.resetFields()
      attachments.value = []
      displayContent.value = ''
      actualContent.value = ''
      done()
    }

    // 修改粘贴处理函数
    const handlePaste = async (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            if (file.size > MAX_FILE_SIZE) {
              ElMessage.error('图片大小不能超过 5MB')
              return
            }
            await handleImageUpload({ raw: file })
          }
          break
        }
      }
    }

    // 修改提交表单的处理函数
    const submitForm = async () => {
      if (!assignmentFormRef.value) return
      
      try {
        await assignmentFormRef.value.validate()
        submitting.value = true
        const formData = { ...assignmentForm.value }
        
        // 构建要提交的数据
        const submitData = {
          title: formData.title,
          deadline: formData.deadline,
          publish_time: formData.publishType === 'immediate' 
            ? new Date().toISOString() 
            : formData.publishTime,
          courseId: props.courseId,
              course: {
                courseId: props.courseId
          },
          content: JSON.stringify({
            questions: formData.questions.map(question => ({
              ...question,
              type: question.type,
              content: question.content,
              options: question.options || [],
              blanks: question.blanks || [],
              presetCode: question.presetCode || '',
              testcases: question.testcases || [],
              attachedFiles: question.attachedFiles || []
            }))
          }),
          settings: {
            assignmentType: formData.isGroupWork ? 'group' : 'individual',
            groupMemberLimit: formData.isGroupWork ? formData.groupMemberLimit : null,
            allowMultipleSubmissions: formData.allowMultipleSubmissions,
            allowedAttachments: formData.allowAttachments,
            gradeVisibility: formData.gradeVisibility,
            answerVisibility: formData.answerVisibility
              }
            }

            if (dialogType.value === 'edit') {
          // 编辑作业时保留原有的课程信息
          const response = await axios.get(`/api/assignments/${formData.assignmentId}`)
          submitData.course = response.data.course || { courseId: props.courseId }
          
          await axios.put(`/api/assignments/${formData.assignmentId}`, submitData)
          ElMessage.success('作业更新成功')
            } else {
          await axios.post('/api/assignments', submitData)
          ElMessage.success('作业创建成功')
            }
            
              dialogVisible.value = false
        loadAssignments()
          } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
          } finally {
            submitting.value = false
          }
    }

    // 获取状态类型
    const getStatusType = (deadline) => {
      if (!deadline) return 'info'
      const now = new Date()
      const deadlineDate = new Date(deadline)
      if (deadlineDate < now) return 'danger'
      if (deadlineDate - now < 24 * 60 * 60 * 1000) return 'warning'
      return 'success'
    }

    // 获取状态标签
    const getStatusLabel = (deadline) => {
      if (!deadline) return '未设置'
      const now = new Date()
      const deadlineDate = new Date(deadline)
      if (deadlineDate < now) return '已截止'
      if (deadlineDate - now < 24 * 60 * 60 * 1000) return '即将截止'
      return '进行中'
    }

    // 格式化日期时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 处理搜索
    const handleSearch = () => {
      loadAssignments()
    }

    // 修改添加新题目的方法
    const addQuestion = () => {
      if (assignmentForm.value.questions.length < 10) {
        assignmentForm.value.questions.push({
          type: 'essay',
          content: '',
          answer: '',
          showAnswer: false,
          score: 0,
          blanks: [], // 初始化为空数组
          blankCount: 1, // 添加填空数量字段
          testcases: [{ input: '', output: '' }],
          activeTab: 'code',
          options: [
            { content: '' },
            { content: '' }
          ],
          presetCode: '',
          selectedLanguage: 'javascript',
          attachedFiles: []
        })

        // 等待 DOM 更新后初始化新的编辑器
        nextTick(() => {
          // 先设置为 false 触发重新渲染
          editorReady.value = false
          setTimeout(() => {
            editorReady.value = true
            // 等待编辑器创建完成后触发 resize
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'))
            }, 50)
          }, 50)
        })
      }
    }

    // 修改题目类型变化的监听方法
    const watchQuestionType = (question) => {
      // 根据题目类型初始化答案
      if (question.type === 'multiple') {
        question.answer = [] // 多选题答案初始化为空数组
      } else {
        question.answer = '' // 其他题型初始化为空字符串
      }
      
      question.enableAutoGrading = false
      
      if (question.type === 'blank') {
        question.blanks = [{
          answer: '',
          isCorrect: false
        }]
      } else if (question.type === 'programming') {
        question.presetCode = ''
        question.answer = ''
        question.testcases = []
        question.activeTab = 'code'
      } else if (question.type === 'single' || question.type === 'multiple') {
        question.options = [
          { content: '' },
          { content: '' }
        ]
      }
    }

    // 删除题目
    const removeQuestion = (index) => {
      assignmentForm.value.questions.splice(index, 1)
    }

    // 切换答案显示状态
    const toggleAnswer = (index) => {
      assignmentForm.value.questions[index].showAnswer = 
        !assignmentForm.value.questions[index].showAnswer
    }

    // 添加选项
    const addOption = (question) => {
      if (question.options.length < 6) {
        question.options.push({ content: '' })
      }
    }

    // 删除选项
    const removeOption = (question, index) => {
      if (question.options.length > 2) {
        question.options.splice(index, 1)
        // 如果删除的是已选中的答案，清空答案
        if (question.type === 'single') {
          const optionLabel = String.fromCharCode(65 + index)
          if (question.answer === optionLabel) {
            question.answer = ''
          }
        } else if (question.type === 'multiple') {
          const optionLabel = String.fromCharCode(65 + index)
          const answerIndex = question.answer.indexOf(optionLabel)
          if (answerIndex > -1) {
            question.answer.splice(answerIndex, 1)
          }
        }
      }
    }

    // 修改 getPlaceholder 函数，添加 index 参数
    const getPlaceholder = (question, index) => {
      if (question.type === 'programming') {
        return '请输入题目要求'
      }
      return assignmentForm.value.questions.length === 1 ? 
        '请输入题目内容' : 
        `请输入第 ${index + 1} 题内容`
    }

    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef({})
    
    // 内容 HTML
    const valueHtml = ref('')

    // 模式
    const mode = ref('default')

    // 工具栏配置
    const toolbarConfig = {
      excludeKeys: [] // 可以配置需要排除的功能键
    }

    const editorReady = ref(false)

    // 修改对话框显示状态的监听
    watch(() => dialogVisible.value, (newVal) => {
      if (newVal) {
        // 先让对话框完全展开
        setTimeout(() => {
          // 再初始化编辑器
          nextTick(() => {
            editorReady.value = true
            // 最后触发 resize
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'))
              // 触发所有编辑器的 change 事件
              Object.values(editorRef.value).forEach(editor => {
                if (editor && !editor.getHtml()) {
                  editor.emit('change')
                }
              })
            }, 100)
          })
        }, 300)
      } else {
        editorReady.value = false
      }
    })

    // 修改创建编辑器的处理函数
    const handleCreated = (editor, questionIndex) => {
      editorRef.value[questionIndex] = editor
      // 确保编辑器正确渲染
      nextTick(() => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
          // 如果编辑器内容为空，触发一次 change 事件
          if (!editor.getHtml()) {
            editor.emit('change')
          }
        }, 100)
      })
    }

    const handleChange = () => {
      // 可以实现自动保存等功能
    }

    const handleDestroyed = () => {
      editorRef.value = null
    }

    // 添加编辑器配置
    const editorConfig = {
      placeholder: '请输入内容...',
      autoFocus: false,
      scroll: true,
      autoHeight: true,
      minHeight: 150,
      maxHeight: 500,
      customAlert: (info, type) => {
        if (type === 'error') {
          ElMessage.error(info)
        }
      },
      MENU_CONF: {
        uploadImage: {
          base64LimitSize: 10 * 1024 * 1024,
          customUpload(file, insertFn) {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
              const url = reader.result
              insertFn(url)
            }
          }
        },
        uploadVideo: {
          // eslint-disable-next-line no-unused-vars
          customUpload(file, insertFn) {
            ElMessage.warning('暂不支持视频上传')
          }
        },
        codeSelectLang: {
          codeLangs: [
            { text: 'Python', value: 'python' },
            { text: 'Java', value: 'java' },
            { text: 'JavaScript', value: 'javascript' },
            { text: 'C++', value: 'cpp' }
          ]
        }
      }
    }

    // 判断是否显示答案代码标签页
    const shouldShowAnswerCode = (question) => {
      // 如果开启了自动批改，需要显示标准代码
      if (question.enableAutoGrading) {
        return true
      }
      // 如果答案从不公布，不显示答案代码
      if (assignmentForm.value.answerVisibility === 'never') {
        return false
      }
      // 其他情况（答案会在某个时间点公布）显示答案代码
      return true
    }

    // 修改判断是否应该显示答案设置区域的函数
    const shouldShowAnswerSection = (question) => {
      // 编程题只显示预设代码部分
      if (question.type === 'programming') {
        return true
      }
      // 如果开启了自动批改，必须显示答案设置
      if (question.enableAutoGrading) {
        return true
      }
      // 如果答案会公布，显示答案设置
      if (assignmentForm.value.answerVisibility !== 'never') {
        return true
      }
      // 其他情况不显示答案设置
      return false
    }

    // 修改获取答案标签的函数
    const getAnswerLabel = (question) => {
      if (question.enableAutoGrading) {
        switch (question.type) {
          case 'single':
          case 'multiple':
            return '正确答案'
          case 'blank':
            return '标准答案'
          case 'programming':
            return '标准代码'
          default:
            return '标准答案'
        }
      }
      return '参考答案'
    }

    // 修改获取答案验证规则的函数
    const getAnswerRules = (question) => {
      if (question.enableAutoGrading) {
        switch (question.type) {
          case 'blank':
            return [{
              validator: (rule, value, callback) => {
                const emptyBlanks = question.blanks.some(blank => !blank.answer.trim())
                if (emptyBlanks) {
                  callback(new Error('请输入所有空格的答案'))
                } else {
                  callback()
                }
              },
              trigger: 'blur'
            }]
          case 'single':
            return [{ required: true, message: '请选择正确答案', trigger: 'change' }]
          case 'multiple':
            return [{
              validator: (rule, value, callback) => {
                if (!value || value.length === 0) {
                  callback(new Error('请至少选择一个正确答案'))
                } else {
                  callback()
                }
              },
              trigger: 'change'
            }]
          // ... 其他题型验证规则保持不变 ...
        }
      }
      return []
    }

    // 计算题目总分
    const calculateTotalScore = (question) => {
      return question.blanks.reduce((total, blank) => total + (blank.score || 0), 0)
    }

    // 更新题目总分
    const updateTotalScore = (question) => {
      question.score = calculateTotalScore(question)
    }

    // 修改添加空格的函数
    const addBlank = (question) => {
      question.blanks.push({
        answer: '',
        isCorrect: false
      })
    }

    // 删除空格
    const removeBlank = (question, index) => {
      question.blanks.splice(index, 1)
    }

    // 添加编程题测试用例相关方法
    const addTestcase = (question) => {
      question.testcases.push({ input: '', output: '' })
    }

    const removeTestcase = (question, index) => {
      question.testcases.splice(index, 1)
    }

    // 修改处理自动批改开关变化的函数
    const handleAutoGradingChange = (question) => {
      if (question.enableAutoGrading) {
        if (question.type === 'programming') {
          question.testcases = [{ input: '', output: '' }]
          question.activeTab = 'code'
        } else {
          question.showAnswer = true
        }
      } else {
        if (question.type === 'programming') {
          question.testcases = []
          // 如果不公布答案，清空答案
          if (assignmentForm.value.answerVisibility === 'never') {
            question.answer = ''
          }
          question.activeTab = 'code'
        }
      }
    }

    const selectedLanguage = ref('javascript') // 默认语言为 JavaScript

    const presetCodePlaceholder = `// 示例：
function solution() {
  // 在这里编写你的代码
  
  return result;
}`

    const answerCodePlaceholder = `// 示例：
function solution() {
  // 实现代码逻辑
  let result = 0;
  
  return result;
}`

    // 处理 Tab 键
    const handleTab = (e) => {
      const target = e.target
      const start = target.selectionStart
      const end = target.selectionEnd

      // 在光标位置插入两个空格
      const value = target.value
      target.value = value.substring(0, start) + '  ' + value.substring(end)
      
      // 移动光标到插入空格后的位置
      target.selectionStart = target.selectionEnd = start + 2
    }

    // 添加监听填空数量变化的方法
    const handleBlankCountChange = (question) => {
      const count = question.blankCount
      // 根据数量调整 blanks 数组
      if (count > question.blanks.length) {
        while (question.blanks.length < count) {
          question.blanks.push({ answer: '' })
        }
      } else if (count < question.blanks.length) {
        question.blanks = question.blanks.slice(0, count)
      }
    }

    // 删除文件
    const removeFile = (questionIndex, fileIndex) => {
      assignmentForm.value.questions[questionIndex].attachedFiles.splice(fileIndex, 1)
      ElMessage.success('文件已删除')
    }

    // eslint-disable-next-line no-unused-vars
    const filteredAssignments = computed(() => {
      return assignments.value.filter(assignment => {
        if (!searchQuery.value) return true
        return assignment.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      })
    })

    onMounted(() => {
      loadAssignments()
    })

    return {
      loading,
      assignments,
      searchQuery,
      filteredAssignments,
      formatDateTime,
      dialogVisible,
      dialogType,
      assignmentForm,
      assignmentFormRef,
      rules,
      submitting,
      handleAdd,
      handleEdit,
      handleDelete,
      handleView,
      submitForm,
      getStatusType,
      getStatusLabel,
      imageUploading,
      fileUploading,
      attachments,
      displayContent,
      handleImageUpload,
      handleFileUpload,
      removeAttachment,
      handleContentInput,
      handlePaste,
      renderContent,
      handleClose,
      handleSearch,
      addQuestion,
      removeQuestion,
      toggleAnswer,
      disablePastDates,
      disableInvalidDates,
      addOption,
      removeOption,
      watchQuestionType,
      getPlaceholder,
      editorRef,
      valueHtml,
      mode,
      toolbarConfig,
      editorConfig,
      handleCreated,
      handleChange,
      handleDestroyed,
      editorReady,
      shouldShowAnswerSection,
      getAnswerLabel,
      getAnswerRules,
      addBlank,
      removeBlank,
      addTestcase,
      removeTestcase,
      calculateTotalScore,
      updateTotalScore,
      handleAutoGradingChange,
      shouldShowAnswerCode,
      presetCodePlaceholder,
      answerCodePlaceholder,
      handleTab,
      selectedLanguage,
      handleBlankCountChange,
      removeFile,
      submissions,
      submissionsLoading,
      viewDialogVisible,
      currentAssignment,
      formatSubmitContent,
      viewSubmissionDetail
    }
  }
}
</script>

<style scoped>
.assignments-container {
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
  flex: 1;
  margin-right: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
  margin-right: 20px;
  white-space: nowrap;
}

.search-input {
  width: 50%;
  min-width: 200px;
}

.el-button-group {
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 添加表格优化样式 */
.el-table {
  margin-top: 16px;
}

.el-table::before {
  height: 0;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: #ddd;
  border-radius: 3px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f5f5f5;
}

/* 优化对话框中的表格 */
:deep(.el-dialog__body .el-table) {
  margin-top: 0;
}

.editor-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-buttons {
  display: flex;
  gap: 12px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attachments-list {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.attachments-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #666;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-preview {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #eee;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  margin: 4px 0;
}

.file-link a {
  color: #409EFF;
  text-decoration: none;
}

.file-link a:hover {
  text-decoration: underline;
}

/* 添加题目展示样式 */
.question-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.question-item h3 {
  margin-bottom: 10px;
  color: #303133;
}

.options-list {
  margin-top: 10px;
}

.option-item {
  margin: 5px 0;
  padding: 5px 0;
}

.code-template {
  margin-top: 10px;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

.code-template pre {
  margin: 0;
  white-space: pre-wrap;
}

.question-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.el-switch) {
  margin-left: 8px;
}

:deep(.el-switch__label) {
  font-size: 12px;
}
</style> 