import type { CurrencyCode, ExchangeRates } from '@/utils/financeHelper'
import { ref } from 'vue'
import * as financeHelper from '@/utils/financeHelper'

const rates = ref<ExchangeRates>(financeHelper.DEFAULT_EXCHANGE_RATES)
const baseCurrency = ref<CurrencyCode>('CNY')
let loading: Promise<void> | null = null

/**
 * Singleton daily exchange-rate state shared across the card wall, summary bar, and detail modal.
 */
export function useExchangeRates() {
  if (!loading) {
    baseCurrency.value = financeHelper.getStoredFinanceCurrency()
    loading = financeHelper.getDailyExchangeRates()
      .then(({ rates: next }) => {
        rates.value = next
      })
      .catch(() => {})
  }

  function setBaseCurrency(currency: CurrencyCode): void {
    baseCurrency.value = currency
    financeHelper.setStoredFinanceCurrency(currency)
  }

  return { rates, baseCurrency, setBaseCurrency }
}
