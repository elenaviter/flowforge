<template>
    <div class="ff-input ff-text-input" :class="{'ff-input--error': error}">
        <slot name="icon" />
        <input
            ref="input"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :value="modelValue"
            :maxlength="maxlength"
            @change="$emit('update:modelValue', $event.target.value)"
            @input="$emit('update:modelValue', $event.target.value)"
            @blur="$emit('blur')" @keyup.enter="$emit('enter', $evt)"
        />
    </div>
</template>

<script>
export default {
    name: 'ff-text-input',
    props: {
        // broker standard text-input props
        disabled: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: ''
        },
        maxlength: {
            type: String,
            default: ''
        },
        // flowfuse specific props
        size: {
            default: 'normal',
            type: String // "small", "normal"
        },
        type: {
            default: 'text', // One of: 'text', 'email', or 'password'
            type: String
        },
        // v-model
        modelValue: {
            type: String,
            default: ''
        }
    },
    emits: ['update:modelValue', 'input', 'blur', 'keyup', 'enter'],
    methods: {
        focus () {
            this.$refs.input?.focus()
        },
        blur () {
            this.$refs.input?.blur()
        }
    }
}
</script>
