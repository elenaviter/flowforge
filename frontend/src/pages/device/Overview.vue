<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard header="Connection:">
            <template #icon>
                <WifiIcon />
            </template>
            <template #content>
                <InfoCardRow property="Last Seen:">
                    <template #value>
                        <DeviceLastSeenBadge :last-seen-at="lastSeenAt" :last-seen-ms="lastSeenMs" :last-seen-since="lastSeenSince" />
                    </template>
                </InfoCardRow>
                <InfoCardRow property="Status:">
                    <template #value>
                        <StatusBadge :status="device.status" />
                    </template>
                </InfoCardRow>
                <InfoCardRow property="Agent Version:" :value="device.agentVersion || 'unknown'" />
            </template>
        </InfoCard>
        <InfoCard header="Deployment:">
            <template #icon>
                <TemplateIcon />
            </template>
            <template #content>
                <InfoCardRow property="Application:">
                    <template #value>
                        <router-link v-if="device?.application" :to="{name: 'Application', params: { id: device.application.id }}">
                            {{ device.application?.name }}
                        </router-link>
                        <span v-else>None</span>
                    </template>
                </InfoCardRow>
                <InfoCardRow v-if="device.ownerType!=='application'" property="Instance:">
                    <template #value>
                        <router-link v-if="device?.instance" :to="{name: 'Instance', params: { id: device.instance.id }}">
                            {{ device.instance?.name }}
                        </router-link>
                        <span v-else>None</span>
                    </template>
                </InfoCardRow>
                <InfoCardRow property="Active Snapshot:">
                    <template #value>
                        <span class="flex gap-2 pr-2">
                            <span class="flex items-center space-x-2 text-gray-500 italic">
                                <ExclamationIcon class="text-yellow-600 w-4" v-if="!device.activeSnapshot || !targetSnapshotDeployed" />
                                <CheckCircleIcon class="text-green-700 w-4" v-else />
                            </span>

                            <template v-if="device.activeSnapshot">
                                <div class="flex flex-col">
                                    <span>{{ device.activeSnapshot.name }}</span>
                                    <span class="text-xs text-gray-500">{{ device.activeSnapshot.id }}</span>
                                </div>
                            </template>
                            <template v-else>
                                No Snapshot Deployed
                            </template>
                        </span>
                    </template>
                </InfoCardRow>

                <InfoCardRow property="Target Snapshot:">
                    <template #value>
                        <span class="flex gap-2 pr-2">
                            <span class="flex items-center space-x-2 text-gray-500 italic">
                                <ExclamationIcon class="text-yellow-600 w-4" v-if="!device.targetSnapshot" />
                                <CheckCircleIcon class="text-green-700 w-4" v-else />
                            </span>
                            <template v-if="device.targetSnapshot">
                                <div class="flex flex-col">
                                    <span>{{ device.targetSnapshot.name }}</span>
                                    <span class="text-xs text-gray-500">{{ device.targetSnapshot.id }}</span>
                                </div>
                            </template>
                            <template v-else>
                                No Target Snapshot Set
                            </template>
                        </span>
                    </template>
                </InfoCardRow>

                <InfoCardRow property="Device Mode">
                    <template #value>
                        <span v-if="device.mode === 'developer'" class="flex space-x-2 pr-2 items-center">
                            <BeakerIcon class="text-purple-600 w-4" />
                            <span> Developer Mode</span>
                        </span>
                        <span v-else>
                            <span> Default</span>
                        </span>
                    </template>
                </InfoCardRow>
            </template>
        </InfoCard>
    </div>
</template>

<script>

// utilities
import { BeakerIcon, CheckCircleIcon, ExclamationIcon, TemplateIcon, WifiIcon } from '@heroicons/vue/outline'

// api
import { mapState } from 'vuex'

// components
import InfoCard from '../../components/InfoCard.vue'
import InfoCardRow from '../../components/InfoCardRow.vue'
import StatusBadge from '../../components/StatusBadge.vue'

import DeviceLastSeenBadge from './components/DeviceLastSeenBadge.vue'

export default {
    name: 'DeviceOverview',
    emits: ['device-updated', 'device-refresh'],
    props: ['device'],
    components: {
        BeakerIcon,
        CheckCircleIcon,
        ExclamationIcon,
        WifiIcon,
        InfoCard,
        InfoCardRow,
        TemplateIcon,
        DeviceLastSeenBadge,
        StatusBadge
    },
    computed: {
        ...mapState('account', ['settings', 'features']),
        targetSnapshotDeployed: function () {
            return this.device.activeSnapshot?.id === this.device.targetSnapshot?.id
        },
        lastSeenAt: function () {
            return this.device?.lastSeenAt || ''
        },
        lastSeenMs: function () {
            return this.device?.lastSeenMs || 0
        },
        lastSeenSince: function () {
            return this.device?.lastSeenSince || ''
        },
        deviceOwnerType: function () {
            return this.device?.ownerType || ''
        }
    },
    mounted () {
        this.refreshDevice()
    },
    methods: {
        // pollTimer method is called by VueTimersMixin. See the timers property above.
        pollTimer: async function () {
            this.refreshDevice()
        },
        refreshDevice: function () {
            this.$emit('device-refresh') // cause parent to refresh device
        }
    }
}
</script>
