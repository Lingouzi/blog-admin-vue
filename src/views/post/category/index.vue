<template>
    <div class="app-container">
        <div class="filter-container">
            <el-select v-model="listQuery.status" placeholder="类别" clearable style="width: 110px" class="filter-item">
                <el-option label="启用的" :value="1"/>
                <el-option label="禁用的" :value="0"/>
            </el-select>
            <el-input v-model="listQuery.keyword" placeholder="名称, 搜索" style="width: 250px;" class="filter-item ml-10" @keyup.enter.native="search"/>
            <el-button class="filter-item ml-10" type="primary" icon="el-icon-search" @click="search">
                搜索
            </el-button>
            <el-button class="filter-item ml-10" plain @click="openDialog(null, 'edit')">
                新增分类
            </el-button>
        </div>

        <!-- table 部分 -->
        <el-table v-loading="listLoading" :data="items" element-loading-text="Loading" border fit highlight-current-row size="mini">
            <el-table-column align="center" label="序号" width="95">
                <template slot-scope="scope">
                    {{ scope.$index + 1 + (listQuery.pageNum - 1) * listQuery.pageSize }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="分类名称">
                <template slot-scope="{ row }">
                    {{ row.name }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="ICON">
                <template slot-scope="{ row }">
                    {{ row.icon }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="博文数量">
                <template slot-scope="{ row }">
                    {{ row.postCount }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="状态">
                <template slot-scope="{ row }">
                    <el-tag size="mini" :type="row.status | statusFilter">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column align="center" label="操作">
                <template slot-scope="{ row }">
                    <el-link type="primary" @click="openDialog(row,'edit')">编辑</el-link>
                    <el-link v-if="row.status === 0" class="ml5" type="success" @click="updateStatus(row)">启用</el-link>
                    <el-link v-else type="warning" class="ml5" @click="updateStatus(row)">禁用</el-link>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" :page.sync="listQuery.pageNum" :limit.sync="listQuery.pageSize" @pagination="getList"/>

        <el-dialog :title="form.id ? '编辑分类':'新增分类'" :visible.sync="dialog.edit">
            <!-- ref 的作用就是讲当前组件(或者dom元素) 注册到 $refs 中,比如:下面 iconForm 注册到$refs,然后vue就可以通过$refs得到这个组件的dom结构 -->
            <el-form id="editForm" ref="editForm" :model="form">
                <el-form-item label="分类名称" label-width="70px" prop="name">
                    <el-input v-model="form.name" autocomplete="off"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.edit = false">取 消</el-button>
                <el-button type="primary" @click="save">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    import { getList, update, create } from '@/api/post/category'
    import { deepClone } from '@/utils'
    import Pagination from '@/components/Pagination'

    export default {
        name: 'PostCategory',
        components: { Pagination },
        filters: {
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
                /** 表格数据 */
                items: null,
                /** 分页 */
                total: 0,
                /** 搜索参数 */
                listQuery: {
                    pageNum: 1,
                    pageSize: 10,
                    keyword: '',
                    status: ''
                },
                listLoading: true,
                dialogLoading: undefined,
                form: { name: '' },
                dialog: { edit: false }
            }
        },
        created() {
            this.getList()
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
            /** 打开dialog */
            openDialog(row, dialogName) {
                if (row) {
                    this.form = deepClone(row)
                } else {
                    this.form = { name: '' }
                }
                this.dialog[dialogName] = true
                this.$nextTick(() => {
                    this.$refs[dialogName + 'Form'].clearValidate()
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
            }
        }
    }
</script>
<style>
</style>
