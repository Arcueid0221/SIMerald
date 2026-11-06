import type { CardsResponse, SimCard } from '@shared/types'
import type { Continent } from '@/utils/continentHelper'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { CONTINENTS, getContinent } from '@/utils/continentHelper'

export interface CardGroup {
  /** Continent code, also the tab value persisted in `cardSelectedGroup` */
  name: Continent
}

const useCardsStore = defineStore('cards', () => {
  const cards = ref<SimCard[]>([])
  const full = ref(false)
  const demo = ref(false)
  const syncedAt = ref<string | null>(null)

  const totalCount = computed(() => cards.value.length)
  const activeCount = computed(() => cards.value.filter(c => c.status === 'active').length)

  /** Continents that have at least one card, in `CONTINENTS` display order */
  const groups = computed<CardGroup[]>(() => {
    const present = new Set(cards.value.map(card => getContinent(card.region)))
    return CONTINENTS.filter(name => present.has(name)).map(name => ({ name }))
  })

  const cardsById = computed(() => {
    const map = new Map<string, SimCard>()
    for (const card of cards.value)
      map.set(card.id, card)
    return map
  })

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
    setCards,
    clear,
  }
})

export { useCardsStore }
