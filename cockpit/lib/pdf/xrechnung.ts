import type { PdfDocumentData } from "./document";
import { computeTotals, lineNet } from "../domain/totals";

/*
 * E-Rechnung im Format XRechnung 3.0 (UN/CEFACT CII, EN 16931).
 * Ab 2027/2028 Pflicht im B2B-Bereich. Vor dem ersten produktiven Einsatz
 * einmal mit einem Validator (z. B. dem KoSIT-Validator) prüfen.
 */

const UNIT_CODES: Record<string, string> = {
  Stück: "C62",
  Stunde: "HUR",
  Tag: "DAY",
  Monat: "MON",
  Pauschale: "LS",
  km: "KMT",
  Video: "C62",
  Beitrag: "C62",
};

const x = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const amt = (cents: number) => (cents / 100).toFixed(2);
const date = (iso: string) => `<udt:DateTimeString format="102">${iso.replace(/-/g, "")}</udt:DateTimeString>`;

export function eInvoiceWarnings(data: PdfDocumentData, customerEmail: string | null): string[] {
  const w: string[] = [];
  const c = data.company;
  if (!c.street || !c.zip || !c.city) w.push("Eure Firmenadresse (Einstellungen → Firma)");
  if (!c.email) w.push("Eure E-Mail-Adresse (Einstellungen → Firma)");
  if (!c.phone) w.push("Eure Telefonnummer (Einstellungen → Firma)");
  if (!c.vatId && !c.taxNumber) w.push("Steuernummer oder USt-IdNr. (Einstellungen → Firma)");
  if (!c.iban) w.push("IBAN (Einstellungen → Firma)");
  if (!data.customer.street || !data.customer.zip || !data.customer.city) w.push("Adresse des Kunden");
  if (!customerEmail) w.push("E-Mail-Adresse des Kunden");
  return w;
}

export function buildXRechnung(data: PdfDocumentData, opts: { customerEmail: string | null; paidCents?: number }): string {
  const c = data.company;
  const ku = data.invoicing.kleinunternehmer;
  const totals = computeTotals(data.items.filter((i) => !i.optional), data.discountPercent, ku);
  const typeCode = data.kind === "storno" ? "381" : "380";
  const cat = (rate: number) => (ku ? "E" : rate === 0 ? "Z" : "S");
  const exemption = ku ? "<ram:ExemptionReason>Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß § 19 UStG</ram:ExemptionReason>" : "";
  const sellerName = [c.name, c.legalForm].filter(Boolean).join(" ");

  const lines = data.items
    .filter((i) => !i.optional)
    .map(
      (item, idx) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${idx + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${x(item.title)}</ram:Name>${item.description ? `\n        <ram:Description>${x(item.description)}</ram:Description>` : ""}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${amt(item.unitPrice)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${UNIT_CODES[item.unit] ?? "C62"}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${cat(item.taxRate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${ku ? 0 : item.taxRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amt(lineNet(item))}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`,
    )
    .join("");

  // Basis je Steuersatz vor Rabatt
  const baseByRate = new Map<number, number>();
  for (const i of data.items.filter((i) => !i.optional)) {
    const r = ku ? 0 : i.taxRate;
    baseByRate.set(r, (baseByRate.get(r) ?? 0) + lineNet(i));
  }

  const taxes = totals.byRate
    .map(
      (r) => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amt(r.tax)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>${exemption ? `\n        ${exemption}` : ""}
        <ram:BasisAmount>${amt(r.net)}</ram:BasisAmount>
        <ram:CategoryCode>${cat(r.rate)}</ram:CategoryCode>
        <ram:RateApplicablePercent>${r.rate}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`,
    )
    .join("");

  const allowances =
    totals.discount > 0
      ? totals.byRate
          .map((r) => {
            const allowance = (baseByRate.get(r.rate) ?? 0) - r.net;
            if (allowance <= 0) return "";
            return `
      <ram:SpecifiedTradeAllowanceCharge>
        <ram:ChargeIndicator><udt:Indicator>false</udt:Indicator></ram:ChargeIndicator>
        <ram:ActualAmount>${amt(allowance)}</ram:ActualAmount>
        <ram:Reason>Rabatt ${data.discountPercent} %</ram:Reason>
        <ram:CategoryTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${cat(r.rate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${r.rate}</ram:RateApplicablePercent>
        </ram:CategoryTradeTax>
      </ram:SpecifiedTradeAllowanceCharge>`;
          })
          .join("")
      : "";

  const lineTotal = [...baseByRate.values()].reduce((s, v) => s + v, 0);
  const due = Math.max(0, totals.gross - (opts.paidCents ?? 0));
  const deliveryDate = data.serviceTo ?? data.serviceFrom ?? data.issueDate;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${x(data.number)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>${date(data.issueDate)}</ram:IssueDateTime>${data.title ? `\n    <ram:IncludedNote><ram:Content>${x(data.title)}</ram:Content></ram:IncludedNote>` : ""}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${x(data.customer.number)}</ram:BuyerReference>
      <ram:SellerTradeParty>
        <ram:Name>${x(sellerName)}</ram:Name>
        <ram:DefinedTradeContact>
          <ram:PersonName>${x(c.owners || sellerName)}</ram:PersonName>
          <ram:TelephoneUniversalCommunication><ram:CompleteNumber>${x(c.phone)}</ram:CompleteNumber></ram:TelephoneUniversalCommunication>
          <ram:EmailURIUniversalCommunication><ram:URIID>${x(c.email)}</ram:URIID></ram:EmailURIUniversalCommunication>
        </ram:DefinedTradeContact>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${x(c.zip)}</ram:PostcodeCode>
          <ram:LineOne>${x(c.street)}</ram:LineOne>
          <ram:CityName>${x(c.city)}</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${x(c.email)}</ram:URIID></ram:URIUniversalCommunication>${c.vatId ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${x(c.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}${c.taxNumber ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${x(c.taxNumber)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${x(data.customer.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${x(data.customer.zip)}</ram:PostcodeCode>
          <ram:LineOne>${x(data.customer.street)}</ram:LineOne>
          <ram:CityName>${x(data.customer.city)}</ram:CityName>
          <ram:CountryID>${!data.customer.country || data.customer.country === "Deutschland" ? "DE" : x(data.customer.country.slice(0, 2).toUpperCase())}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${x(opts.customerEmail)}</ram:URIID></ram:URIUniversalCommunication>${data.customer.vatId ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${x(data.customer.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime>${date(deliveryDate)}</ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${x(data.number)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${x(c.iban.replace(/\s/g, ""))}</ram:IBANID>
          <ram:AccountName>${x(sellerName)}</ram:AccountName>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>${taxes}${
        data.serviceFrom && data.serviceTo
          ? `
      <ram:BillingSpecifiedPeriod>
        <ram:StartDateTime>${date(data.serviceFrom)}</ram:StartDateTime>
        <ram:EndDateTime>${date(data.serviceTo)}</ram:EndDateTime>
      </ram:BillingSpecifiedPeriod>`
          : ""
      }${allowances}
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${data.dueDate ? `Zahlbar bis ${data.dueDate.split("-").reverse().join(".")} ohne Abzug` : "Zahlbar sofort ohne Abzug"}</ram:Description>${data.dueDate ? `\n        <ram:DueDateDateTime>${date(data.dueDate)}</ram:DueDateDateTime>` : ""}
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amt(lineTotal)}</ram:LineTotalAmount>
        <ram:ChargeTotalAmount>0.00</ram:ChargeTotalAmount>
        <ram:AllowanceTotalAmount>${amt(totals.discount)}</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${amt(totals.net)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amt(totals.tax)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amt(totals.gross)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${amt(opts.paidCents ?? 0)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${amt(due)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>${
        data.kind === "storno" && data.referenceNumber
          ? `
      <ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${x(data.referenceNumber)}</ram:IssuerAssignedID></ram:InvoiceReferencedDocument>`
          : ""
      }
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
