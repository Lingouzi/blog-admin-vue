<template>
    <div class="dashboard-container">
        <el-row :gutter="10" type="flex" justify="start">
            <el-col :span="3">
                <router-link to="/message/list">
                    <div class="dashboard-btn">留言板</div>
                </router-link>
            </el-col>
            <el-col :span="3">
                <router-link to="/feedback/list">
                    <div class="dashboard-btn">反馈</div>
                </router-link>
            </el-col>
            <el-col :span="3">
                <router-link to="/comment/list">
                    <div class="dashboard-btn">评论</div>
                </router-link>
            </el-col>
        </el-row>
        <el-row :gutter="10" type="flex" justify="center">
            <el-col :span="12">
                <v-chart ref="readChart" :options="optionsRead"/>
            </el-col>
            <el-col :span="12">
                <v-chart :options="optionsRegister"/>
            </el-col>
        </el-row>
        <el-row :gutter="10" type="flex" justify="center">
            <el-col :span="12">
                <v-chart :options="optionsUser"/>
            </el-col>
            <el-col :span="12"/>
        </el-row>
    </div>
</template>

<script>
    import ECharts from 'vue-echarts'
    import 'echarts/lib/chart/line'
    import 'echarts/lib/chart/pie'
    import 'echarts/lib/component/title'
    import 'echarts/lib/component/toolbox'
    import 'echarts/lib/component/tooltip'
    import 'echarts/lib/component/legend'

    export default {
        name: 'Dashboard',
        components: {
            'v-chart': ECharts
        },
        data() {
            const data = []

            for (let i = 0; i <= 360; i++) {
                const t = i / 180 * Math.PI
                const r = Math.sin(2 * t) * Math.cos(2 * t)
                data.push([r, i])
            }
            return {
                optionsRead: {
                    title: {
                        text: '阅读量统计'
                    },
                    xAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [{
                        data: [820, 932, 901, 934, 1290, 1330, 1320],
                        name: '总数',
                        type: 'line',
                        smooth: true
                    }, {
                        data: [111, 222, 333, 1231, 2342, 345, 645],
                        name: '',
                        type: 'line',
                        smooth: true
                    }]
                },
                optionsRegister: {
                    title: {
                        text: '用户注册信息',
                        subtext: '其他来源：git,..'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {
                        data: ['总数', '微信', 'QQ', '微博']
                    },
                    toolbox: {
                        show: true,
                        feature: {
                            magicType: { show: true, type: ['stack', 'tiled'] },
                            saveAsImage: { show: true }
                        }
                    },
                    xAxis: {
                        type: 'category',
                        name: '时间',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [{
                        data: [820, 932, 901, 934, 1290, 1330, 1320],
                        name: '总数',
                        type: 'line',
                        smooth: true
                    }, {
                        data: [111, 213, 435, 314, 456, 757, 816],
                        name: '微信',
                        type: 'line',
                        smooth: true
                    }, {
                        data: [2, 8, 7, 4, 3, 2, 3],
                        name: 'QQ',
                        type: 'line',
                        smooth: true
                    }, {
                        data: [4, 6, 57, 87, 65, 76, 34],
                        name: '微博',
                        type: 'line',
                        smooth: true
                    }]
                },
                optionsUser: {
                    backgroundColor: '#2c343c',
                    title: {
                        text: '注册用户组成',
                        left: 'center',
                        top: 20,
                        textStyle: {
                            color: '#ccc'
                        }
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: '{a} <br/>{b} : {c} ({d}%)'
                    },
                    visualMap: {
                        show: false,
                        min: 80,
                        max: 600,
                        inRange: {
                            colorLightness: [0, 1]
                        }
                    },
                    series: [
                        {
                            name: '访问来源',
                            type: 'pie',
                            radius: '55%',
                            center: ['50%', '50%'],
                            data: [
                                { value: 335, name: '微信' },
                                { value: 310, name: 'QQ' },
                                { value: 235, name: 'Email' },
                                { value: 235, name: 'Phone' },
                                { value: 274, name: '微博' },
                                { value: 235, name: 'GitHub' }
                            ].sort(function(a, b) {
                                return a.value - b.value
                            }),
                            roseType: 'radius',
                            label: {
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            labelLine: {
                                lineStyle: {
                                    color: 'rgba(255, 255, 255, 0.3)'
                                },
                                smooth: 0.2,
                                length: 10,
                                length2: 20
                            },
                            itemStyle: {
                                shadowBlur: 200,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            },
                            animationType: 'scale',
                            animationEasing: 'elasticOut',
                            animationDelay: function(idx) {
                                return Math.random() * 200
                            }
                        }
                    ]
                }
            }
        },
        mounted() {
            // 模拟加载数据
            this.resetData()
        },
        methods: {
            resetData() {
                // 加载数据，展示loading，加载完毕后，关闭loading，刷新charts
                const that = this
                that.$refs.readChart.showLoading()
                setTimeout(function() {
                    that.optionsRead.series[0].data = [561, 567, 685, 764, 234, 625, 454]
                    that.$refs.readChart.hideLoading()
                }, 4000)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .dashboard {
        &-container {
            margin: 30px;
        }

        &-text {
            font-size: 30px;
            line-height: 46px;
        }

        &-btn {
            font-size: 14px;
            line-height: 14px;
            border-radius: 5px;
            padding: 15px;
            background-color: darkgrey;
            text-align: center;
            cursor: pointer;
        }
    }
</style>
