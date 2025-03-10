<template>
    <LockClosedIcon v-if="icon === 'security'" class="ff-icon" />
    <CogIcon v-if="icon === 'settings'" class="ff-icon" />
    <ProjectIcon v-if="icon === 'project'" class="ff-icon text-red-700" />
    <NodeRedIcon v-if="icon === 'nodered'" class="ff-icon text-red-700" />
    <ClockIcon v-if="icon === 'clock'" class="ff-icon text-purple-700" />
    <BeakerIcon v-if="icon === 'beaker'" class="ff-icon text-yellow-600" />
    <DesktopComputerIcon v-if="icon === 'stacks'" class="ff-icon text-red-700" />
    <ColorSwatchIcon v-if="icon === 'project-types'" class="ff-icon text-red-700" />
    <ChipIcon v-if="icon === 'device'" class="ff-icon text-blue-700" />
    <MailIcon v-if="icon === 'mail'" class="ff-icon text-green-700" />
    <IdentificationIcon v-if="icon === 'user-profile'" class="ff-icon text-green-700" />
    <UserIcon v-if="icon === 'user'" class="ff-icon text-green-700" />
    <UserGroupIcon v-if="icon === 'users'" class="ff-icon text-teal-700" />
    <CurrencyDollarIcon v-if="icon === 'billing'" class="ff-icon text-yellow-500" />
    <KeyIcon v-if="icon === 'key'" class="ff-icon text-green-700" />
    <KeyIcon v-if="icon === 'overage'" class="ff-icon text-red-700" />
    <LoginIcon v-if="icon === 'login'" class="ff-icon text-blue-700" />
    <LogoutIcon v-if="icon === 'logout'" class="ff-icon text-gray-600" />
    <ExclamationCircleIcon v-if="icon === 'error'" class="ff-icon text-red-500" />
    <TicketIcon v-if="icon === 'token'" class="ff-icon text-blue-500" />
    <TemplateIcon v-if="icon === 'template'" class="ff-icon text-red-700" />
    <PipelineIcon v-if="icon === 'pipeline'" class="ff-icon text-indigo-600" />
    <ExclamationIcon v-if="icon === 'resource'" class="ff-icon text-yellow-500" />
</template>

<script>

import {
    BeakerIcon, ChipIcon, ClockIcon, CogIcon,
    ColorSwatchIcon, CurrencyDollarIcon, DesktopComputerIcon,
    ExclamationCircleIcon, ExclamationIcon, IdentificationIcon,
    KeyIcon, LockClosedIcon, LoginIcon, LogoutIcon, MailIcon,
    TemplateIcon, TicketIcon, UserGroupIcon, UserIcon
} from '@heroicons/vue/outline'

import NodeRedIcon from '../icons/NodeRed.js'
import PipelineIcon from '../icons/Pipelines.js'
import ProjectIcon from '../icons/Projects.js'

const iconMap = {
    error: [
        'error'
    ],
    nodered: [
        'crashed',
        'stopped',
        'settings.update',
        'flows.set',
        'library.set',
        'nodes.install',
        'nodes.remove',
        'context.delete'
    ],
    template: [
        'application.created',
        'application.updated',
        'application.deleted'
    ],
    project: [
        'project.created',
        'project.deleted',
        'project.duplicated',
        'project.started',
        'project.start-failed',
        'project.stopped',
        'project.restarted',
        'project.suspended'
    ],
    'project-types': [
        'platform.project-type.created',
        'platform.project-type.deleted',
        'platform.project-type.updated',
        'project.type.changed'
    ],
    stacks: [
        'platform.stack.created',
        'platform.stack.deleted',
        'platform.stack.updated',
        'project.stack.changed',
        'project.stack.restart'
    ],
    login: [
        'account.login',
        'auth.login' // node-red event
    ],
    logout: [
        'account.logout',
        'auth.logout' // node-red event
    ],
    security: [
        'account.verify.auto-create-team',
        'account.verify.request-token',
        'account.verify.verify-token',
        'user.updated-password',
        'account.forgot-password',
        'account.reset-password'
    ],
    key: [
        'platform.license.applied',
        'platform.license.inspected',
        'platform.licence.apply',
        'platform.licence.inspect'
    ],
    overage: [
        'platform.license.overage'
    ],
    settings: [
        'project.copied',
        'project.imported',
        'platform.settings.updated',
        'platform.settings.update',
        'team.settings.updated',
        'project.settings.updated',
        'team.type.changed'
    ],
    'user-profile': [
        'account.register',
        'user.updated-user',
        'users.updated-user',
        'team.user.role-changed',
        'user.roleChanged' // legacy event
    ],
    user: [
        'users.created-user',
        'users.deleted-user',
        'team.user.added',
        'team.user.removed',
        'user.added', // legacy event
        'user.removed' // legacy event
    ],
    users: [
        'team.created',
        'team.deleted',
        'platform.team.created',
        'platform.team.deleted',
        'users.auto-created-team'
    ],
    mail: [
        'user.invite.accepted',
        'user.invite.deleted',
        'team.user.invited',
        'team.user.uninvited',
        'team.user.invite.accepted',
        'team.user.invite.rejected',
        'user.invited', // legacy event
        'user.invite.accept', // legacy event
        'user.invitations.accept-invite', // legacy event
        'user.invite.delete', // legacy event
        'user.uninvited', // legacy event
        'user.invitations.delete-invite'
    ],
    billing: [
        'billing.session.completed',
        'billing.session.created',
        'billing.subscription.updated',
        'billing.subscription.deleted',
        'billing.subscription.credit-applied'
    ],
    clock: [
        'project.snapshot.created',
        'project.device.snapshot.created',
        'project.snapshot.deleted',
        'project.snapshot.rollback',
        'project.snapshot.rolled-back',
        'project.snapshot.imported'
    ],
    device: [
        'project.device.unassigned',
        'project.device.assigned',
        'application.device.unassigned',
        'application.device.assigned',
        'application.device.snapshot.created',
        'application.device.snapshot.deleted',
        'application.device.snapshot.device-target-set',
        'project.snapshot.device-target-set',
        'team.device.created',
        'team.device.deleted',
        'team.device.updated',
        'team.device.unassigned',
        'team.device.assigned',
        'team.device.credentials-generated',
        'team.device.credentialsGenerated', // legacy event
        'project.snapshot.deviceTarget' // legacy event
    ],
    beaker: [
        'team.device.developer-mode.enabled',
        'team.device.developer-mode.disabled',
        'team.device.remote-access.enabled',
        'team.device.remote-access.disabled'
    ],
    token: [
        'team.device.provisioning.created',
        'team.device.provisioning.updated',
        'team.device.provisioning.deleted'
    ],
    pipeline: [
        'application.pipeline.created',
        'application.pipeline.updated',
        'application.pipeline.deleted',
        'application.pipeline.stage-added',
        'project.assigned-to-pipeline-stage'
    ],
    resource: [
        'resource.cpu',
        'resource.memory'
    ]
}

export default {
    name: 'AuditLogIcon',
    props: {
        event: {
            required: true,
            type: String
        }
    },
    setup (props) {
        for (const [icon, events] of Object.entries(iconMap)) {
            if (events.includes(props.event)) {
                return {
                    icon
                }
            }
        }
        return {
            icon: 'default'
        }
    },
    components: {
        PipelineIcon,
        BeakerIcon,
        DesktopComputerIcon,
        LockClosedIcon,
        ProjectIcon,
        NodeRedIcon,
        TemplateIcon,
        ChipIcon,
        ColorSwatchIcon,
        MailIcon,
        CogIcon,
        KeyIcon,
        ClockIcon,
        IdentificationIcon,
        UserIcon,
        UserGroupIcon,
        LoginIcon,
        LogoutIcon,
        CurrencyDollarIcon,
        ExclamationCircleIcon,
        ExclamationIcon,
        TicketIcon
    }
}
</script>
