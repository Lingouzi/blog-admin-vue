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
            <!--            <el-button class="filter-item ml-10" plain @click="openDialog(null, 'edit')">-->
            <!--                TinyMCE-->
            <!--            </el-button>-->
            <el-button class="filter-item ml-10" plain @click="gotoEditor('0',1)">
                新增博文(秀米)
            </el-button>
            <el-button class="filter-item ml-10" plain @click="gotoEditor('0',2)">
                MarkDown
            </el-button>
        </div>

        <!-- table 部分 -->
        <el-table v-loading="listLoading" :data="items" element-loading-text="Loading" border fit highlight-current-row size="mini">
            <el-table-column align="center" label="序号" width="50">
                <template slot-scope="scope">
                    {{ scope.$index + 1 + (listQuery.pageNum - 1) * listQuery.pageSize }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="创建/修改时间">
                <template slot-scope="{ row }">
                    {{ row.createTime | parseTime() }}<br/>
                    {{ row.modifyTime | parseTime() }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="头图">
                <template slot-scope="{ row }">
                    <img class="cursor-pointer" :src="row.postThumbnail" alt="博文头图" width="90" @click="openDialog(row,'postThumbnail')"/>
                </template>
            </el-table-column>
            <el-table-column align="center" label="标题">
                <template slot-scope="{ row }">
                    <span class="cursor-pointer" @click="openDialog(row,'title')">{{ row.title }}</span>
                </template>
            </el-table-column>
            <el-table-column align="center" label="简介">
                <template slot-scope="{ row }">
                    <span class="cursor-pointer" @click="openDialog(row,'summary')">{{ row.summary }}</span>
                </template>
            </el-table-column>
            <el-table-column align="center" label="作者" width="60">
                <template slot-scope="{ row }">
                    <div class="cursor-pointer" @click="openDialog(row,'author')">
                        <el-avatar :src="row.author.icon"/>
                        <br/>
                        {{ row.author.name }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column align="center" label="分类" width="60">
                <template slot-scope="{ row }">
                    <div class="cursor-pointer" @click="openDialog(row,'cate')">{{ row.category ? row.category.name : '-' }}</div>
                </template>
            </el-table-column>
            <el-table-column align="center" label="阅读数" width="60">
                <template slot-scope="{ row }">
                    {{ row.readCount }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="状态" width="60">
                <template slot-scope="{ row }">
                    <el-tag size="mini" :type="row.status | statusFilter">{{ row.status | statusTextFilter }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column align="center" label="操作" width="120px">
                <template slot-scope="{ row }">
                    <el-link type="primary" @click="gotoEditor(row.id,row.contentType)">编辑</el-link>
                    <el-link v-if="row.status===0 || row.status === 2" class="ml10" type="success" @click="updateStatus(row,1)">上架</el-link>
                    <el-link v-if="row.status===1 || row.status === 2" class="ml10" type="warning" @click="updateStatus(row,0)">下架</el-link>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" :page.sync="listQuery.pageNum" :limit.sync="listQuery.pageSize" @pagination="getList"/>

        <el-dialog title="修改标题" :visible.sync="dialog.title">
            <el-form id="titleForm" ref="titleForm" :model="form">
                <el-form-item label="标题" label-width="70px" prop="title" required>
                    <el-input v-model.trim="form.title" placeholder="输入标题"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.title = false">取 消</el-button>
                <el-button type="primary" @click="updateTitle">确 定</el-button>
            </div>
        </el-dialog>
        <el-dialog title="修改简介" :visible.sync="dialog.summary">
            <el-form id="summaryForm" ref="summaryForm" :model="form">
                <el-form-item label="简介" label-width="70px" prop="summary" required>
                    <el-input v-model="form.summary" placeholder="输入简介" type="textarea" :rows="4" maxlength="300"
                              show-word-limit/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.summary = false">取 消</el-button>
                <el-button type="primary" @click="updateSummary">确 定</el-button>
            </div>
        </el-dialog>
        <el-dialog title="修改头图" :visible.sync="dialog.postThumbnail">
            <el-form id="postThumbnailForm" ref="postThumbnailForm" :model="form">
                <el-form-item label="头图" label-width="70px" prop="postThumbnail" required>
                    <el-upload class="avatar-uploader" action="/oss/upload" :headers="headers" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
                        <img v-if="form.postThumbnail" :src="form.postThumbnail" class="postThumbnail" alt=""/>
                        <i v-else class="el-icon-plus avatar-uploader-icon"/>
                    </el-upload>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.postThumbnail = false">取 消</el-button>
                <el-button type="primary" @click="updatePostThumbnail">确 定</el-button>
            </div>
        </el-dialog>
        <el-dialog title="修改作者" :visible.sync="dialog.author">
            <el-form id="authorForm" ref="authorForm" :model="form">
                <el-form-item label="作者名称" label-width="70px">
                    <el-select v-model="form.author.id" placeholder="选择作者">
                        <el-option v-for="(item,index) in authors" :key="index" :label="item.name" :value="item.id"/>
                    </el-select>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.author = false">取 消</el-button>
                <el-button type="primary" @click="updateAuthor">确 定</el-button>
            </div>
        </el-dialog>
        <el-dialog title="修改分类" :visible.sync="dialog.cate">
            <el-form id="cateForm" ref="cateForm" :model="form">
                <el-select v-model="form.category.name"
                           value-key="id"
                           clearable placeholder="请选择分类"
                           @change="changeCate">
                    <el-option v-for="(item,index) in categories" :key="index" :label="item.name" :value="item.id"/>
                </el-select>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.cate = false">取 消</el-button>
                <el-button type="primary" @click="updateCate">确 定</el-button>
            </div>
        </el-dialog>

        <el-dialog ref="editDialog" :visible.sync="dialog.edit" fullscreen center :close-on-press-escape="false">
            <el-container :style="dialogStyle">
                <el-aside width="450px">
                    <el-container :style="dialogStyle">
                        <el-aside width="100px" style="background-color: #B3C0D1;">
                            图库
                        </el-aside>
                        <el-main style="background-color: #D3DCE6;">
                            图列表
                        </el-main>
                    </el-container>
                </el-aside>
                <el-main style="background-color: #eeeeee;">
                    <el-container style="background-color: #ffffff;box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1)">
                        <el-aside class="post-thumbnail">
                            <img v-if="form.postThumbnail" :src="form.postThumbnail" class="avatar" alt=""/>
                            <i class="el-icon-plus avatar-uploader-icon"/>
                        </el-aside>
                        <el-main>
                            <el-form id="editForm" ref="editForm" :model="form" label-width="40px">
                                <el-form-item label="标题" prop="title">
                                    <el-input v-model="form.title" autocomplete="off" placeholder="文章标题" maxlength="100" show-word-limit/>
                                </el-form-item>
                                <el-form-item label="简介" prop="summary">
                                    <el-input v-model="form.summary"
                                              type="textarea"
                                              :rows="3"
                                              placeholder="文章简介"
                                              maxlength="300"
                                              show-word-limit/>
                                </el-form-item>
                            </el-form>
                        </el-main>
                    </el-container>
                    <el-card class="box-card mt20">
                        <tinymce id="tinymce" v-model="form.content" :height="200"/>
                    </el-card>
                </el-main>
            </el-container>
            <div slot="title">
                <el-button size="mini">预览</el-button>
                <el-button size="mini">保存</el-button>
            </div>
            <div slot="footer" class="dialog-footer"/>
        </el-dialog>
    </div>
</template>

<script>
    import { getList, update, create, getAuthors, updateAuthor, updateCategory } from '@/api/post/post'
    import { deepClone } from '@/utils'
    import Pagination from '@/components/Pagination'
    import Tinymce from '@/components/Tinymce'

    export default {
        name: 'PostList',
        components: { Pagination, Tinymce },
        filters: {
            statusFilter(status) {
                const statusMap = {
                    2: 'warning',
                    1: 'success',
                    0: 'info'
                }
                return statusMap[status]
            },
            statusTextFilter(status) {
                const statusMap = {
                    0: '下架',
                    1: '上架',
                    2: '草稿'
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
                form: {
                    id: '',
                    postThumbnail: '',
                    authorId: '', authorName: '', authorIcon: '',
                    author: { name: '', id: '' },
                    category: { id: '', name: '' },
                    title: '',
                    summary: '',
                    content: ''
                },
                dialog: { edit: false, author: false, cate: false, title: false, summary: false, postThumbnail: false },
                dialogStyle: {
                    height: '600px'
                },
                remoteLoading: false,
                categorys: []
            }
        },
        computed: {
            categories() {
                return this.$store.getters.categories
            },
            headers() {
                return {
                    Authorization: this.$store.getters.token
                }
            },
            authors() {
                return this.$store.getters.authors
            }
        },
        created() {
            this.getList()
            // 初始化分类信息
            this.$store.dispatch('post/getCategorys')
            // 加载作者信息.
            this.$store.dispatch('post/getAuthors')
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
                    this.form = {
                        id: '',
                        postThumbnail: '',
                        authorId: '', authorName: '', authorIcon: '',
                        title: '',
                        summary: '',
                        content: ''
                    }
                }
                this.dialog[dialogName] = true
                this.$nextTick(() => {
                    if (dialogName === 'edit') {
                        // 获取高度 editDialog
                        const editDialog = this.$refs.editDialog
                        // 设置其中 container 的高度
                        this.dialogStyle.height = (editDialog.$el.firstChild.offsetHeight - editDialog.$el.firstChild.firstChild.offsetHeight) + 'px'
                        // const header = editDialog.$el.firstElementChild.children[0]
                        const body = editDialog.$el.firstElementChild.children[1]
                        const footer = editDialog.$el.firstElementChild.children[2]
                        //
                        body.setAttribute('style', 'padding: 0px;')
                        footer.setAttribute('style', 'padding: 0px;')
                    }
                    this.$refs[dialogName + 'Form'].clearValidate()
                })
            },
            updateStatus(row, status) {
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
            changeAuthor(value) {
                this.form.authorId = value
                this.form.author.id = value
            },
            changeCate(value) {
                this.form.categoryId = value
                this.form.category.id = value
            },
            updateTitle() {
                this.$refs['titleForm'].validate(valid => {
                    if (valid) {
                        update({ id: this.form.id, title: this.form.title })
                            .then(resp => {
                                const { code, message } = resp
                                if (code === 200) {
                                    this.$notify({
                                        title: '成功更新',
                                        message: '刷新查看。',
                                        type: 'success'
                                    })
                                    this.dialog.title = false
                                    this.getList()
                                } else {
                                    this.$message.error(message)
                                }
                            })
                    }
                })
            },
            updateSummary() {
                this.$refs['summaryForm'].validate(valid => {
                    if (valid) {
                        update({ id: this.form.id, summary: this.form.summary })
                            .then(resp => {
                                const { code, message } = resp
                                if (code === 200) {
                                    this.$notify({
                                        title: '成功更新',
                                        message: '刷新查看。',
                                        type: 'success'
                                    })
                                    this.dialog.summary = false
                                    this.getList()
                                } else {
                                    this.$message.error(message)
                                }
                            })
                    }
                })
            },
            updatePostThumbnail() {
                this.$refs['postThumbnailForm'].validate(valid => {
                    if (valid) {
                        update({ id: this.form.id, postThumbnail: this.form.postThumbnail })
                            .then(resp => {
                                const { code, message } = resp
                                if (code === 200) {
                                    this.$notify({
                                        title: '成功更新',
                                        message: '刷新查看。',
                                        type: 'success'
                                    })
                                    this.dialog.postThumbnail = false
                                    this.getList()
                                } else {
                                    this.$message.error(message)
                                }
                            })
                    }
                })
            },
            updateAuthor() {
                updateAuthor({ id: this.form.id, authorId: this.form.author.id })
                    .then(resp => {
                        if (resp.code === 200) {
                            this.$notify({
                                title: '成功更新',
                                message: '刷新后查看最新作者信息',
                                type: 'success'
                            })
                            this.dialog.author = false
                            this.getList()
                        } else {
                            // 更新失败
                            this.$message.error(resp.message)
                        }
                    })
            },
            updateCate() {
                const categoryId = this.form.categoryId
                const id = this.form.id
                updateCategory({ id: id, categoryId: categoryId })
                    .then(resp => {
                        if (resp.code === 200) {
                            this.$notify({
                                title: '成功更新',
                                message: '',
                                type: 'success'
                            })
                            this.dialog.cate = false
                            this.getList()
                        } else {
                            // 更新失败
                            this.$message.error(resp.message)
                        }
                    })
            },
            remoteAuthor(value) {
                // 查询作者，生效的作者
                if (value) {
                    getAuthors({ keyword: value })
                        .then(resp => {
                            this.authors = resp.data
                        })
                } else {
                    // 清空
                    this.authors = []
                }
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
            },
            gotoEditor(id, type) {
                if (type === 1) {
                    this.$router.push('/post/ueditor/' + id)
                } else if (type === 2) {
                    this.$router.push('/post/markdown/' + id)
                }
            },
            beforeAvatarUpload(file) {
                // 上传前,检查图片格式和大小
                const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
                const isLt2M = file.size / 1024 / 1024 < 1
                if (!isJPG) {
                    this.$message.error('上传图片只能是 JPG/PNG 格式!')
                }
                if (!isLt2M) {
                    this.$message.error('上传图片大小不能超过 1m!')
                }
                if (isJPG && isLt2M) {
                    return true
                }
                return false
            },
            handleAvatarSuccess(response, file) {
                if (response.code === 200) {
                    this.form.postThumbnail = response.data.url
                } else {
                    this.$message.error('图片上传出现错误')
                }
            }
        }
    }
</script>
<style scoped>
    .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
    }

    .post-thumbnail {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px;
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
    }

    .postThumbnail {
        width: 400px;
        height: 200px;
    }

    .mt20 {
        margin-top: 20px;
    }

    .ml10 {
        margin-left: 5px;
    }
</style>
