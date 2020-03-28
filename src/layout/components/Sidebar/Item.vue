<script>
    export default {
        name: 'MenuItem',
        functional: true,
        props: {
            icon: {
                type: String,
                default: ''
            },
            title: {
                type: String,
                default: ''
            }
        },
        render(h, context) {
            const { icon, title } = context.props
            const vnodes = []
            if (icon) {
                vnodes.push(h('svg-icon', {
                    props: {
                        iconClass: icon
                    }
                }))
            }
            if (title) {
                vnodes.push(h('span', title))
            }
            return vnodes
        }
    }
</script>
