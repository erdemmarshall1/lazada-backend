<template>
  <div class="ls-root">
    <button class="ls-trigger" :class="{ 'ls-trigger--admin': admin }" @click="toggleOpen" :title="currentLang.name">
      <span class="ls-trigger-flag">{{ currentLang.flag }}</span>
      <span class="ls-trigger-label">{{ currentLang.native }}</span>
      <svg class="ls-trigger-chevron" :class="{ open: isOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
    </button>

    <teleport to="body">
      <div v-if="isOpen" class="ls-overlay" @click="close" @keydown.escape="close"></div>
      <div v-if="isOpen" class="ls-panel" :class="{ 'ls-panel--admin': admin }" ref="panelRef" tabindex="-1" @keydown="onKeydown">
        <div class="ls-header">
          <div class="ls-search">
            <svg class="ls-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input ref="searchInput" v-model="searchQuery" type="text" :placeholder="$t('language.searchPlaceholder')" @input="onSearchInput" />
            <button v-if="searchQuery" class="ls-clear" @click="setSearch('')">&times;</button>
          </div>
          <button class="ls-close" @click="close">&times;</button>
        </div>

        <div class="ls-region-tabs">
          <button v-for="rk in regionKeys" :key="rk" class="ls-region-tab" :class="{ active: regionFilter === rk }" @click="setRegion(rk)">
            {{ $t(`language.${rk}`) }}
          </button>
        </div>

        <div class="ls-list" ref="listRef">
          <div v-if="recentLanguages.length > 0 && regionFilter === 'all' && !searchQuery" class="ls-section">
            <div class="ls-section-label">{{ $t('language.recent') }}</div>
            <div class="ls-grid">
              <button v-for="lang in recentLanguages" :key="lang.code" class="ls-item" :class="{ active: lang.code === currentLang.code }" @click="select(lang.code)" :data-code="lang.code">
                <span class="ls-item-flag">{{ lang.flag }}</span>
                <div class="ls-item-info">
                  <span class="ls-item-native">{{ lang.native }}</span>
                  <span class="ls-item-name">{{ lang.name }}</span>
                </div>
                <span v-if="lang.code === currentLang.code" class="ls-item-check">&#10003;</span>
                <span v-else-if="lang.code === detectedCode" class="ls-item-detect">{{ $t('language.detected') }}</span>
              </button>
            </div>
          </div>

          <div class="ls-section">
            <div v-if="recentLanguages.length > 0 && regionFilter === 'all' && !searchQuery" class="ls-section-label">{{ $t('language.allLanguages') }}</div>
            <div class="ls-grid">
              <button v-for="lang in filteredLanguages" :key="lang.code" class="ls-item" :class="{ active: lang.code === currentLang.code }" @click="select(lang.code)" :data-code="lang.code">
                <span class="ls-item-flag">{{ lang.flag }}</span>
                <div class="ls-item-info">
                  <span class="ls-item-native">{{ lang.native }}</span>
                  <span class="ls-item-name">{{ lang.name }}</span>
                </div>
                <span v-if="lang.code === currentLang.code" class="ls-item-check">&#10003;</span>
                <span v-else-if="lang.code === detectedCode && !recentLanguages.find(r => r.code === lang.code)" class="ls-item-detect">{{ $t('language.detected') }}</span>
              </button>
            </div>
            <div v-if="filteredLanguages.length === 0" class="ls-empty">{{ $t('language.noResults') }}</div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useLanguage, LANGUAGE_DATA, REGION_KEYS } from '@/composables/useLanguage'

const props = defineProps({
  admin: { type: Boolean, default: false },
})

const { currentLang, recentLanguages, filteredLanguages, searchQuery, regionFilter, isOpen, detectedCode, changeLanguage, setSearch, setRegion, toggleOpen, close } = useLanguage()

const panelRef = ref(null)
const listRef = ref(null)
const searchInput = ref(null)
const focusIndex = ref(-1)

const regionKeys = REGION_KEYS

async function select(code) {
  await changeLanguage(code)
  close()
}

function onSearchInput() {
  focusIndex.value = -1
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    close()
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const items = listRef.value?.querySelectorAll('.ls-item:not(.ls-hidden)') || []
    if (!items.length) return
    if (e.key === 'ArrowDown') {
      focusIndex.value = focusIndex.value < items.length - 1 ? focusIndex.value + 1 : 0
    } else {
      focusIndex.value = focusIndex.value > 0 ? focusIndex.value - 1 : items.length - 1
    }
    items[focusIndex.value]?.focus()
  }
  if (e.key === 'Enter' && focusIndex.value >= 0) {
    const items = listRef.value?.querySelectorAll('.ls-item:not(.ls-hidden)') || []
    const code = items[focusIndex.value]?.dataset?.code
    if (code) select(code)
  }
}

watch(isOpen, async (val) => {
  if (val) {
    await nextTick()
    panelRef.value?.focus()
    searchInput.value?.focus()
    focusIndex.value = -1
  } else {
    setSearch('')
    setRegion('all')
  }
})
</script>

<style scoped>
.ls-root { position: relative; display: flex; align-items: center; }

.ls-trigger {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  padding: 4px 8px; border-radius: 6px;
  color: #192537; font-size: 13px;
  transition: background 0.2s;
}
.ls-trigger:hover { background: rgba(0,0,0,0.04); }
.ls-trigger--admin { color: rgba(255,255,255,0.7); }
.ls-trigger--admin:hover { background: rgba(255,255,255,0.06); color: #fff; }
.ls-trigger-flag { font-size: 18px; line-height: 1; }
.ls-trigger-label { font-weight: 500; white-space: nowrap; }
.ls-trigger-chevron { transition: transform 0.2s; }
.ls-trigger-chevron.open { transform: rotate(180deg); }

.ls-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.3);
}

.ls-panel {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 10000;
  width: 440px; max-width: calc(100vw - 32px);
  max-height: calc(100vh - 64px);
  background: #fff; border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  outline: none; overflow: hidden;
}
.ls-panel--admin { background: #1a1d2e; color: rgba(255,255,255,0.85); }

.ls-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 16px 0;
}
.ls-search {
  flex: 1; display: flex; align-items: center; gap: 8px;
  background: #f5f5f5; border-radius: 8px; padding: 8px 12px;
  border: 1px solid transparent; transition: border-color 0.2s, background 0.2s;
}
.ls-panel--admin .ls-search { background: rgba(255,255,255,0.06); }
.ls-search:focus-within { border-color: #667eea; background: #fff; }
.ls-panel--admin .ls-search:focus-within { background: rgba(255,255,255,0.1); border-color: #667eea; }
.ls-search-icon { flex-shrink: 0; color: #999; }
.ls-panel--admin .ls-search-icon { color: rgba(255,255,255,0.35); }
.ls-search input {
  flex: 1; border: none; background: none; outline: none;
  font-size: 14px; color: inherit;
}
.ls-search input::placeholder { color: #aaa; }
.ls-panel--admin .ls-search input::placeholder { color: rgba(255,255,255,0.3); }
.ls-clear {
  background: none; border: none; cursor: pointer;
  font-size: 18px; color: #999; padding: 0; line-height: 1;
}
.ls-close {
  background: none; border: none; cursor: pointer;
  font-size: 22px; color: #999; padding: 4px 8px; border-radius: 4px;
  line-height: 1;
}
.ls-close:hover { background: rgba(0,0,0,0.06); }
.ls-panel--admin .ls-close { color: rgba(255,255,255,0.4); }
.ls-panel--admin .ls-close:hover { background: rgba(255,255,255,0.06); }

.ls-region-tabs {
  display: flex; gap: 4px; padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.ls-panel--admin .ls-region-tabs { border-bottom-color: rgba(255,255,255,0.06); }
.ls-region-tab {
  background: none; border: none; cursor: pointer;
  padding: 5px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 600; color: #666;
  transition: all 0.2s; letter-spacing: 0.3px;
}
.ls-panel--admin .ls-region-tab { color: rgba(255,255,255,0.5); }
.ls-region-tab:hover { background: rgba(0,0,0,0.04); color: #333; }
.ls-panel--admin .ls-region-tab:hover { background: rgba(255,255,255,0.06); color: #fff; }
.ls-region-tab.active { background: #192537; color: #fff; }
.ls-panel--admin .ls-region-tab.active { background: #667eea; }

.ls-list {
  flex: 1; overflow-y: auto; padding: 8px 16px 16px;
}
.ls-list::-webkit-scrollbar { width: 4px; }
.ls-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

.ls-section { margin-bottom: 8px; }
.ls-section-label {
  font-size: 11px; font-weight: 700; color: #999;
  text-transform: uppercase; letter-spacing: 0.8px;
  margin: 8px 0 6px;
}
.ls-panel--admin .ls-section-label { color: rgba(255,255,255,0.3); }

.ls-grid { display: flex; flex-direction: column; gap: 2px; }

.ls-item {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px; border-radius: 8px;
  background: none; border: none; cursor: pointer;
  text-align: left; width: 100%;
  transition: background 0.15s;
  color: inherit; font-family: inherit;
}
.ls-item:hover { background: rgba(0,0,0,0.04); }
.ls-panel--admin .ls-item:hover { background: rgba(255,255,255,0.05); }
.ls-item:focus-visible { outline: 2px solid #667eea; outline-offset: -2px; }
.ls-item.active { background: rgba(102,126,234,0.1); }
.ls-panel--admin .ls-item.active { background: rgba(102,126,234,0.15); }
.ls-item-flag { font-size: 22px; line-height: 1; flex-shrink: 0; }
.ls-item-info { flex: 1; min-width: 0; }
.ls-item-native { display: block; font-size: 14px; font-weight: 500; }
.ls-item-name { display: block; font-size: 11px; color: #999; }
.ls-panel--admin .ls-item-name { color: rgba(255,255,255,0.35); }
.ls-item-check { color: #667eea; font-size: 14px; font-weight: 700; flex-shrink: 0; }
.ls-item-detect {
  font-size: 10px; font-weight: 700; color: #fff;
  background: #667eea; border-radius: 10px;
  padding: 1px 8px; letter-spacing: 0.3px;
  flex-shrink: 0;
}
.ls-empty {
  text-align: center; padding: 24px; color: #999; font-size: 13px;
}

@media (max-width: 640px) {
  .ls-panel {
    top: auto; bottom: 0; left: 0; right: 0; transform: none;
    width: 100%; max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }
}
</style>
