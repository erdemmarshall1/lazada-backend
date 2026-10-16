<template>
  <div class="html-editor">
    <div class="he-toolbar" v-if="!sourceMode">
      <button type="button" class="he-btn" title="Bold" @mousedown.prevent="exec('bold')"><b>B</b></button>
      <button type="button" class="he-btn" title="Italic" @mousedown.prevent="exec('italic')"><i>I</i></button>
      <button type="button" class="he-btn" title="Underline" @mousedown.prevent="exec('underline')"><u>U</u></button>
      <span class="he-sep"></span>
      <button type="button" class="he-btn" title="Heading" @mousedown.prevent="exec('formatBlock', 'H3')">H3</button>
      <button type="button" class="he-btn" title="Paragraph" @mousedown.prevent="exec('formatBlock', 'P')">P</button>
      <span class="he-sep"></span>
      <button type="button" class="he-btn" title="Bullet list" @mousedown.prevent="exec('insertUnorderedList')">&bull; List</button>
      <button type="button" class="he-btn" title="Numbered list" @mousedown.prevent="exec('insertOrderedList')">1. List</button>
      <span class="he-sep"></span>
      <button type="button" class="he-btn" title="Insert link" @mousedown.prevent="insertLink">Link</button>
      <button type="button" class="he-btn" title="Insert image URL" @mousedown.prevent="insertImage">Image</button>
      <button type="button" class="he-btn" title="Clear formatting" @mousedown.prevent="exec('removeFormat')">Clear</button>
      <span class="he-spacer"></span>
      <button type="button" class="he-btn he-toggle" title="Toggle HTML source" @mousedown.prevent="sourceMode = true">&lt;/&gt; Source</button>
    </div>
    <div class="he-toolbar" v-else>
      <span class="he-source-label">HTML Source</span>
      <span class="he-spacer"></span>
      <button type="button" class="he-btn he-toggle" @mousedown.prevent="sourceMode = false">WYSIWYG</button>
    </div>

    <div
      v-if="!sourceMode"
      ref="editorRef"
      class="he-content"
      :style="{ minHeight: height }"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="onInput"
      @blur="onInput"
    ></div>
    <textarea
      v-else
      ref="sourceRef"
      class="he-content he-source"
      :style="{ minHeight: height }"
      :value="inner"
      @input="onSourceInput"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write description…' },
  height: { type: String, default: '180px' },
})
const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
const sourceRef = ref(null)
const sourceMode = ref(false)
const inner = ref(props.modelValue || '')
let syncing = false

const setEditable = (html) => {
  if (editorRef.value && editorRef.value.innerHTML !== (html || '')) {
    editorRef.value.innerHTML = html || ''
  }
}

const exec = (cmd, val) => {
  if (sourceMode.value) return
  editorRef.value?.focus()
  try { document.execCommand(cmd, false, val || null) } catch {}
  onInput()
}

const insertLink = () => {
  const url = window.prompt('Enter URL', 'https://')
  if (url) exec('createLink', url)
}

const insertImage = () => {
  const url = window.prompt('Enter image URL', 'https://')
  if (url) exec('insertImage', url)
}

const onInput = () => {
  if (syncing) return
  const html = editorRef.value?.innerHTML || ''
  inner.value = html
  emit('update:modelValue', html)
}

const onSourceInput = (e) => {
  inner.value = e.target.value
  emit('update:modelValue', inner.value)
}

watch(() => props.modelValue, (val) => {
  if (val === inner.value) return
  inner.value = val || ''
  if (!sourceMode.value) {
    syncing = true
    nextTick(() => { setEditable(inner.value); syncing = false })
  }
})

watch(sourceMode, (mode) => {
  if (!mode) {
    nextTick(() => { setEditable(inner.value); syncing = false })
  } else {
    nextTick(() => sourceRef.value?.focus())
  }
})

onMounted(() => setEditable(inner.value))
</script>

<style scoped>
.html-editor { border: 1px solid var(--el-border-color, #dcdfe6); border-radius: 6px; overflow: hidden; background: #fff; }
.he-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 6px 8px; background: #f7f8fa; border-bottom: 1px solid var(--el-border-color, #dcdfe6); }
.he-btn { border: 1px solid transparent; background: transparent; color: #444; font-size: 12px; line-height: 1; padding: 5px 8px; border-radius: 4px; cursor: pointer; }
.he-btn:hover { background: #e9ecf2; border-color: #d8dce3; }
.he-sep { width: 1px; height: 16px; background: #dcdfe6; margin: 0 2px; }
.he-spacer { flex: 1 1 auto; }
.he-toggle { color: #4a5a7a; font-weight: 600; }
.he-source-label { font-size: 12px; color: #666; padding: 5px 8px; }
.he-content { padding: 12px 14px; font-size: 14px; line-height: 1.7; color: #333; outline: none; overflow-y: auto; max-height: 420px; }
.he-content:empty::before { content: attr(data-placeholder); color: #a8abb2; }
.he-content :deep(img) { max-width: 100%; height: auto; }
.he-content :deep(a) { color: var(--g-main_color, #409eff); }
.he-content :deep(ul), .he-content :deep(ol) { padding-left: 22px; margin: 6px 0; }
.he-source { width: 100%; border: none; resize: vertical; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; }
</style>
