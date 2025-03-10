<template>
    <ff-loading v-if="loading" message="Loading Logs..." />
    <div v-if="showOfflineBanner" class="ff-banner ff-banner-info my-2 rounded p-2 font-mono">
        <span>
            <span>The Node-RED instance cannot be reached at this time. Please wait...</span>
        </span>
    </div>
    <div v-if="!instance.meta || instance.meta.state === 'suspended'" class="flex text-gray-500 justify-center italic mb-4 p-8">
        Logs unavailable
    </div>
    <div v-else :class="showOfflineBanner ? 'forge-log-offline-background' : ''" class="mx-auto text-xs border bg-gray-800 text-gray-200 rounded p-2 font-mono">
        <div v-if="prevCursor" class="flex">
            <a class=" text-center w-full hover:text-blue-400 cursor-pointer pb-1" @click="loadPrevious">Load earlier...</a>
        </div>
        <div
            v-for="(item, itemIdx) in filteredLogEntries" :key="itemIdx"
            data-el="instance-log-row"
            class="flex" :class="'forge-log-entry-level-' + item.level"
        >
            <div v-if="instance.ha?.replicas !== undefined" class="w-14 flex-shrink-0">[{{ item.src }}]</div>
            <div class="w-40 flex-shrink-0">{{ item.date }}</div>
            <div class="w-20 flex-shrink-0 align-right">[{{ item.level }}]</div>
            <div class="flex-grow break-all whitespace-pre-wrap">{{ item.msg }}</div>
        </div>
    </div>
</template>

<script>
import InstanceApi from '../../../api/instances.js'
import { VueTimersMixin } from '../../../mixins/vue-timers.js'
import Alerts from '../../../services/alerts.js'
const POLL_TIME = 5000

export default {
    name: 'LogsShared',
    mixins: [VueTimersMixin],
    inheritAttrs: false,
    props: {
        instance: {
            type: Object,
            required: true
        },
        filter: {
            default: null,
            type: String,
            required: false
        }
    },
    emits: ['ha-instance-detected'],
    data () {
        return {
            doneInitialLoad: false,
            loading: true,
            logEntries: [],
            prevCursor: null,
            nextCursor: null,
            checkInterval: null,
            showOfflineBanner: false
        }
    },
    computed: {
        filteredLogEntries: function () {
            if (this.filter && this.filter !== 'all') {
                const filteredList = this.logEntries.filter(l => l.src === this.filter)
                return filteredList
            } else {
                return this.logEntries
            }
        }
    },
    timers: {
        pollTimer: { time: POLL_TIME, repeat: true, autostart: false }
    },
    watch: {
        instance: 'fetchData'
    },
    async mounted () {
        if (!this.instance.meta || this.instance.meta.state === 'suspended') {
            this.loading = false
        }
        await this.fetchData()
        this.$timer.start('pollTimer')
    },
    methods: {
        pollTimer: function () {
            if (this.instance.meta && this.instance.meta.state !== 'suspended') {
                this.loadNext()
            }
        },
        fetchData: async function () {
            if (this.instance.id) {
                if (this.instance.meta && this.instance.meta.state !== 'suspended') {
                    await this.loadItems(this.instance.id)
                    this.loading = false
                } else {
                    this.logEntries = []
                    this.prevCursor = null
                }
            }
        },
        loadPrevious: async function () {
            this.loadItems(this.instance.id, this.prevCursor)
        },
        loadNext: async function () {
            this.loadItems(this.instance.id, this.nextCursor)
        },
        loadItems: async function (instanceId, cursor) {
            try {
                const entries = await InstanceApi.getInstanceLogs(instanceId, cursor, null, { showAlert: false })
                this.showOfflineBanner = false
                if (!cursor) {
                    this.prevCursor = null
                    this.logEntries = []
                }
                const toPrepend = []
                if (entries.log.length > 0) {
                    entries.log.forEach(l => {
                        const d = new Date(parseInt(l.ts.substring(0, l.ts.length - 4)))
                        l.date = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
                        if (typeof l.msg === 'undefined') {
                            l.msg = 'undefined'
                        } else if (typeof l.msg !== 'string') {
                            l.msg = JSON.stringify(l.msg)
                        }
                        l.msg = l.msg.replace(/^[\n]*/, '')
                        if (!cursor || cursor[0] !== '-') {
                            this.logEntries.push(l)
                        } else {
                            toPrepend.push(l)
                        }
                        if (l.src) {
                            this.$emit('ha-instance-detected', l.src)
                        }
                    })
                    if (toPrepend.length > 0) {
                        this.logEntries = toPrepend.concat(this.logEntries)
                    }
                    if (!cursor || cursor[0] === '-') {
                        this.prevCursor = entries.meta.previous_cursor
                    }
                    if (!cursor || cursor[0] !== '-') {
                        this.nextCursor = entries.meta.next_cursor
                    }
                }
            } catch (error) {
                // log the error as warn for troubleshooting purposes
                console.warn('Unable to retrieve Node-RED instance logs:', error)

                // Error 503 is returned by the API when the launcher is offline.
                // Error 500 is handled (and surfaced) by the `client.interceptors` in `../../../api/client.js`
                // Error with data.code === 'project_suspended' is ignored - it is expected when the project is suspended
                if (error.response?.status === 503) {
                    if (this.showOfflineBanner === true) {
                        return // only show the alert once
                    }
                    this.showOfflineBanner = true // show the "offline" banner
                    Alerts.emit('The Node-RED instance cannot be reached at this time', 'warning', (POLL_TIME - 500))
                } else if (error.response?.status !== 500 && error.response?.data?.code !== 'project_suspended') {
                    // display an alert. Ensure it is visible for less time than
                    // the polling interval to avoid multiple visible alerts
                    const message = error.response?.data?.error || error.message
                    Alerts.emit('Could not get Node-RED logs: ' + message, 'warning', (POLL_TIME - 500))
                }
            }
        }
    }
}
</script>

<style scoped>
.forge-log-offline-background {
    background: repeating-linear-gradient(
        -45deg,
        #363848,
        #363848 10px,
        rgba(31, 41, 55, var(--tw-bg-opacity)) 10px,
        rgba(31, 41, 55, var(--tw-bg-opacity)) 20px
    );
}
</style>
