import type { CurrencyCode, ExchangeRates } from '@/utils/financeHelper'
import { ref } from 'vue'
import * as financeHelper from '@/utils/financeHelper'

const rates = ref<ExchangeRates>(financeHelper.DEFAULT_EXCHANGE_RATES)
const baseCurrency = ref<CurrencyCode>('CNY')
let loading: Promise<void> | null = null

/**
 * 全站共享一份每日汇率，避免卡片墙、顶部卡片、详情页各自请求一次。
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
