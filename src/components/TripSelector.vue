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
          <el-button type="danger" size="small" @click="leaveTrip">
            離開旅程
          </el-button>
        </div>
      </template>
      
      <div class="trip-details">
        <p v-if="currentTrip?.description">{{ currentTrip.description }}</p>
        <div class="trip-stats">
          <el-tag type="info">成員：{{ currentTrip?.members?.length || 0 }} 人</el-tag>
          <el-tag type="success">費用記錄：{{ expenseCount }} 筆</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useSupabaseStore, type Trip } from '../stores/supabaseStore'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const supabaseStore = useSupabaseStore()

const loading = ref(false)
const userTrips = ref<Trip[]>([])
const tripFormRef = ref()

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

const currentTrip = computed(() => supabaseStore.currentTrip.value)
const expenseCount = computed(() => supabaseStore.expenses.value?.length || 0)

// 載入用戶的旅程列表
const loadUserTrips = async () => {
  try {
    if (!authStore.user) return
    
    const { data, error } = await supabaseStore.supabase
      .from('trips')
      .select('*')
      .or(`created_by.eq.${authStore.user?.value?.id || ''},members.cs.{${authStore.userEmail.value}}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    userTrips.value = data || []
  } catch (err) {
    console.error('載入旅程列表失敗:', err)
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
    console.error('創建旅程失敗:', err)
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
    
    // 訂閱即時更新
    supabaseStore.subscribeToExpenses(trip.id)
    
    ElMessage.success(`已選擇旅程：${trip.name}`)
  } catch (err) {
    console.error('載入旅程失敗:', err)
    ElMessage.error('載入旅程失敗')
  } finally {
    loading.value = false
  }
}

// 離開旅程
const leaveTrip = async () => {
  try {
    supabaseStore.currentTrip.value = null
    supabaseStore.expenses.value = []
    ElMessage.success('已離開旅程')
  } catch (err) {
    console.error('離開旅程失敗:', err)
    ElMessage.error('離開旅程失敗')
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadUserTrips()
  }
})
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
}
</style>
