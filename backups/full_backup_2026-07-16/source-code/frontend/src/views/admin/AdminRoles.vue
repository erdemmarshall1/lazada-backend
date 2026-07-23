<template>
  <div class="admin-page admin-roles">
    <div class="page-card">
      <div class="page-header">
        <i class="iconfont icon-anquan"></i>
        <h2>Roles &amp; Permissions</h2>
      </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Users" name="users">
        <el-table :data="users" stripe style="width:100%" v-loading="loadingUsers">
          <el-table-column prop="username" label="Username" width="150" />
          <el-table-column prop="email" label="Email" width="200" />
          <el-table-column prop="role" label="Role" width="120">
            <template #default="{ row }">
              <el-tag :type="roleTagType(row.role)" size="small">{{ row.role }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="openRoleDialog(row)">Change Role</el-button>
              <el-button size="small" @click="openPermissionsDialog(row)">Permissions</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="g-flex-center g-mgt-16" v-if="totalUsers > pageSize">
          <el-pagination layout="prev, pager, next" :total="totalUsers" :page-size="pageSize" v-model:current-page="page" @current-change="loadUsers" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Role Defaults" name="defaults">
        <el-table :data="roles" stripe style="width:100%">
          <el-table-column prop="role" label="Role" width="150">
            <template #default="{ row }">
              <el-tag :type="roleTagType(row.role)" size="small">{{ row.role }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="Level" width="80" />
          <el-table-column label="Default Permissions">
            <template #default="{ row }">
              <el-tag v-for="p in row.permissions" :key="p" size="small" style="margin:2px">{{ p }}</el-tag>
              <span v-if="!row.permissions.length" class="g-text-light">No permissions</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="roleDialog.visible" title="Change Role" width="400px">
      <el-form>
        <el-form-item label="User">
          <span>{{ roleDialog.user?.username }} ({{ roleDialog.user?.email }})</span>
        </el-form-item>
        <el-form-item label="New Role">
          <el-select v-model="roleDialog.newRole" style="width:100%">
            <el-option v-for="r in allRoles" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="roleDialog.loading" @click="saveRole">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permDialog.visible" title="Custom Permissions" width="600px">
      <template v-if="permDialog.user">
        <p class="g-text-light">User: <strong>{{ permDialog.user.username }}</strong> ({{ permDialog.user.role }})</p>
        <p class="g-text-light" style="margin-bottom:12px">
          <template v-if="permDialog.isUsingDefaults">Currently using <strong>role defaults</strong>. Set custom permissions below to override.</template>
          <template v-else>Using <strong>custom permissions</strong>. Clear all to revert to role defaults.</template>
        </p>
        <el-checkbox-group v-model="permDialog.selected">
          <el-checkbox v-for="p in permDialog.allPermissions" :key="p" :label="p" style="margin:4px 8px 4px 0">{{ p }}</el-checkbox>
        </el-checkbox-group>
      </template>
      <template #footer>
        <el-button @click="permDialog.visible = false">Cancel</el-button>
        <el-button @click="resetPermissions">Reset to Defaults</el-button>
        <el-button type="primary" :loading="permDialog.loading" @click="savePermissions">Save</el-button>
      </template>
    </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, put } from '@/api/request'
import { ElMessage } from 'element-plus'

const activeTab = ref('users')
const users = ref([])
const roles = ref([])
const allRoles = ref([])
const loadingUsers = ref(false)
const page = ref(1)
const pageSize = 20
const totalUsers = ref(0)

const roleDialog = ref({ visible: false, user: null, newRole: '', loading: false })
const permDialog = ref({ visible: false, user: null, selected: [], allPermissions: [], isUsingDefaults: true, loading: false })

const roleTagType = (role) => {
  const map = { super_admin: 'danger', admin: 'warning', manager: '', staff: 'info', seller: 'success', buyer: 'info' }
  return map[role] || 'info'
}

const loadUsers = async () => {
  loadingUsers.value = true
  const res = await get('/home/admin/users', { page: page.value, pageSize })
  loadingUsers.value = false
  if (res?.code === 0 && res?.data) {
    users.value = res.data.list || []
    totalUsers.value = res.data.total || 0
  }
}

const loadRoles = async () => {
  const res = await get('/home/admin/roles')
  if (res?.code === 0 && res?.data) {
    roles.value = res.data.roles || []
    allRoles.value = res.data.roles?.map(r => r.role) || []
  }
}

const openRoleDialog = (user) => {
  roleDialog.value = { visible: true, user, newRole: user.role, loading: false }
}

const saveRole = async () => {
  roleDialog.value.loading = true
  const res = await post(`/home/admin/users/${roleDialog.value.user._id}/set-role`, { role: roleDialog.value.newRole })
  roleDialog.value.loading = false
  if (res?.code === 0 && res?.data) {
    ElMessage.success('Role updated')
    roleDialog.value.visible = false
    loadUsers()
  } else {
    ElMessage.error(res?.msg || 'Failed to update role')
  }
}

const openPermissionsDialog = async (user) => {
  permDialog.value = { visible: true, user, selected: [], allPermissions: [], isUsingDefaults: true, loading: false }
  const res = await get(`/home/admin/users/${user._id}/permissions`)
  if (res?.code === 0 && res?.data) {
    permDialog.value.selected = [...(res.data.customPermissions || [])]
    permDialog.value.allPermissions = res.data.allPermissions || []
    permDialog.value.isUsingDefaults = res.data.isUsingDefaults
  }
}

const savePermissions = async () => {
  permDialog.value.loading = true
  const res = await put(`/home/admin/users/${permDialog.value.user._id}/permissions`, { permissions: permDialog.value.selected })
  permDialog.value.loading = false
  if (res?.code === 0) {
    ElMessage.success('Permissions updated')
    permDialog.value.visible = false
    loadUsers()
  } else {
    ElMessage.error(res?.msg || 'Failed to update permissions')
  }
}

const resetPermissions = async () => {
  permDialog.value.loading = true
  const res = await put(`/home/admin/users/${permDialog.value.user._id}/permissions`, { permissions: [] })
  permDialog.value.loading = false
  if (res?.code === 0) {
    ElMessage.success('Permissions reset to role defaults')
    permDialog.value.visible = false
    loadUsers()
  } else {
    ElMessage.error(res?.msg || 'Failed to reset permissions')
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<style scoped>
.admin-roles { padding: 20px; }
.admin-roles h2 { margin-bottom: 20px; font-size: 20px; }
</style>