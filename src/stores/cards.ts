import type { CardsResponse, SimCard } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { shortTypeLabel } from '@/utils/cardHelpers'

export interface CardGroup {
  name: string
  label: string
}

const useCardsStore = defineStore('cards', () => {
  const cards = ref<SimCard[]>([])
  const full = ref(false)
  const demo = ref(false)
  const syncedAt = ref<string | null>(null)

  const totalCount = computed(() => cards.value.length)
  const activeCount = computed(() => cards.value.filter(c => c.status === 'active').length)

  /** 分组 = 卡片类型，按在 Notion 里第一次出现的顺序 */
  const groups = computed<CardGroup[]>(() => {
    const seen = new Map<string, CardGroup>()
    for (const card of [...cards.value].sort((a, b) => a.order - b.order)) {
      const name = card.type || '未分类'
      if (!seen.has(name))
        seen.set(name, { name, label: shortTypeLabel(name) })
    }
    return Array.from(seen.values())
  })

  const cardsById = computed(() => {
    const map = new Map<string, SimCard>()
    for (const card of cards.value)
      map.set(card.id, card)
    return map
  })

  /** 单张卡累计花费的最大值，卡片上的「花费」进度条以它为 100% */
  const maxSpendCNY = computed(() => cards.value.reduce((max, c) => Math.max(max, c.totalSpentCNY ?? 0), 0))

  function setCards(response: CardsResponse): void {
    cards.value = response.cards
    full.value = response.full
    demo.value = response.demo
    syncedAt.value = response.syncedAt
  }

  function clear(): void {
    cards.value = []
  }

  return {
    cards,
    full,
    demo,
    syncedAt,
    totalCount,
    activeCount,
    groups,
    cardsById,
    maxSpendCNY,
    setCards,
    clear,
  }
})

export { useCardsStore }
