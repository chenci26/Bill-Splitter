<template>
  <div class="trip-selector">
    <el-card v-if="!currentTrip" class="trip-card">
      <template #header>
        <div class="card-header">
          <span>選擇或創建旅程</span>
        </div>
      </template>
      
      <!-- 創建新旅程 -->
      <div class="create-trip-section">
        <h4>創建新旅程</h4>
        <el-form :model="newTrip" :rules="tripRules" ref="tripFormRef" label-width="80px">
          <el-form-item label="旅程名稱" prop="name">
            <el-input
              v-model="newTrip.name"
              placeholder="例如：日本東京之旅"
              :disabled="loading"
            />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="newTrip.description"
              type="textarea"
              placeholder="旅程描述（可選）"
              :disabled="loading"
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="createTrip"
              :loading="loading"
              :disabled="!newTrip.name.trim()"
            >
              創建旅程
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 分隔線 -->
      <el-divider v-if="userTrips.length > 0">或</el-divider>
      
      <!-- 選擇現有旅程 -->
      <div v-if="userTrips.length > 0" class="existing-trips-section">
        <h4>選擇現有旅程</h4>
        <div class="trips-list">
          <div
            v-for="trip in userTrips"
            :key="trip.id"
            class="trip-item"
            @click="selectTrip(trip)"
          >
            <div class="trip-info">
              <h5>{{ trip.name }}</h5>
              <p v-if="trip.description">{{ trip.description }}</p>
              <small>成員：{{ trip.members.length }} 人</small>
            </div>
            <el-button type="primary" size="small">
              選擇
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 當前旅程信息 -->
    <el-card v-else class="current-trip-card">
      <template #header>
        <div class="card-header">
          <span>當前旅程：{{ currentTrip?.name }}</span>
          <div class="header-buttons">
            <el-button 
              type="primary" 
              size="small" 
              @click="switchTrip"
            >
              切換旅程
            </el-button>
            <el-tooltip 
              :content="isCreator ? '刪除此旅程及所有數據' : '只有旅程創建者可以刪除旅程'"
              placement="bottom"
            >
              <el-button 
                type="danger" 
                size="small" 
                :disabled="!isCreator"
                @click="deleteTrip"
              >
                刪除旅程
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      
      <div class="trip-details">
        <p v-if="currentTrip?.description">{{ currentTrip.description }}</p>
        <div class="trip-stats">
          <el-tag type="success">費用記錄：{{ expenseCount }} 筆</el-tag>
        </div>
        
        <!-- 成員列表 -->
        <div class="members-section">
          <div class="section-header">
            <strong>成員 ({{ currentTrip?.members?.length || 0 }} 人)</strong>
            <el-button 
              v-if="isCreator"
              type="primary" 
              size="small" 
              @click="showInviteDialog = true"
            >
              邀請成員
            </el-button>
          </div>
          <div class="members-list">
            <el-tag 
              v-for="member in currentTrip?.members" 
              :key="member"
              :closable="isCreator"
              @close="removeMember(member)"
              style="margin: 5px;"
            >
              {{ member }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 邀請成員對話框 -->
    <el-dialog v-model="showInviteDialog" title="邀請成員" width="400px">
      <el-form @submit.prevent="inviteMember">
        <el-form-item label="成員 Email">
          <el-input 
            v-model="inviteEmail" 
            placeholder="請輸入成員的 Email"
            @keyup.enter="inviteMember"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" @click="inviteMember">邀請</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useSupabaseStore, type Trip } from '../stores/supabaseStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const supabaseStore = useSupabaseStore()

const loading = ref(false)
const userTrips = ref<Trip[]>([])
const tripFormRef = ref()
const showInviteDialog = ref(false)
const inviteEmail = ref('')

const newTrip = reactive({
  name: '',
  description: ''
})

const tripRules = {
  name: [
    { required: true, message: '請輸入旅程名稱', trigger: 'blur' },
    { min: 2, message: '旅程名稱至少需要2個字符', trigger: 'blur' }
  ]
}

const currentTrip = computed(() => supabaseStore.currentTrip)
const expenseCount = computed(() => supabaseStore.expenses?.length || 0)

// 檢查當前用戶是否為旅程創建者
const isCreator = computed(() => {
  if (!currentTrip.value || !authStore.user) return false
  return currentTrip.value.created_by === authStore.user.id
})

// 載入用戶的旅程列表
const loadUserTrips = async () => {
  try {
    if (!authStore.user) {
      return
    }
    
    const { data, error } = await supabaseStore.supabase
      .from('trips')
      .select('*')
      .or(`created_by.eq.${authStore.user.id},members.cs.{${authStore.userEmail}}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    userTrips.value = data || []
  } catch (err) {
    ElMessage.error('載入旅程列表失敗')
  }
}

// 創建新旅程
const createTrip = async () => {
  if (!tripFormRef.value) return
  
  try {
    await tripFormRef.value.validate()
    loading.value = true
    
    await supabaseStore.createTrip(newTrip.name, newTrip.description)
    
    // 清空表單
    newTrip.name = ''
    newTrip.description = ''
    
    // 重新載入旅程列表
    await loadUserTrips()
    
    ElMessage.success('旅程創建成功！')
  } catch (err) {
    ElMessage.error('創建旅程失敗')
  } finally {
    loading.value = false
  }
}

// 選擇旅程
const selectTrip = async (trip: Trip) => {
  try {
    loading.value = true
    await supabaseStore.loadTrip(trip.id)
    
    // 載入費用記錄
    await supabaseStore.loadExpenses(trip.id)
    
    // 訂閱即時更新（費用記錄和旅程設置）
    supabaseStore.subscribeToExpenses(trip.id)
    supabaseStore.subscribeToTrip(trip.id)
    
    ElMessage.success(`已選擇旅程：${trip.name}`)
  } catch (err) {
    ElMessage.error('載入旅程失敗')
  } finally {
    loading.value = false
  }
}

// 切換旅程
const switchTrip = () => {
  // 取消所有訂閱
  supabaseStore.unsubscribeAll()
  
  // 清空當前旅程
  supabaseStore.currentTrip = null
  supabaseStore.expenses = []
  
  ElMessage.success('已返回旅程列表')
}

// 刪除旅程
const deleteTrip = async () => {
  if (!currentTrip.value) return
  
  try {
    // 只有創建者可以刪除旅程
    if (!isCreator.value) {
      ElMessage.warning('只有旅程創建者可以刪除旅程')
      return
    }
    
    // 確認刪除
    await ElMessageBox.confirm(
      `確定要刪除旅程「${currentTrip.value.name}」嗎？此操作無法復原，所有相關的費用記錄也會被刪除。`,
      '刪除旅程',
      {
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消',
        type: 'error',
        buttonSize: 'default'
      }
    )
    
    loading.value = true
    
    const tripId = currentTrip.value.id
    
    // 刪除旅程（Supabase 會自動級聯刪除相關的費用記錄）
    const { error } = await supabaseStore.supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
    
    if (error) throw error
    
    // 取消所有訂閱
    supabaseStore.unsubscribeAll()
    
    // 清空當前旅程和費用
    supabaseStore.currentTrip = null
    supabaseStore.expenses = []
    
    // 重新載入旅程列表
    await loadUserTrips()
    
    ElMessage.success('旅程已刪除')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('刪除旅程失敗')
    }
  } finally {
    loading.value = false
  }
}

// 邀請成員
const inviteMember = async () => {
  if (!inviteEmail.value.trim()) {
    ElMessage.error('請輸入成員 Email')
    return
  }
  
  if (!currentTrip.value) {
    ElMessage.error('請先選擇旅程')
    return
  }
  
  // 只有創建者可以邀請成員
  if (!isCreator.value) {
    ElMessage.warning('只有旅程創建者可以邀請成員')
    return
  }
  
  try {
    loading.value = true
    
    // 檢查 Email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.value)) {
      ElMessage.error('請輸入有效的 Email 地址')
      return
    }
    
    // 檢查是否已經是成員
    if (currentTrip.value.members.includes(inviteEmail.value)) {
      ElMessage.warning('該成員已在旅程中')
      return
    }
    
    // 更新成員列表
    const updatedMembers = [...currentTrip.value.members, inviteEmail.value]
    
    const { error } = await supabaseStore.supabase
      .from('trips')
      .update({ members: updatedMembers })
      .eq('id', currentTrip.value.id)
    
    if (error) throw error
    
    // 更新本地狀態
    currentTrip.value.members = updatedMembers
    
    ElMessage.success(`已邀請 ${inviteEmail.value}`)
    inviteEmail.value = ''
    showInviteDialog.value = false
  } catch (err) {
    ElMessage.error('邀請成員失敗')
  } finally {
    loading.value = false
  }
}

// 移除成員
const removeMember = async (memberEmail: string) => {
  if (!currentTrip.value) return
  
  try {
    // 只有創建者可以移除成員
    if (!isCreator.value) {
      ElMessage.warning('只有旅程創建者可以移除成員')
      return
    }
    
    // 不能移除創建者
    const { data: { user } } = await supabaseStore.supabase.auth.getUser()
    if (memberEmail === user?.email) {
      ElMessage.warning('無法移除旅程創建者')
      return
    }
    
    // 確認移除
    await ElMessageBox.confirm(
      `確定要移除成員 ${memberEmail} 嗎？`,
      '移除成員',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 更新成員列表
    const updatedMembers = currentTrip.value.members.filter(m => m !== memberEmail)
    
    const { error } = await supabaseStore.supabase
      .from('trips')
      .update({ members: updatedMembers })
      .eq('id', currentTrip.value.id)
    
    if (error) throw error
    
    // 更新本地狀態
    currentTrip.value.members = updatedMembers
    
    ElMessage.success(`已移除成員 ${memberEmail}`)
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('移除成員失敗')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadUserTrips()
  }
})

// 監聽認證狀態變化
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    loadUserTrips()
  } else {
    userTrips.value = []
    supabaseStore.currentTrip = null
  }
}, { immediate: true })
</script>

<style scoped>
.trip-selector {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.trip-card,
.current-trip-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-trip-section,
.existing-trips-section {
  margin-bottom: 20px;
}

.create-trip-section h4,
.existing-trips-section h4 {
  margin-bottom: 15px;
  color: #409EFF;
}

.trips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trip-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.trip-item:hover {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.trip-info h5 {
  margin: 0 0 5px 0;
  color: #303133;
}

.trip-info p {
  margin: 0 0 5px 0;
  color: #606266;
  font-size: 14px;
}

.trip-info small {
  color: #909399;
  font-size: 12px;
}

.trip-details {
  margin-bottom: 15px;
}

.trip-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.members-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 40px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* RWD 響應式設計 */
@media (max-width: 768px) {
  .trip-selector {
    padding: 15px 10px;
  }
  
  /* 卡片網格調整 */
  .trip-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  /* 卡片 header 調整 */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-buttons {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
  
  .header-buttons .el-button {
    width: 100%;
  }
  
  /* 旅程詳情調整 */
  .trip-details {
    font-size: 13px;
  }
  
  /* 成員列表調整 */
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .section-header .el-button {
    width: 100%;
  }
  
  /* 新增旅程表單調整 */
  .create-trip-form .el-form-item__label {
    min-width: 70px;
  }
}

@media (max-width: 480px) {
  .trip-selector {
    padding: 10px 8px;
  }
  
  /* 按鈕文字調整 */
  .header-buttons .el-button {
    font-size: 13px;
    padding: 8px 10px;
  }
  
  /* 成員標籤調整 */
  .members-list {
    padding: 8px;
    gap: 6px;
  }
  
  .members-list .el-tag {
    font-size: 12px;
  }
}
</style>
