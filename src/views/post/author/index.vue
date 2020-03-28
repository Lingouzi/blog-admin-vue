<template>
    <div class="app-container">
        <div class="filter-container">
            <el-select v-model="listQuery.status" placeholder="类别" clearable style="width: 110px" class="filter-item">
                <el-option label="激活中" :value="1"/>
                <el-option label="已注销" :value="0"/>
            </el-select>
            <el-input v-model="listQuery.keyword" placeholder="名称, 手机，简介，备注, 搜索" style="width: 250px;" class="filter-item ml-10" @keyup.enter.native="search"/>
            <el-button class="filter-item ml-10" type="primary" icon="el-icon-search" @click="search">
                搜索
            </el-button>
            <el-button class="filter-item ml-10" plain @click="openDialog(null, 'edit')">
                新增作者
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
            <el-table-column align="center" label="头像">
                <template slot-scope="{ row }">
                    <el-avatar size="medium" :src="row.icon" @click.native="openDialog(row, 'icon')"/>
                </template>
            </el-table-column>
            <el-table-column align="center" label="名称">
                <template slot-scope="{ row }">
                    {{ row.name }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="联系方式">
                <template slot-scope="{ row }">
                    {{ row.phone }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="简介">
                <template slot-scope="{ row }">
                    {{ row.summary }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="备注">
                <template slot-scope="{ row }">
                    {{ row.note ? row.note : '-' }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="状态">
                <template slot-scope="{ row }">
                    <el-tag size="mini" :type="row.status | statusFilter">{{ row.status === 1 ? '激活' : '注销' }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column align="center" label="操作">
                <template slot-scope="{ row }">
                    <el-link type="primary" @click="openDialog(row,'edit')">编辑</el-link>
                    <el-popconfirm class="ml5" confirm-button-text="是的" cancel-button-text="不用了" icon="el-icon-info" icon-color="red"
                                   :title="row.status === 0 ? '激活？' : '注销？'"
                                   @onConfirm="handleConfirm(row)">
                        <el-link slot="reference">{{ row.status | statusTextFilter }}</el-link>
                    </el-popconfirm>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" :page.sync="listQuery.pageNum" :limit.sync="listQuery.pageSize" @pagination="getList"/>

        <el-dialog title="编辑作者头像" :visible.sync="dialog.icon">
            <!-- ref 的作用就是讲当前组件(或者dom元素) 注册到 $refs 中,比如:下面 iconForm 注册到$refs,然后vue就可以通过$refs得到这个组件的dom结构 -->
            <el-form id="iconForm" ref="iconForm" :model="form" label-width="70px">
                <el-form-item label="图片地址">
                    <el-input v-model="form.icon" autocomplete="off" readonly/>
                </el-form-item>
                <el-form-item label="预览">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-upload class="avatar-uploader" action="/oss/upload" :headers="headers" :show-file-list="false" :on-success="handleAvatarSuccess"
                                       :before-upload="beforeAvatarUpload" :on-error="handleError">
                                <img v-if="form.icon" :src="form.icon" class="avatar" alt=""/>
                                <i v-else class="el-icon-plus avatar-uploader-icon"/>
                            </el-upload>
                        </el-col>
                        <el-col :span="16">
                            <el-row :gutter="20">
                                <el-col v-for="i in 6" :key="i" :span="4">
                                    <div class="grid-content bg-purple">
                                        <img :src="'http://img.ybq87.top/static/img/avatars/'+i+'.jpg'" class="avatar-icon" alt="avatar" @click="changeAvatar(i)"/>
                                    </div>
                                </el-col>
                            </el-row>
                        </el-col>
                    </el-row>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.icon = false">取 消</el-button>
                <el-button type="primary" @click="updateIcon">确 定</el-button>
            </div>
        </el-dialog>
        <el-dialog title="编辑作者" :visible.sync="dialog.edit">
            <el-form id="editForm" ref="editForm" :model="form">
                <el-form-item label="头像预览" label-width="80px" prop="icon" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-upload class="avatar-uploader" action="/oss/upload" :headers="headers" :show-file-list="false" :on-success="handleAvatarSuccess"
                                       :before-upload="beforeAvatarUpload" :on-error="handleError">
                                <img v-if="form.icon" :src="form.icon" class="avatar" alt=""/>
                                <i v-else class="el-icon-plus avatar-uploader-icon"/>
                            </el-upload>
                        </el-col>
                        <el-col :span="16">
                            <el-row :gutter="20">
                                <el-col v-for="i in 6" :key="i" :span="4">
                                    <div class="grid-content bg-purple">
                                        <img :src="'http://img.ybq87.top/static/img/avatars/'+i+'.jpg'" class="avatar-icon" alt="avatar" @click="changeAvatar(i)"/>
                                    </div>
                                </el-col>
                            </el-row>
                        </el-col>
                    </el-row>
                </el-form-item>
                <el-form-item label="名称" label-width="80px" prop="name" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-input v-model="form.name" autocomplete="off"/>
                </el-form-item>
                <el-form-item label="联系方式" label-width="80px" prop="phone" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-input v-model="form.phone" autocomplete="off"/>
                </el-form-item>
                <el-form-item label="简介" label-width="80px" prop="summary" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                    <el-input v-model="form.summary" autocomplete="off"/>
                </el-form-item>
                <el-form-item label="备注" label-width="80px">
                    <el-input v-model="form.note" autocomplete="off"/>
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
    import { getList, create, update } from '@/api/post/author'
    import { deepClone } from '@/utils'
    import Pagination from '@/components/Pagination'

    export default {
        name: 'CmsAuthor',
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
                    0: '激活',
                    1: '注销'
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
                form: { id: '', name: '', summary: '', phone: '', icon: 'http://img.ybq87.top/static/img/avatars/1.jpg', note: '' },
                dialog: { icon: false, edit: false }
            }
        },
        computed: {
            headers() {
                return {
                    Authorization: this.$store.getters.token
                }
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
            handleConfirm(row) {
                const status = row.status === 1 ? 0 : 1
                // 修改状态
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
            /** 打开dialog */
            openDialog(row, dialogName) {
                if (row) {
                    this.form = deepClone(row)
                } else {
                    this.form = { id: '', name: '', phone: '', summary: '', icon: 'http://img.ybq87.top/static/img/avatars/1.jpg', note: '' }
                }
                this.dialog[dialogName] = true
                this.$nextTick(() => {
                    this.$refs[dialogName + 'Form'].clearValidate()
                })
            },
            changeAvatar(i) {
                this.form.icon = 'http://img.ybq87.top/static/img/avatars/' + i + '.jpg'
            },
            save() {
                // clearValidate 移除校验效果
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
            updateIcon() {
                // 得到当前的 form数据
                update({ id: this.form.id, icon: this.form.icon })
                    .then(resp => {
                        if (resp.code === 200) {
                            // 提示成功
                            this.$notify({
                                title: '成功修改',
                                message: '已修改头像',
                                type: 'success'
                            })
                            // 关闭窗口
                            this.dialog.icon = false
                            // 刷新列表
                            this.getList()
                        }
                    })
            },
            beforeAvatarUpload(file) {
                // 上传前,检查图片格式和大小
                const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
                const isLt2M = file.size / 1024 / 1024 < 1
                if (!isJPG) {
                    this.$message.error('上传头像图片只能是 JPG/PNG 格式!')
                }
                if (!isLt2M) {
                    this.$message.error('上传头像图片大小不能超过 1m!')
                }
                if (isJPG && isLt2M) {
                    return true
                }
                return false
            },
            handleAvatarSuccess(response, file) {
                if (response.code === 200) {
                    // this.$set(this.form, 'icon', response.data.url)
                    this.form.icon = response.data.url + '?x-oss-process=style/avatar'
                } else {
                    // 弹出错误提示
                    this.$message.error('图片上传出现错误')
                }
            },
            handleError(err, file) {
                console.log('err', err.response.code)
            }
        }
    }
</script>
<style scoped>
    .avatar-uploader .el-upload {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }

    .avatar-uploader .el-upload:hover {
        border-color: #409eff;
    }

    .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 100px;
        height: 100px;
        line-height: 100px;
        text-align: center;
    }

    .avatar {
        width: 100px;
        height: 100px;
        display: block;
    }

    .avatar-icon {
        width: 40px;
        height: 40px;
        display: block;
    }
</style>
