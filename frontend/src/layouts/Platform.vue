<template>
    <div class="ff-layout--platform">
        <PageHeader :mobileMenuOpen="mobileMenuOpen" @menu-toggle="toggleMenu" />
        <div class="ff-layout--platform--wrapper">
            <div id="platform-sidenav" class="ff-navigation" :class="{'open': mobileMenuOpen}">
                <!-- Each view uses a <Teleport> to fill this -->
            </div>
            <div class="ff-view">
                <div id="platform-banner" />
                <slot />
            </div>
            <TransitionGroup class="ff-notifications" name="notifications-list" tag="div">
                <ff-notification-toast
                    v-for="(a, $index) in alertsReversed" :key="a.timestamp"
                    :type="a.type" :message="a.message" data-el="notification-alert"
                    :countdown="a.countdown || 3000" @close="clear($index)"
                />
            </TransitionGroup>
            <interview-popup v-if="interview?.enabled" :flag="interview.flag" :payload="interview.payload" />
            <ff-dialog ref="dialog" data-el="platform-dialog" :header="dialog.header" :kind="dialog.kind" :disable-primary="dialog.disablePrimary" :confirm-label="dialog.confirmLabel" @cancel="clearDialog(true)" @confirm="dialog.onConfirm">
                <p v-if="dialog.text">{{ dialog.text }}</p>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="space-y-2" v-html="dialog.html" />
            </ff-dialog>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

import InterviewPopup from '../components/InterviewPopup.vue'
import PageHeader from '../components/PageHeader.vue'

import alerts from '../services/alerts.js'
import dialog from '../services/dialog.js'

export default {
    name: 'ff-layout-platform',
    components: {
        PageHeader,
        InterviewPopup
    },
    data () {
        return {
            mobileMenuOpen: false,
            alerts: [],
            dialog: {
                header: null,
                text: null,
                html: null,
                confirmLabel: null,
                kind: null,
                onConfirm: null,
                onCancel: null
            }
        }
    },
    computed: {
        ...mapState('product', ['interview']),
        alertsReversed: function () {
            return [...this.alerts].reverse()
        }
    },
    watch: {
        $route: function () {
            this.checkRouteMeta()
            this.mobileMenuOpen = false
        }
    },
    mounted () {
        this.checkRouteMeta()
        alerts.subscribe(this.alertReceived)
        dialog.bind(this.$refs.dialog, this.showDialogHandler)
    },
    methods: {
        toggleMenu () {
            this.mobileMenuOpen = !this.mobileMenuOpen
        },
        checkRouteMeta () {
            for (let l = 0; l < this.$route.matched.length; l++) {
                const level = this.$route.matched[l]
                if (level.meta.hideSideMenu) {
                    this.hideTeamOptions = true
                    break
                }
            }
        },
        alertReceived (msg, type, countdown) {
            this.alerts.push({
                message: msg,
                type,
                countdown,
                timestamp: Date.now()
            })
        },
        showDialogHandler (msg, onConfirm, onCancel) {
            if (typeof (msg) === 'string') {
                this.dialog.content = msg
            } else {
                // msg is an object, let's break it apart
                this.dialog.header = msg.header
                this.dialog.text = msg.text
                this.dialog.html = msg.html
                this.dialog.confirmLabel = msg.confirmLabel
                this.dialog.kind = msg.kind
                this.dialog.disablePrimary = msg.disablePrimary
            }
            this.dialog.onConfirm = onConfirm
            this.dialog.onCancel = onCancel
        },
        clearDialog (cancelled) {
            if (cancelled) {
                this.dialog.onCancel?.()
            }
            this.dialog = {
                header: null,
                text: null,
                html: null,
                confirmLabel: null,
                kind: null,
                onConfirm: null,
                onCancel: null
            }
        },
        clear (i) {
            this.alerts.splice(this.alerts.length - 1 - i, 1)
        }
    }
}
</script>
