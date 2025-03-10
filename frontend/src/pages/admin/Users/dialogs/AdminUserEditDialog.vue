<template>
    <ff-dialog ref="dialog" header="Edit User" confirm-label="Save" :closeOnConfirm="false" :disable-primary="disableSave" @confirm="confirm()">
        <template #default>
            <form class="space-y-6" @submit.prevent>
                <FormRow v-model="input.username" :error="errors.username">Username</FormRow>
                <FormRow v-model="input.name" :placeholder="input.username">Name</FormRow>
                <FormRow v-model="input.email" :error="errors.email">
                    Email
                    <template v-if="user.sso_enabled" #description>
                        <div>SSO is enabled for this user.</div>
                    </template>
                </FormRow>
                <FormRow id="email_verified" v-model="input.email_verified" wrapperClass="flex justify-between items-center" :disabled="email_verifiedLocked" type="checkbox">
                    Verified
                    <template #append>
                        <ff-button v-if="email_verifiedLocked" kind="danger" size="small" @click="unlockEmailVerify()">
                            Unlock
                            <template #icon>
                                <LockClosedIcon />
                            </template>
                        </ff-button>
                    </template>
                </FormRow>
                <FormRow id="admin" v-model="input.admin" :error="errors.admin" wrapperClass="flex justify-between items-center" :disabled="adminLocked" type="checkbox">
                    Administrator
                    <template #append>
                        <ff-button v-if="adminLocked" kind="danger" size="small" @click="unlockAdmin()">
                            Unlock
                            <template #icon>
                                <LockClosedIcon />
                            </template>
                        </ff-button>
                    </template>
                </FormRow>
                <FormRow id="user_suspended" v-model="input.user_suspended" wrapperClass="flex justify-between items-center" :disabled="user_suspendedLocked" type="checkbox">
                    Suspended
                    <template #append>
                        <ff-button v-if="user_suspendedLocked" kind="danger" size="small" @click="unlockSuspended()">
                            Unlock
                            <template #icon>
                                <LockClosedIcon />
                            </template>
                        </ff-button>
                    </template>
                </FormRow>
                <FormHeading class="text-red-700">Danger Zone</FormHeading>
                <FormRow v-if="features.mfa" :error="errors.disableMFA" wrapperClass="block">
                    <template #input>
                        <div class="flex justify-between items-center">
                            <ff-button :disabled="mfaLocked" :kind="mfaLocked?'secondary':'danger'" @click="disableMFA">
                                <template v-if="user.mfa_enabled">Disable MFA</template>
                                <template v-else>MFA not enabled</template>
                            </ff-button>
                            <ff-button v-if="mfaLocked && user.mfa_enabled" kind="danger" size="small" @click="unlockMFA()">
                                Unlock
                                <template #icon>
                                    <LockClosedIcon />
                                </template>
                            </ff-button>
                        </div>
                    </template>
                </FormRow>
                <FormRow :error="errors.expirePassword" wrapperClass="block">
                    <template #input>
                        <div class="flex justify-between items-center">
                            <ff-button :disabled="expirePassLocked" :kind="expirePassLocked?'secondary':'danger'" @click="expirePassword">Expire password</ff-button>
                            <ff-button v-if="expirePassLocked" kind="danger" size="small" @click="unlockExpirePassword()">
                                Unlock
                                <template #icon>
                                    <LockClosedIcon />
                                </template>
                            </ff-button>
                        </div>
                    </template>
                </FormRow>
                <FormRow :error="errors.deleteUser" wrapperClass="block">
                    <template #input>
                        <div class="flex justify-between items-center">
                            <ff-button :disabled="deleteLocked" :kind="deleteLocked?'secondary':'danger'" @click="deleteUser">Delete user</ff-button>
                            <ff-button v-if="deleteLocked" kind="danger" size="small" @click="unlockDelete()">
                                Unlock
                                <template #icon>
                                    <LockClosedIcon />
                                </template>
                            </ff-button>
                        </div>
                    </template>
                </FormRow>
            </form>
        </template>
    </ff-dialog>
</template>

<script>

import { LockClosedIcon } from '@heroicons/vue/outline'
import { mapState } from 'vuex'

import usersApi from '../../../../api/users.js'
import FormHeading from '../../../../components/FormHeading.vue'
import FormRow from '../../../../components/FormRow.vue'
import Alerts from '../../../../services/alerts.js'

export default {
    name: 'AdminUserEditDialog',

    components: {
        FormRow,
        FormHeading,
        LockClosedIcon
    },
    emits: ['user-updated', 'user-deleted'],
    setup () {
        return {
            show (user) {
                this.$refs.dialog.show()
                this.user = user
                this.input.username = user.username
                this.input.name = user.name
                this.input.email = user.email
                this.input.admin = user.admin
                this.input.email_verified = user.email_verified
                this.email_verifiedLocked = true
                this.adminLocked = true
                this.deleteLocked = true
                this.expirePassLocked = true
                this.user_suspendedLocked = true
                this.input.user_suspended = user.suspended
                this.mfaLocked = true
                this.errors = {}
            }
        }
    },
    data () {
        return {
            input: {},
            errors: {},
            user: null,
            adminLocked: true,
            email_verifiedLocked: false,
            deleteLocked: true,
            expirePassLocked: true,
            user_suspendedLocked: true,
            mfaLocked: true
        }
    },
    computed: {
        ...mapState('account', ['features']),
        disableSave () {
            const { isChanged, isValid } = this.getChanges()
            return !isValid || !isChanged
        }
    },
    watch: {
        'input.username': function (v) {
            if (v && !/^[a-z0-9-_]+$/i.test(v)) {
                this.errors.username = 'Must only contain a-z 0-9 - _'
            } else {
                this.errors.username = ''
            }
        },
        'input.email': function (v) {
            if (v && !/.+@.+/.test(v)) {
                this.errors.email = 'Enter a valid email address'
            } else {
                this.errors.email = ''
            }
        }
    },
    methods: {
        unlockEmailVerify () {
            this.email_verifiedLocked = false
        },
        unlockAdmin () {
            this.adminLocked = false
        },
        unlockDelete () {
            this.deleteLocked = false
        },
        unlockExpirePassword () {
            this.expirePassLocked = false
        },
        unlockSuspended () {
            this.user_suspendedLocked = false
        },
        unlockMFA () {
            this.mfaLocked = false
        },
        getChanges () {
            const changes = {}
            const isValid = (this.input.email && !this.errors.email) &&
                   (this.input.username && !this.errors.username)
            if (this.user) {
                if (this.input.username !== this.user.username) {
                    changes.username = this.input.username
                }
                if (this.input.name !== this.user.name) {
                    changes.name = this.input.name
                }
                if (this.input.email !== this.user.email) {
                    changes.email = this.input.email
                }
                if (this.input.admin !== this.user.admin) {
                    changes.admin = this.input.admin
                }
                if (this.input.email_verified !== this.user.email_verified) {
                    changes.email_verified = this.input.email_verified
                }
                if (this.input.user_suspended !== this.user.suspended) {
                    changes.suspended = this.input.user_suspended
                }
            }
            const isChanged = Object.keys(changes).length > 0
            return { isValid, isChanged, changes }
        },
        confirm () {
            const { isValid, isChanged, changes } = this.getChanges()
            if (isValid && isChanged) {
                usersApi.updateUser(this.user.id, changes).then((response) => {
                    this.$emit('user-updated', response)
                    this.$refs.dialog.close()
                }).catch(err => {
                    console.error(err.response.data)
                    if (err.response.data) {
                        let showAlert = true
                        if (/username/.test(err.response.data.error)) {
                            this.errors.username = 'Username unavailable'
                            showAlert = false
                        }
                        if (/password/.test(err.response.data.error)) {
                            this.errors.password = 'Invalid username'
                            showAlert = false
                        }
                        if (/admin/i.test(err.response.data.error)) {
                            this.errors.admin = err.response.data.error
                            showAlert = false
                        }
                        if (err.response.data.error === 'email must be unique') {
                            this.errors.email = 'Email already registered'
                            showAlert = false
                        }
                        if (showAlert) {
                            const msgLines = []
                            if (err.response.data.error) {
                                msgLines.push(err.response.data.error)
                                if (err.response.data.message) {
                                    msgLines.push(err.response.data.message)
                                }
                            } else {
                                msgLines.push(err.message || 'Unknown error')
                            }
                            const msg = msgLines.join(' : ')
                            Alerts.emit(msg, 'warning', 7500)
                        }
                    }
                })
            } else {
                this.$refs.dialog.close()
            }
        },
        deleteUser () {
            usersApi.deleteUser(this.user.id).then((response) => {
                this.$refs.dialog.close()
                this.$emit('user-deleted', this.user.id)
            }).catch(err => {
                this.errors.deleteUser = err.response.data.error
            })
        },
        expirePassword () {
            usersApi.updateUser(this.user.id, { password_expired: true })
                .then((response) => {
                    this.$refs.dialog.close()
                    this.$emit('user-updated', response)
                }).catch(err => {
                    this.errors.expirePassword = err.response.data.error
                })
        },
        disableMFA () {
            usersApi.updateUser(this.user.id, { mfa_enabled: false })
                .then((response) => {
                    this.$refs.dialog.close()
                    this.$emit('user-updated', response)
                }).catch(err => {
                    this.errors.disableMFA = err.response.data.error
                })
        }
    }
}
</script>
