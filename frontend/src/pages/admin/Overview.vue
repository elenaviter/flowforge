<template>
    <SectionTopMenu hero="Admin Settings" />
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700">
        <div class="border rounded px-4 py-2 text-center">
            <router-link to="/admin/users/general">
                <div class="text-xl">{{ stats.userCount }}/{{ stats.maxUsers }}</div>
                <div>Users</div>
            </router-link>
            <div class="w-full grid grid-cols-2 pt-1 mt-2 border-t">
                <div>{{ stats.adminCount }} {{ $filters.pluralize(stats.adminCount,'admin') }}</div>
                <div><router-link to="/admin/users/invitations">{{ stats.inviteCount }} {{ $filters.pluralize(stats.inviteCount,'invite') }}</router-link></div>
            </div>
        </div>
        <div class="border rounded p-4 text-center">
            <router-link to="/admin/teams">
                <div class="text-xl">{{ stats.teamCount }}/{{ stats.maxTeams }}</div>
                <div>{{ $filters.pluralize(stats.teamCount,'Team') }}</div>
            </router-link>
        </div>
        <div class="border rounded p-4 text-center">
            <div class="text-xl">{{ stats.instanceCount }}/{{ stats.maxInstances }}</div>
            <div>{{ $filters.pluralize(stats.instanceCount,'Project') }}</div>
            <div v-if="stats.instancesByState && Object.keys(stats.instancesByState).length > 0" class="w-full grid grid-cols-1 pt-1 mt-2 border-t">
                <div v-for="(count, state) in stats.instancesByState" :key="state">
                    {{ count }} {{ state }}
                </div>
            </div>
        </div>

        <div class="border rounded p-4 text-center">
            <div class="text-xl">{{ stats.deviceCount }}/{{ stats.maxDevices }}</div>
            <div>{{ $filters.pluralize(stats.deviceCount,'Device') }}</div>
        </div>
        <div class="border rounded p-4 col-span-2 md:col-span-4">
            <div class="text-xl mb-1 border-b">License</div>
            <table v-if="license">
                <tr><td class="font-medium p-2 pr-4 align-top">Type</td><td class="p-2"><span v-if="!license.dev">FlowFuse Enterprise Edition</span><span v-else class="font-bold">FlowFuse Development Only</span></td></tr>
                <tr><td class="font-medium p-2 pr-4 align-top">Organisation</td><td class="p-2">{{ license.organisation }}</td></tr>
                <tr><td class="font-medium p-2 pr-4 align-top">Tier</td><td class="p-2">{{ license.tier }}</td></tr>
                <tr><td class="font-medium p-2 pr-4 align-top">Expires</td><td class="p-2">{{ license.expires }}<br><span class="text-xs">{{ license.expiresAt }}</span></td></tr>
            </table>
            <div v-else>
                <table>
                    <tr><td class="font-medium p-2 pr-4 align-top">Type</td><td class="p-2">FlowFuse Community Edition</td></tr>
                </table>
            </div>
        </div>
        <div class="border rounded p-4 col-span-2 md:col-span-4">
            <div class="text-xl mb-1 border-b">Version</div>
            <table>
                <tr><td class="font-medium p-2 pr-4 align-top">Forge Application</td><td class="p-2">{{ settings['version:forge'] }}</td></tr>
                <tr><td class="font-medium p-2 pr-4 align-top">NodeJS</td><td class="p-2">{{ settings['version:node'] }}</td></tr>
            </table>
        </div>
    </div>
</template>

<script>
import adminApi from '../../api/admin.js'
import Settings from '../../api/settings.js'
import SectionTopMenu from '../../components/SectionTopMenu.vue'

export default {
    name: 'AdminSettingsGeneral',
    components: {
        SectionTopMenu
    },
    data: function () {
        return {
            license: {},
            stats: {},
            settings: {}
        }
    },
    async mounted () {
        this.stats = await adminApi.getStats()
        this.license = await adminApi.getLicenseDetails()
        this.settings = await Settings.getSettings()
    }
}
</script>
