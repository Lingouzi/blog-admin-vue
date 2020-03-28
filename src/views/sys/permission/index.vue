<template>
    <div class="app-container">
        <div class="filter-container">
            <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 110px" class="filter-item">
                <el-option label="启用" :value="1"/>
                <el-option label="禁用" :value="0"/>
            </el-select>
            <el-input v-model="listQuery.keyword" placeholder="名称, 前端资源路径, 搜索" style="width: 250px;" class="filter-item ml-10" @keyup.enter.native="search"/>
            <el-button class="filter-item ml-10" type="primary" icon="el-icon-search" @click="search">
                搜索
            </el-button>
            <el-button class="filter-item ml-10" plain @click="openDialog(null, 'create')">
                新增权限
            </el-button>
        </div>
        <!-- table 部分 -->
        <el-table v-loading="listLoading" :data="items" element-loading-text="Loading" border fit highlight-current-row size="mini">
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
            <el-table-column align="center" label="名称">
                <template slot-scope="{ row }">
                    {{ row.name }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="权限值">
                <template slot-scope="{ row }">
                    {{ row.value }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="图标">
                <template slot-scope="{ row }">
                    {{ row.icon }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="权限类型">
                <template slot-scope="{ row }">
                    {{ row.type | typeFilter }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="前端资源路径">
                <template slot-scope="{ row }">
                    {{ row.uri }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="状态">
                <template slot-scope="{ row }">
                    <el-tag size="mini" :type="row.status | statusFilter">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column align="center" label="操作">
                <template slot-scope="{ row }">
                    <el-link type="primary" @click="openDialog(row,'create')">编辑</el-link>
                    <el-link v-if="row.status === 0" class="ml5" type="success" @click="updateStatus(row)">启用</el-link>
                    <el-link v-else type="warning" class="ml5" @click="updateStatus(row)">禁用</el-link>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" :page.sync="listQuery.pageNum" :limit.sync="listQuery.pageSize" @pagination="getList"/>
        <el-dialog :title="form.id?'编辑权限':'新增权限'" :visible.sync="dialog.create">
            <el-form id="createForm" ref="createForm" :model="form" label-width="80px">
                <el-form-item label="名称" prop="name" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-input v-model="form.name" autocomplete="off" placeholder="权限的名称"/>
                </el-form-item>
                <el-form-item label="权限值" prop="value">
                    <el-input v-model="form.value" autocomplete="off" placeholder="例如: permission:update:add"/>
                </el-form-item>
                <el-form-item label="图标" prop="type">
                    <el-radio-group v-model="form.type">
                        <el-radio :label="0">目录</el-radio>
                        <el-radio :label="1">菜单</el-radio>
                        <el-radio :label="2">按钮</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="资源路径" prop="uri">
                    <el-input v-model="form.uri" autocomplete="off" placeholder="请求路径: /permission/create"/>
                </el-form-item>
                <el-form-item>
                    <el-tree ref="tree" node-key="id" :data="routesData" :props="defaultProps" show-checkbox class="permission-tree" check-strictly @check-change="handleCheckChange"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.create = false">取 消</el-button>
                <el-button type="primary" @click="save">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>
<script>
    import { getList, create, update } from '@/api/sys/permission'
    import { deepClone } from '@/utils'
    import Pagination from '@/components/Pagination'

    export default {
        name: 'UmsPermission',
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
                form: { name: '', value: '', type: 0, uri: '', pid: 0 },
                dialog: { create: false },
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
            console.log('routesData:', this.routesData)
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
                    this.form = { name: '', value: '', type: 0, uri: '', pid: 0 }
                }
                this.dialog[dialogName] = true
                this.$nextTick(() => {
                    // 初始化tree, 在打开dialog之前tree没有渲染,所以直接使用this.$refs调用是会undefined的,可以使用nexttick
                    if (row) {
                        this.$refs.tree.setCheckedKeys([row.pid])
                    } else {
                        this.$refs.tree.setCheckedKeys([])
                    }
                    //
                    this.$refs[dialogName + 'Form'].clearValidate()
                })
            },
            handleCheckChange(data, checked) {
                if (checked) {
                    this.$refs.tree.setCheckedKeys([data.id])
                    this.form.pid = data.id
                } else {
                    this.form.pid = 0
                }
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
                this.$refs['createForm'].validate(valid => {
                    if (valid) {
                        this.dialogLoading = this.$loading({
                            target: '#createForm',
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
                                        this.dialog.create = false
                                        // 刷新列表
                                        this.getList()
                                        // 刷新store中的权限信息.
                                        this.$store.dispatch('permission/getPermissionList')
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
                                        this.dialog.create = false
                                        // 刷新列表
                                        this.getList()
                                        // 刷新store中的权限信息.
                                        this.$store.dispatch('permission/getPermissionList')
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
            }
        }
    }
</script>
