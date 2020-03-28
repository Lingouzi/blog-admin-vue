<template>
    <div class="app-container">
        <div class="filter-container">
            <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 110px" class="filter-item">
                <el-option label="启用" :value="1"/>
                <el-option label="禁用" :value="0"/>
            </el-select>
            <el-input v-model="listQuery.keyword" placeholder="名称, 简介, 搜索" style="width: 250px;" class="filter-item ml-10" @keyup.enter.native="search"/>
            <el-button class="filter-item ml-10" type="primary" icon="el-icon-search" @click="search">
                搜索
            </el-button>
            <el-button class="filter-item ml-10" plain @click="openDialog(null, 'edit')">
                新增角色
            </el-button>
        </div>
        <!-- table 部分 -->
        <el-table v-loading="listLoading" :data="items" element-loading-text="Loading" border
                  fit highlight-current-row size="mini">
            <el-table-column align="center" label="序号" width="95">
                <template slot-scope="scope">
                    {{ scope.$index + 1 + (listQuery.pageNum - 1) * listQuery.pageSize }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="创建时间">
                <template slot-scope="{ row }">
                    {{ row.createTime | parseTime() }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="角色名称">
                <template slot-scope="{ row }">
                    {{ row.name }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="描述">
                <template slot-scope="{ row }">
                    {{ row.description }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="用户数">
                <template slot-scope="{ row }">
                    {{ row.adminCount }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="状态">
                <template slot-scope="{ row }">
                    <el-tag size="mini" :type="row.status | statusFilter">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column align="center" label="操作">
                <template slot-scope="{ row }">
                    <el-link @click="openPermissionDialog(row)">权限</el-link>
                    <el-link type="primary" class="ml5" @click="openDialog(row,'edit')">编辑</el-link>
                    <el-link v-if="row.status === 0" class="ml5" type="success" @click="updateStatus(row)">启用</el-link>
                    <el-link v-else type="warning" class="ml5" @click="updateStatus(row)">禁用</el-link>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" :page.sync="listQuery.pageNum" :limit.sync="listQuery.pageSize" @pagination="getList"/>

        <!-- 角色编辑 -->
        <el-dialog :title="form.id?'编辑角色':'新增角色'" :visible.sync="dialog.edit">
            <el-form id="editForm" ref="editForm" :model="form" label-width="80px">
                <el-form-item label="名称" prop="name" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-input v-model="form.name" autocomplete="off" placeholder="名称"/>
                </el-form-item>
                <el-form-item label="描述" prop="description" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-input v-model="form.description" autocomplete="off" placeholder="角色描述"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.edit = false">取 消</el-button>
                <el-button type="primary" @click="save">确 定</el-button>
            </div>
        </el-dialog>

        <!-- 权限编辑 -->
        <el-dialog title="设置权限" :visible.sync="dialog.permission">
            <el-form id="permissionForm" ref="permissionForm" :model="permissionForm">
                <el-tree ref="tree" node-key="id" :data="routesData" :props="defaultProps"
                         check-strictly show-checkbox class="permission-tree"/>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.permission = false">取 消</el-button>
                <el-button type="primary" @click="updatePermission">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>
<script>
    import { create, getList, getPermissionListByRoleId, update, updatePermission } from '@/api/sys/role'
    import { deepClone } from '@/utils'
    import Pagination from '@/components/Pagination'

    export default {
        name: 'UmsRole',
        components: { Pagination },
        filters: {
            typeFilter(type) {
                // 0->目录；1->菜单；2->按钮（接口绑定权限）
                const typeMap = {
                    0: '目录',
                    1: '菜单',
                    2: '按钮'
                }
                return typeMap[type]
            },
            statusFilter(status) {
                const statusMap = {
                    1: 'success',
                    0: 'info'
                }
                return statusMap[status]
            },
            statusTextFilter(status) {
                const statusMap = {
                    0: '启用',
                    1: '禁用'
                }
                return statusMap[status]
            }
        },
        data() {
            return {
                items: null,
                total: 0,
                listQuery: {
                    pageNum: 1,
                    pageSize: 10,
                    keyword: '',
                    status: ''
                },
                listLoading: true,
                dialogLoading: undefined,
                form: { name: '', description: '' },
                permissionForm: { id: '' },
                dialog: { edit: false, permission: false },
                defaultProps: {
                    children: 'children',
                    label: 'name'
                }
            }
        },
        computed: {
            routesData() {
                return this.$store.getters.permissionData
            }
        },
        created() {
            this.getList()
            // 创建的时候初始化权限获取
            if (this.routesData.length === 0) {
                this.$store.dispatch('permission/getPermissionList')
            }
        },
        methods: {
            search() {
                this.listQuery.pageNum = 1
                this.getList()
            },
            getList() {
                this.listLoading = true
                getList(this.listQuery)
                    .then(response => {
                        this.items = response.data.list
                        this.total = response.data.total
                        this.listLoading = false
                    })
            },
            openDialog(row, dialogName) {
                if (row) {
                    this.form = deepClone(row)
                } else {
                    this.form = { name: '', description: '' }
                }
                this.dialog[dialogName] = true
                this.$nextTick(() => {
                    this.$refs[dialogName + 'Form'].clearValidate()
                })
            },
            openPermissionDialog(row) {
                this.permissionForm = deepClone(row)
                this.dialog.permission = true
                this.$nextTick(() => {
                    // 清除之前的勾选
                    this.$refs.tree.setCheckedKeys([])
                    this.$refs.permissionForm.clearValidate()
                    // 然后调用接口，查询到角色的权限信息，
                    this.getPermissionListByRoleId(row.id)
                })
            },
            updateStatus(row) {
                const status = row.status === 1 ? 0 : 1
                update({ id: row.id, status: status })
                    .then(resp => {
                        if (resp.code === 200) {
                            this.$notify({
                                title: '成功更新',
                                message: '',
                                type: 'success'
                            })
                            row.status = status
                        }
                    })
            },
            save() {
                // 更新或者创建
                this.$refs['editForm'].validate(valid => {
                    if (valid) {
                        this.dialogLoading = this.$loading({
                            target: '#editForm',
                            lock: true,
                            text: '数据提交中...'
                        })
                        if (this.form.id) {
                            // 更改
                            update(this.form)
                                .then(resp => {
                                    this.dialogLoading.close()
                                    if (resp.code === 200) {
                                        // 提示成功
                                        this.$notify({
                                            title: '成功更新',
                                            message: '',
                                            type: 'success'
                                        })
                                        // 关闭窗口
                                        this.dialog.edit = false
                                        // 刷新列表
                                        this.getList()
                                    } else {
                                        this.$message.error(resp.message)
                                    }
                                })
                        } else {
                            // 创建
                            create(this.form)
                                .then(resp => {
                                    this.dialogLoading.close()
                                    if (resp.code === 200) {
                                        // 提示成功
                                        this.$notify({
                                            title: '成功创建',
                                            message: '',
                                            type: 'success'
                                        })
                                        // 关闭窗口
                                        this.dialog.edit = false
                                        // 刷新列表
                                        this.getList()
                                    } else {
                                        this.$message.error(resp.message)
                                    }
                                })
                                .catch(() => {
                                    this.dialogLoading.close()
                                })
                        }
                    }
                })
            },
            updatePermission() {
                // 获取到选中的
                const ids = [].concat(this.$refs.tree.getCheckedKeys(), this.$refs.tree.getHalfCheckedKeys())
                updatePermission({ roleId: this.permissionForm.id, permissionIds: ids })
                    .then(resp => {
                        if (resp.code === 200) {
                            this.dialog.permission = false
                            this.$notify({
                                title: '成功更新权限',
                                message: '',
                                type: 'success'
                            })
                        }
                    })
            },
            getPermissionListByRoleId(id) {
                this.dialogLoading = this.$loading({
                    target: '#permissionForm',
                    lock: true,
                    text: '查询权限...'
                })
                // 查询权限，
                getPermissionListByRoleId({ id: id })
                    .then(resp => {
                        this.dialogLoading.close()
                        if (resp.code === 200) {
                            // 设置选中的权限，
                            const permissions = resp.data
                            const ids = []
                            permissions.forEach((value, index) => {
                                ids.push(value.id)
                            })
                            console.log(ids)
                            this.$refs.tree.setCheckedKeys(ids)
                        }
                    })
                    .catch(() => {
                        this.dialogLoading.close()
                    })
                // 刷新tree
            }
        }
    }
</script>
