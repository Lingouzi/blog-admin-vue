<template>
    <el-container>
        <el-aside ref="asideLeft" width="70%">
            <markdown-editor v-model="form.content" height="600px" language="zh_CN"/>
        </el-aside>
        <el-container>
            <el-header>
                <el-button @click="save">{{ btnText }}</el-button>
            </el-header>
            <el-main>
                <el-form id="editForm" ref="editForm" :model="form" label-width="50px">
                    <el-form-item label="头图" prop="postThumbnail" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                        <el-upload class="avatar-uploader" action="/oss/upload" :headers="headers" :show-file-list="false"
                                   :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload" :on-error="handleError">
                            <img v-if="form.postThumbnail" :src="form.postThumbnail" class="avatar" alt=""/>
                            <i v-else class="el-icon-plus avatar-uploader-icon"/>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="标题" prop="title" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                        <el-input v-model="form.title" autocomplete="off" placeholder="文章标题" maxlength="100" show-word-limit/>
                    </el-form-item>
                    <el-form-item label="简介" prop="summary" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                        <el-input v-model="form.summary"
                                  type="textarea"
                                  :rows="3"
                                  placeholder="文章简介"
                                  maxlength="300"
                                  show-word-limit/>
                    </el-form-item>
                    <el-form-item label="分类" prop="category.id" :rules="{ required: true, message: '必填', trigger: 'blur' }">
                        <el-select v-model="form.category.id" placeholder="请选择">
                            <el-option v-for="(item,index) in categories" :key="index" :label="item.name" :value="item.id">
                                {{ item.name }}
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="作者" prop="author.id" required>
                        <el-radio-group v-model="form.author.id">
                            <el-radio v-for="(item,index) in authors" :key="index" :label="item.id">
                                <el-avatar :src="item.icon"/>
                                {{ item.name }}
                            </el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-form>
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
    import MarkdownEditor from '@/components/MarkdownEditor'
    import { create, getPostById, update } from '@/api/post/post'

    export default {
        name: 'MarkDown',
        components: { MarkdownEditor },
        data() {
            return {
                btnText: this.$route.params.id > 0 ? '更新' : '保存',
                form: {
                    id: '',
                    postThumbnail: '',
                    authorId: '', authorName: '', authorIcon: '',
                    author: { name: '', id: '' },
                    category: { id: '', name: '' },
                    title: '',
                    summary: '',
                    content: '',
                    contentType: 2
                }
            }
        },
        computed: {
            categories() {
                return this.$store.getters.categories
            },
            authors() {
                return this.$store.getters.authors
            },
            headers() {
                return {
                    Authorization: this.$store.getters.token
                }
            }
        },
        created() {
            // 初始化分类信息
            this.$store.dispatch('post/getCategorys')
            // 加载作者信息.
            this.$store.dispatch('post/getAuthors')
            // 在html渲染之前调用，
            const id = this.$route.params.id
            if (id && parseInt(id) !== 0) {
                getPostById({ id: id })
                    .then(response => {
                        const { code, data, message } = response
                        if (code === 200) {
                            this.form = data
                        } else {
                            this.$message.error(message)
                        }
                    })
            }
        },
        methods: {
            save() {
                this.$refs['editForm'].validate(valid => {
                    if (valid) {
                        this.dialogLoading = this.$loading({
                            lock: true,
                            text: '数据提交中...'
                        })
                        if (this.form.id) {
                            // 更改
                            update(this.form)
                                .then(response => {
                                    const { code, message } = response
                                    this.dialogLoading.close()
                                    if (code === 200) {
                                        // 提示成功
                                        this.$notify({
                                            title: '成功更新',
                                            type: 'success'
                                        })
                                    } else {
                                        this.$message.error(message)
                                    }
                                })
                        } else {
                            // 创建
                            create(this.form)
                                .then(response => {
                                    const { code, data, message } = response
                                    this.dialogLoading.close()
                                    if (code === 200) {
                                        // 提示成功
                                        this.$notify({
                                            title: '成功创建',
                                            type: 'success'
                                        })
                                        // 获取到返回，然后设置id，那么就可以继续更新。
                                        this.form.id = data
                                        this.btnText = '更新'
                                    } else {
                                        this.$message.error(message)
                                    }
                                })
                                .catch(() => {
                                    this.dialogLoading.close()
                                })
                        }
                    }
                })
            },
            beforeAvatarUpload(file) {
                // 上传前,检查图片格式和大小
                const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
                const isLt2M = file.size / 1024 / 1024 < 1
                if (!isJPG) {
                    this.$message.error('图片只能是 JPG/PNG 格式!')
                }
                if (!isLt2M) {
                    this.$message.error('图片大小不能超过 1m!')
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

    .mb20 {
        margin-bottom: 20px;
    }

    .el-header, .el-footer {
        text-align: center;
        line-height: 60px;
    }

    .avatar-uploader {
        position: relative;
        overflow: hidden;
    }

    .avatar-uploader-icon {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        font-size: 28px;
        color: #8c939d;
        width: 200px;
        height: 100px;
        line-height: 100px;
        text-align: center;
    }

    .avatar-uploader-icon:hover {
        border-color: #409eff;
    }

    .avatar {
        width: 200px;
        height: 100px;
        display: block;
    }
</style>
