<template>
    <div class="space-y-6">
        <template v-if="teamTypes.length > 1">
            <FormHeading>Change Team Type</FormHeading>
            <div class="flex flex-col space-y-4 max-w-2xl lg:flex-row lg:items-center lg:space-y-0">
                <div class="flex-grow">
                    <div class="max-w-sm pr-2">Change to a different team type</div>
                </div>
                <div class="min-w-fit flex-shrink-0">
                    <ff-button data-action="change-team-type" :to="{name: 'TeamChangeType'}">Change Team Type</ff-button>
                </div>
            </div>
        </template>
        <FormHeading class="text-red-700">Delete Team</FormHeading>
        <div class="flex flex-col space-y-4 max-w-2xl lg:flex-row lg:items-center lg:space-y-0">
            <div class="flex-grow">
                <div class="max-w-sm pr-2">{{ deleteDescription }}</div>
            </div>
            <div class="min-w-fit flex-shrink-0">
                <ff-button kind="danger" data-action="delete-team" :disabled="!deleteActive" @click="showConfirmDeleteDialog()">Delete Team</ff-button>
                <ConfirmTeamDeleteDialog ref="confirmTeamDeleteDialog" @delete-team="deleteTeam" />
            </div>
        </div>
        <TeamAdminTools v-if="isAdmin" :team="team" />
    </div>
</template>

<script>
import { mapState } from 'vuex'

import teamApi from '../../../api/team.js'
import teamTypesApi from '../../../api/teamTypes.js'

import FormHeading from '../../../components/FormHeading.vue'

import ConfirmTeamDeleteDialog from '../dialogs/ConfirmTeamDeleteDialog.vue'

import TeamAdminTools from './TeamAdminTools.vue'

export default {
    name: 'TeamSettingsDanger',
    components: {
        FormHeading,
        ConfirmTeamDeleteDialog,
        TeamAdminTools
    },
    props: {
        team: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            applicationCount: -1,
            teamTypes: []
        }
    },
    computed: {
        ...mapState('account', ['user']),
        isAdmin: function () {
            return this.user.admin
        },
        deleteActive () {
            return this.applicationCount === 0
        },
        deleteDescription () {
            if (this.applicationCount > 0) {
                return 'You cannot delete a team that still owns applications.'
            } else {
                return 'Deleting the team cannot be undone. Take care.'
            }
        }
    },
    watch: {
        team: 'fetchData'
    },
    async created () {
        const teamTypesPromise = await teamTypesApi.getTeamTypes()

        this.teamTypes = (await teamTypesPromise).types
    },
    mounted () {
        this.fetchData()
    },
    methods: {
        showConfirmDeleteDialog () {
            this.$refs.confirmTeamDeleteDialog.show(this.team)
        },
        deleteTeam () {
            teamApi.deleteTeam(this.team.id).then(() => {
                this.$store.dispatch('account/checkState', '/')
            }).catch(err => {
                console.warn(err)
            })
        },
        async fetchData () {
            if (this.team.id) {
                const applicationList = await teamApi.getTeamApplications(this.team.id)
                this.applicationCount = applicationList.count
            }
        }
    }
}
</script>
