<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { Icon } from '@iconify/vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, defineAsyncComponent, nextTick, onActivated, onDeactivated, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useAppStore } from '@/stores/app'
import { useCardsStore } from '@/stores/cards'
import { sortCards } from '@/utils/cardHelpers'
import { isRegionMatch } from '@/utils/regionHelper'

defineOptions({ name: 'HomeView' })

const SimCardItem = defineAsyncComponent(() => import('@/components/SimCard.vue'))
const SummaryCards = defineAsyncComponent(() => import('@/components/SummaryCards.vue'))
const SimList = defineAsyncComponent(() => import('@/components/SimList.vue'))
const RenewalHistory = defineAsyncComponent(() => import('@/components/RenewalHistory.vue'))

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
const selectedHistoryCardId = ref<string | null>(null)

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
  return group === 'all' || (card.type || '未分类') === group
}

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

const selectedHistoryCard = computed(() => {
  if (!selectedHistoryCardId.value)
    return null
  return cardsStore.cardsById.get(selectedHistoryCardId.value) ?? null
})

const historyDialogOpen = computed({
  get: () => selectedHistoryCard.value !== null,
  set: (open: boolean) => {
    if (!open)
      selectedHistoryCardId.value = null
  },
})

function handleCardClick(card: SimCard) {
  router.push({ name: 'card-detail', params: { id: card.id } })
}

function handleHistoryClick(card: SimCard) {
  selectedHistoryCardId.value = card.id
}

function getNodeItemTransitionKey(card: SimCard): string {
  return `${appStore.nodeSelectedGroup}-${card.id}`
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
              <Button
                variant="outline" size="icon" aria-label="卡片视图"
                class="h-8 w-8 border-none shadow-none rounded-md"
                :class="[pickSurfaceClass('bg-background hover:bg-background/95', 'bg-background/50 hover:bg-background/60 backdrop-blur-xs'), appStore.nodeViewMode === 'card' ? '!text-emerald-600 !bg-background' : '']"
                @click="appStore.nodeViewMode = 'card'"
              >
                <Icon icon="tabler:layout-grid" :width="14" :height="14" />
              </Button>
              <Button
                variant="outline" size="icon" aria-label="列表视图"
                class="h-8 w-8 border-none shadow-none rounded-md"
                :class="[pickSurfaceClass('bg-background hover:bg-background/95', 'bg-background/50 hover:bg-background/60 backdrop-blur-xs'), appStore.nodeViewMode === 'list' ? '!text-emerald-600 !bg-background' : '']"
                @click="appStore.nodeViewMode = 'list'"
              >
                <Icon icon="tabler:table" :width="14" :height="14" />
              </Button>
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
              v-if="cardList.length !== 0 && appStore.nodeViewMode === 'card'"
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
                <SimCardItem :card="card" @click="handleCardClick(card)" @history-click="handleHistoryClick" />
              </div>
            </TransitionGroup>
            <SimList
              v-else-if="cardList.length !== 0 && appStore.nodeViewMode === 'list'"
              :cards="cardList"
              :transition-key="appStore.nodeSelectedGroup"
              @click="handleCardClick"
              @history-click="handleHistoryClick"
            />
            <div v-else class="text-muted-foreground text-center py-8">
              <Empty :description="debouncedSearchText.trim() ? '没有找到匹配的号码' : '暂无号码'" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    <Dialog v-model:open="historyDialogOpen">
      <DialogContent
        v-if="selectedHistoryCard"
        class="max-w-6xl gap-0 overflow-hidden border-emerald-600/10 p-0 shadow-[0_0_2rem] shadow-emerald-800/10 transition-all"
        :class="pickSurfaceClass('bg-background', 'bg-background/60')"
      >
        <DialogHeader class="flex h-13 flex-row items-center px-4">
          <DialogTitle class="truncate">
            {{ selectedHistoryCard.name }} 续费记录
          </DialogTitle>
          <div class="absolute inset-0 mx-0 max-w-none overflow-hidden bg-slate-50 dark:bg-slate-900/50 -z-9 zoom-90">
            <div class="absolute top-0 left-1/2 -ml-152 h-100 w-325 dark:mask-[linear-gradient(white,transparent)]">
              <div
                class="absolute inset-0 bg-linear-to-r from-emerald-500 to-lime-300 mask-[radial-gradient(farthest-side_at_top,white,transparent)] opacity-40 dark:from-emerald-500/30 dark:to-lime-300/30 dark:opacity-100"
              >
                <svg
                  aria-hidden="true"
                  class="absolute inset-x-0 inset-y-[-50%] h-[200%] w-full skew-y-[-18deg] fill-black/40 stroke-black/50 mix-blend-overlay dark:fill-white/2.5 dark:stroke-white/5"
                >
                  <defs>
                    <pattern id="_S_1_" width="72" height="56" patternUnits="userSpaceOnUse" x="-12" y="4">
                      <path d="M.5 56V.5H72" fill="none" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" stroke-width="0" fill="url(#_S_1_)" /><svg
                    x="-12" y="4"
                    class="overflow-visible"
                  >
                    <rect stroke-width="0" width="73" height="57" x="288" y="168" />
                    <rect stroke-width="0" width="73" height="57" x="144" y="56" />
                    <rect stroke-width="0" width="73" height="57" x="504" y="168" />
                    <rect stroke-width="0" width="73" height="57" x="720" y="336" />
                  </svg>
                </svg>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div class="max-h-[calc(90vh-4rem)] overflow-y-auto p-4 pt-0">
          <RenewalHistory :card="selectedHistoryCard" plain />
        </div>
      </DialogContent>
    </Dialog>
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
