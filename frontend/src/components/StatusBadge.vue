<template>
    <div v-if="!status" class="forge-badge"><RefreshIcon class="w-4 h-4 animate-spin" /></div>
    <div
        v-else
        class="forge-badge"
        :class="['forge-status-' + status, pendingChange ? 'opacity-40' : '']"
    >
        <ExclamationCircleIcon v-if="status === 'error' || status === 'crashed'" class="w-4 h-4" />
        <ExclamationIcon v-if="status === 'suspended'" class="w-4 h-4" />
        <PlayIcon v-if="status === 'running'" class="w-4 h-4" />
        <StopIcon v-if="status === 'stopping' || status === 'suspending'" class="w-4 h-4" />
        <AnimIconRestarting v-if="status === 'restarting'" class="w-4 h-4" />
        <AnimIconInstalling v-if="status === 'importing'" class="w-4 h-4" />
        <AnimIconStarting v-if="status === 'starting'" class="w-4 h-4" />
        <CloudUploadIcon v-if="status === 'loading'" class="w-4 h-4" />
        <AnimIconInstalling v-if="status === 'installing'" class="w-3 h-3" />
        <SupportIcon v-if="status === 'safe'" class="w-4 h-4" />
        <span class="ml-1">{{ status }}</span>
    </div>
</template>

<script>
import {
    CloudUploadIcon,
    ExclamationCircleIcon,
    ExclamationIcon,
    PlayIcon,
    RefreshIcon,
    StopIcon,
    SupportIcon
} from '@heroicons/vue/outline'

import { AnimIconInstalling, AnimIconRestarting, AnimIconStarting } from './icons-animated/index.js'

export default {
    name: 'StatusBadge',
    components: {
        CloudUploadIcon,
        ExclamationCircleIcon,
        ExclamationIcon,
        PlayIcon,
        StopIcon,
        SupportIcon,
        RefreshIcon,
        AnimIconInstalling,
        AnimIconRestarting,
        AnimIconStarting
    },
    props: {
        status: {
            type: String,
            default: null
        },
        pendingChange: {
            type: Boolean,
            default: false
        }
    }
}
</script>
