<template>
    <form class="space-y-4" @submit.prevent>
        <FormHeading>Editor</FormHeading>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.disableEditor" type="checkbox" :disabled="!editTemplate && !editable.policy.disableEditor">
                    Disable editor
                    <template #description>
                        Disable the editor for this instance. The only way to modify the running flows will be to re-enable the editor and restart the instance, or use the Admin API.
                    </template>
                    <template #append><ChangeIndicator :value="editable.changed.settings.disableEditor" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.disableEditor" :editTemplate="editTemplate" :changed="editable.changed.policy.disableEditor" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.disableTours" type="checkbox" :disabled="!editTemplate && !editable.policy.disableTours">
                    Disable Welcome Tour
                    <template #description>
                        Disable the Welcome Tour when accessing the editor the first time.
                    </template>
                    <template #append><ChangeIndicator :value="editable.changed.settings.disableTours" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.disableTours" :editTemplate="editTemplate" :changed="editable.changed.policy.disableTours" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.httpAdminRoot" :error="editable.errors.httpAdminRoot" :disabled="!editTemplate && editable.policy.httpAdminRoot === false" type="text">
                    Editor URL Path
                    <template #description>
                        The path used to serve the editor
                    </template>
                    <template #append><ChangeIndicator :value="editable.changed.settings.httpAdminRoot" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.httpAdminRoot" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.httpAdminRoot" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.dashboardUI" :error="editable.errors.dashboardUI" :disabled="!editTemplate && !editable.policy.dashboardUI" type="text">
                    Dashboard URL Path
                    <template #description>
                        The path used to serve the node-red-dashboard UI
                    </template>
                    <template #append><ChangeIndicator :value="editable.changed.settings.dashboardUI" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.dashboardUI" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.dashboardUI" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.codeEditor" :disabled="!editTemplate && !editable.policy.codeEditor" type="select" :options="[{label:'monaco', value:'monaco'},{label:'ace', value:'ace'}]">
                    Code Editor
                    <template #append><ChangeIndicator :value="editable.changed.settings.codeEditor" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.codeEditor" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.codeEditor" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.header_title" :error="editable.errors.header_title" :disabled="!editTemplate && !editable.policy.header_title" type="text">
                    Editor Title
                    <template #description>
                        The title to show in the header
                    </template>
                    <template #append><ChangeIndicator :value="editable.changed.settings.header_title" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.header_title" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.header_title" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.theme" :disabled="!editTemplate && !editable.policy.theme" type="select" :options="themes">
                    Editor Theme
                    <template #append><ChangeIndicator :value="editable.changed.settings.theme" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.theme" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.theme" />
        </div>
        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.timeZone" :disabled="!editTemplate && !editable.policy.timeZone" type="select" :options="timezones">
                    Time Zone
                    <template #append><ChangeIndicator :value="editable.changed.settings.timeZone" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.timeZone" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.timeZone" />
        </div>
        <FormHeading class="pt-8">External Modules</FormHeading>
        <div class="flex flex-col sm:flex-row">
            <div class="space-y-4 w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.modules_allowInstall" type="checkbox" :disabled="!editTemplate && !editable.policy.modules_allowInstall">
                    Allow user to install new modules in the Function node
                    <template #append><ChangeIndicator :value="editable.changed.settings.modules_allowInstall" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.modules_allowInstall" :editTemplate="editTemplate" :changed="editable.changed.policy.modules_allowInstall" />
        </div>

        <div class="flex flex-col sm:flex-row">
            <div class="w-full max-w-md sm:mr-8">
                <FormRow v-model="editable.settings.modules_denyList" :disabled="!editTemplate && !editable.policy.modules_denyList" :error="editable.errors.modules_denyList" :type="(editTemplate||editable.policy.modules_denyList)?'text':'uneditable'">
                    Prevent Install of External modules
                    <template #description>
                        This can be used to prevent the installation of modules in Function nodes. A comma-separated list of the form e.g. <pre>'package-name@semVer, foo@^0.1.0, @scope/*'</pre>
                    </template>
                    <template #append><ChangeIndicator :value="editable.changed.settings.modules_denyList" /></template>
                </FormRow>
            </div>
            <LockSetting v-model="editable.policy.modules_denyList" class="flex justify-end flex-col" :editTemplate="editTemplate" :changed="editable.changed.policy.modules_denyList" />
        </div>
    </form>
</template>

<script>
import FormHeading from '../../../../components/FormHeading.vue'
import FormRow from '../../../../components/FormRow.vue'
import timezonesData from '../../../../data/timezones.json'
import ChangeIndicator from '../components/ChangeIndicator.vue'
import LockSetting from '../components/LockSetting.vue'
export default {
    name: 'TemplateSettingsEditor',
    components: {
        FormRow,
        FormHeading,
        LockSetting,
        ChangeIndicator
    },
    props: {
        editTemplate: {
            type: Boolean,
            default: false
        },
        modelValue: {
            type: Object,
            default: null
        }
    },
    emits: ['update:modelValue'],
    data () {
        return {
            timezones: timezonesData.timezones,
            themes: [
                { label: 'FlowFuse Light', value: 'forge-light' },
                { label: 'FlowFuse Dark', value: 'forge-dark' }
            ] // FUTURE: Get from theme plugins
        }
    },
    computed: {
        editable: {
            get () {
                return this.modelValue
            },
            set (localValue) {
                this.$emit('update:modelValue', localValue)
            }
        }
    }
}
</script>
