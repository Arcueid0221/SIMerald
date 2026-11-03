import type { SimCard, SimRecord } from '../shared/types.ts'

/**
 * 公开接口的打码。用白名单的方式挑出可以公开的字段，
 * 这样以后给 SimCard 加了新的敏感字段，也不会不小心公开出去。
 */

function publicRecord(record: SimRecord): SimRecord {
  return {
    id: record.id,
    type: record.type,
    date: record.date,
    amount: record.amount,
    currency: record.currency,
    rate: record.rate,
    amountCNY: record.amountCNY,
    extendsTo: record.extendsTo,
  }
}

export function toPublicCard(card: SimCard): SimCard {
  return {
    id: card.id,
    name: card.name,
    carrier: card.carrier,
    last4: card.last4,
    numberMasked: card.numberMasked,
    region: card.region,
    countryName: card.countryName,
    typeKind: card.typeKind,
    typeColor: card.typeColor,
    keepAlive: card.keepAlive,
    cycleDays: card.cycleDays,
    cycleLabel: card.cycleLabel,
    price: card.price,
    currency: card.currency,
    expiresAt: card.expiresAt,
    nextRenewalAt: card.nextRenewalAt,
    nextRenewalEnd: card.nextRenewalEnd,
    periodStart: card.periodStart,
    status: card.status,
    statusLabel: card.statusLabel,
    cancelledAt: card.cancelledAt,
    firstPurchaseAt: card.firstPurchaseAt,
    totalSpentCNY: card.totalSpentCNY,
    urgency: card.urgency,
    order: card.order,
    history: card.history.map(publicRecord),
    logo: card.logo ?? null,
  }
}

export function toPublicCards(cards: SimCard[]): SimCard[] {
  return cards.map(toPublicCard)
}
