<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { Icon } from '@iconify/vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, defineAsyncComponent, nextTick, onActivated, onDeactivated, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import CardStyleIcon from '@/components/sim-card/CardStyleIcon.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { CARD_STYLES, useAppStore } from '@/stores/app'
import { useCardsStore } from '@/stores/cards'
import { sortCards } from '@/utils/cardHelpers'
import { getContinent } from '@/utils/continentHelper'
import { isRegionMatch } from '@/utils/regionHelper'

defineOptions({ name: 'HomeView' })

const SimCardItem = defineAsyncComponent(() => import('@/components/SimCard.vue'))
const SummaryCards = defineAsyncComponent(() => import('@/components/SummaryCards.vue'))

const nodeItemStaggerMs = 35
const nodeItemStaggerLimit = 12

const appStore = useAppStore()
const { pickSurfaceClass } = useBackgroundSurface()
const cardsStore = useCardsStore()
const router = useRouter()

onActivated(() => {
  if (appStore.homeScrollPosition > 0) {
    nextTick(() => {
      window.scrollTo({ top: appStore.homeScrollPosition, behavior: 'instant' })
    })
  }
})

onDeactivated(() => {
  appStore.homeScrollPosition = window.scrollY
})

const searchText = ref('')
const debouncedSearchText = ref('')

const updateDebouncedSearch = useDebounceFn((value: string) => {
  debouncedSearchText.value = value
}, 300)

watch(searchText, (value) => {
  updateDebouncedSearch(value)
})

const groups = computed(() => [
  { tab: '全部号码', name: 'all' },
  ...cardsStore.groups.map(g => ({ tab: g.label, name: g.name })),
])

watch(
  () => cardsStore.groups,
  (gs) => {
    const cur = appStore.nodeSelectedGroup
    if (cur !== 'all' && !gs.some(g => g.name === cur)) {
      appStore.nodeSelectedGroup = 'all'
    }
  },
  { immediate: true },
)

function isCardInGroup(card: SimCard, group: string): boolean {
  return group === 'all' || getContinent(card.region) === group
}

const CARD_STYLE_LABELS = {
  namecard: '名片',
  badge: '徽章',
  dial: '表盘',
  bar: '横条',
} as const

const cardStyleOptions = CARD_STYLES.map(value => ({ value, label: CARD_STYLE_LABELS[value] }))

function isCardMatchSearch(card: SimCard, search: string): boolean {
  if (!search.trim())
    return true
  const lowerSearch = search.toLowerCase().trim()
  const haystack = [card.name, card.carrier, card.countryName, card.type, card.device ?? '', card.last4, ...card.keepAlive]
  if (haystack.some(text => text.toLowerCase().includes(lowerSearch)))
    return true
  if (card.region && isRegionMatch(card.region, search))
    return true
  if (card.number && card.number.includes(lowerSearch))
    return true
  return false
}

const groupCardList = computed(() => {
  return cardsStore.cards.filter(card => isCardInGroup(card, appStore.nodeSelectedGroup))
})

const cardList = computed(() => {
  let filtered = groupCardList.value
  if (debouncedSearchText.value.trim()) {
    filtered = filtered.filter(card => isCardMatchSearch(card, debouncedSearchText.value))
  }
  const sorted = sortCards(filtered, appStore.defaultSort)
  if (!appStore.cancelledLast)
    return sorted
  // 稳定排序：已注销的号码放到最后，其余保持原有顺序
  return [...sorted].sort((a, b) => Number(a.status === 'cancelled') - Number(b.status === 'cancelled'))
})

function handleCardClick(card: SimCard) {
  router.push({ name: 'card-detail', params: { id: card.id } })
}

function getNodeItemTransitionKey(card: SimCard): string {
  return `${appStore.nodeSelectedGroup}-${appStore.cardStyle}-${card.id}`
}

function getNodeItemTransitionStyle(index: number): Record<string, string> {
  return {
    '--node-item-delay': `${Math.min(index, nodeItemStaggerLimit) * nodeItemStaggerMs}ms`,
  }
}
</script>

<template>
  <div class="home-view">
    <div v-if="appStore.connectionError" class="alert px-4">
      <Alert
        variant="destructive"
        :class="pickSurfaceClass('border-none bg-red-400/10 rounded-md', 'border-none bg-red-400/10 backdrop-blur-xs rounded-md')"
      >
        <AlertTitle>连接服务器失败</AlertTitle>
        <AlertDescription>请检查网络设置或刷新页面后再试。</AlertDescription>
      </Alert>
    </div>

    <div v-if="cardsStore.demo" class="alert px-4">
      <Alert :class="pickSurfaceClass('border-none bg-background rounded-md', 'border-none bg-background/60 backdrop-blur-xs rounded-md')">
        <AlertTitle>当前显示的是演示数据</AlertTitle>
        <AlertDescription>
          站长还没有连接 Notion，下面的号码和运营商都是虚构的。<RouterLink v-if="appStore.isLoggedIn" to="/admin" class="text-emerald-600 underline-offset-4 hover:underline">
            去后台连接 Notion
          </RouterLink>
        </AlertDescription>
      </Alert>
    </div>

    <div v-if="appStore.alertEnabled && appStore.alertContent" class="alert px-4">
      <Alert :class="pickSurfaceClass('border-none bg-background rounded-md', 'border-none bg-background/60 backdrop-blur-xs rounded-md')">
        <AlertTitle v-if="appStore.alertTitle">
          {{ appStore.alertTitle }}
        </AlertTitle>
        <AlertDescription>
          <MarkdownRenderer :content="appStore.alertContent" />
        </AlertDescription>
      </Alert>
    </div>

    <SummaryCards
      v-if="appStore.earthViewMode !== 'hide'"
      :cards="groupCardList"
      :globe-cards="groupCardList"
      :transition-key="appStore.nodeSelectedGroup"
    />

    <div class="node-info p-4 pt-0 flex flex-col gap-4 relative z-1 md:pointer-events-none" :class="appStore.earthViewMode === 'hide' && 'pt-4'">
      <div class="nodes">
        <Tabs v-model="appStore.nodeSelectedGroup" class="w-full flex-col gap-4">
          <div class="flex gap-2 items-start flex-nowrap">
            <div class="overflow-x-auto rounded-sm md:pointer-events-auto">
              <TabsList :class="pickSurfaceClass('w-max h-8 bg-background/60 rounded-md', 'w-max h-8 bg-background/50 backdrop-blur-xl rounded-md')">
                <TabsTrigger
                  v-for="g in groups" :key="g.name" :value="g.name"
                  class="h-6.5 flex-none shrink-0 text-xs border-none data-[state=active]:text-emerald-600 shadow-none rounded-sm"
                >
                  {{ g.tab }}
                </TabsTrigger>
              </TabsList>
            </div>
            <div class="ml-auto search flex gap-2 items-center pointer-events-auto">
              <div
                class="flex h-8 items-center gap-0.5 rounded-md p-[3px]"
                :class="pickSurfaceClass('bg-background/60', 'bg-background/50 backdrop-blur-xl')"
                role="radiogroup" aria-label="卡片样式"
              >
                <button
                  v-for="option in cardStyleOptions" :key="option.value"
                  type="button" role="radio" :aria-checked="appStore.cardStyle === option.value" :title="`${option.label}样式`"
                  class="inline-flex h-6.5 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                  :class="appStore.cardStyle === option.value && '!text-emerald-600 bg-background dark:bg-input/30'"
                  @click="appStore.cardStyle = option.value"
                >
                  <CardStyleIcon :card-style="option.value" class="size-3.5 shrink-0" />
                  <span class="hidden sm:inline">{{ option.label }}</span>
                </button>
              </div>
              <div class="relative z-1 w-8 h-8">
                <div class="absolute top-0 right-0 ">
                  <Input
                    v-model="searchText" placeholder="搜索运营商、国家、号码后 4 位"
                    class="h-8 w-8 rounded-md border-none shadow-none transition-all placeholder:text-transparent focus:!w-60 focus:!pl-7.5 focus:placeholder:!text-muted-foreground focus:!ring-emerald-500/10"
                    :class="pickSurfaceClass('bg-background hover:!bg-background/95 focus:!bg-background', 'bg-background/50 hover:!bg-background/60 focus:!bg-background/80 backdrop-blur-xs')"
                  />
                  <Icon
                    icon="tabler:search" :width="14" :height="14"
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <TabsContent :key="appStore.nodeSelectedGroup" :value="appStore.nodeSelectedGroup" class="pointer-events-auto">
            <TransitionGroup
              v-if="cardList.length !== 0"
              :appear="!appStore.disablePageAnimation"
              :css="!appStore.disablePageAnimation"
              name="node-card-switch"
              tag="div"
              class="gap-3 grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
            >
              <div
                v-for="(card, index) in cardList"
                :key="getNodeItemTransitionKey(card)"
                class="min-w-0"
                :style="getNodeItemTransitionStyle(index)"
              >
                <SimCardItem :card="card" :card-style="appStore.cardStyle" @click="handleCardClick(card)" />
              </div>
            </TransitionGroup>
            <div v-else class="text-muted-foreground text-center py-8">
              <Empty :description="debouncedSearchText.trim() ? '没有找到匹配的号码' : '暂无号码'" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-card-switch-enter-active,
.node-card-switch-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 180ms ease;
}

.node-card-switch-enter-active {
  transition-delay: var(--node-item-delay, 0ms);
}

.node-card-switch-move {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.node-card-switch-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
  filter: blur(3px);
}

.node-card-switch-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .node-card-switch-enter-active,
  .node-card-switch-leave-active,
  .node-card-switch-move {
    transition: none;
    transition-delay: 0ms;
  }

  .node-card-switch-enter-from,
  .node-card-switch-leave-to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
</style>
